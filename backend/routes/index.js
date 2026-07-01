var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const User = require('../models/Users');
const Recipe = require('../models/recipesDetails');
const authMiddleware = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');

const deleteRecipeImage = async (recipe) => {
  if (recipe?.imagePublicId) {
    await cloudinary.deleteFromCloudinary(recipe.imagePublicId);
  }
};

let upload = null;
try {
  const multer = require('multer');
  upload = multer({
    dest: path.join(__dirname, '../uploads'),
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
  });
} catch (err) {
  console.warn('multer is not installed, image upload will be disabled.');
}

if (!upload) {
  console.warn('For /add-recipe file uploads, install multer: npm install multer');
}

/* GET home page */
router.get('/', function (req, res, next) {
  res.send("Backend is working 🚀");
});



//    Registration API


router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // 1. Check empty fields
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // 2. Check password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // 3. Check email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // 4. Create user (✅ schema will hash password)
    const newUser = new User({ name, email, password });
    await newUser.save();

    // 5. Success response
    res.status(201).json({ message: 'User registered successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Login post api

//  LOGIN API
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check empty fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // 2. Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
    }

    // 3. Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 4. Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Send response
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage || ""
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Logout API

router.post('/logout', (req, res) => {
  res.status(200).json({
    message: 'Logged out successfully'
  });
});

// Change Password API
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    // Find the user
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('CHANGE PASSWORD ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// add recipe API


router.post('/add-recipe', authMiddleware, upload ? upload.single('image') : (req, res, next) => next(), async (req, res) => {
  try {
    console.log('DEBUG /add-recipe req.body:', req.body);
    console.log('DEBUG /add-recipe req.file:', req.file);

    let {
      title,
      difficultyLevel,
      category,
      image,
      ingredients,
      instructions,
      cookTime,
      serves
    } = req.body;

    // image assignment must happen before any validation
    if (!image && req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    if (!image && req.body.image) {
      image = req.body.image;
    }

    // Special handling: multipart file upload without multer
    if (!upload && req.is('multipart/form-data')) {
      return res.status(400).json({ message: 'multer is required for multipart/form-data upload. Install multer or use image URL JSON payload.' });
    }

    // validation after image assignment
    if (
      !title ||
      !difficultyLevel ||
      !category ||
      !image ||
      !ingredients ||
      !instructions ||
      !cookTime ||
      !serves
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Normalize inputs
    let ingredientsArray = [];
    let instructionsArray = [];
    let duration = cookTime;
    let categoryArray = category;

    if (typeof category === 'string') {
      try {
        const parsed = JSON.parse(category);
        if (Array.isArray(parsed)) {
          categoryArray = parsed;
        } else {
          categoryArray = [parsed];
        }
      } catch {
        categoryArray = [category];
      }
    }

    if (typeof ingredients === 'string') {
      try {
        const parsed = JSON.parse(ingredients);
        if (Array.isArray(parsed)) {
          ingredients = parsed;
        }
      } catch {
        // leave as original string for fallback
      }
    }

    if (Array.isArray(ingredients)) {
      ingredientsArray = ingredients.map(item => {
        if (typeof item === 'string') {
          return { name: item.trim(), qty: '', unit: 'g' };
        }
        return {
          name: (item.name || '').toString().trim(),
          qty: (item.qty || '').toString(),
          unit: item.unit || 'g'
        };
      });
    } else if (typeof ingredients === 'string') {
      ingredientsArray = ingredients.split(',').map(item => ({
        name: item.trim(),
        qty: '',
        unit: 'g'
      }));
    }
    ingredientsArray = ingredientsArray.filter(item => item && item.name && item.name.trim());

    if (typeof instructions === 'string') {
      try {
        const parsed = JSON.parse(instructions);
        if (Array.isArray(parsed)) {
          instructions = parsed;
        }
      } catch {
        // leave as string fallback
      }
    }

    if (Array.isArray(instructions)) {
      instructionsArray = instructions.map(item => {
        if (typeof item === 'string') {
          return { text: item.trim() };
        }
        return { text: (item.text || '').toString().trim() };
      });
    } else if (typeof instructions === 'string') {
      instructionsArray = instructions.split(',').map(item => ({
        text: item.trim()
      }));
    }
    instructionsArray = instructionsArray.filter(item => item && item.text && item.text.trim());

    if (typeof cookTime === 'string') {
      duration = parseInt(cookTime, 10);
    }

    // Fallback for invalid parse
    if (!Array.isArray(ingredientsArray)) ingredientsArray = [];
    if (!Array.isArray(instructionsArray)) instructionsArray = [];
    if (!Array.isArray(categoryArray)) categoryArray = [categoryArray];
    if (ingredientsArray.length === 0) {
      return res.status(400).json({ message: 'At least one valid ingredient is required' });
    }
    if (instructionsArray.length === 0) {
      return res.status(400).json({ message: 'At least one valid instruction step is required' });
    }

    const newRecipe = new Recipe({
      title,
      difficultyLevel,
      category: categoryArray,
      image,
      ingredients: ingredientsArray,
      instructions: instructionsArray,
      cookTime: duration,
      serves,
      createdBy: req.user.userId
    });

    await newRecipe.save();

    res.status(201).json({
      message: 'Recipe added successfully',
      data: newRecipe
    });

  } catch (error) {
    console.error("ADD RECIPE ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// update API


router.put('/update-recipe/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const recipe = await Recipe.findById(req.params.id);

    // 1. Check recipe exists
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // 2. Check ownership
    const recipeOwnerId = recipe.createdBy && recipe.createdBy.toString ? recipe.createdBy.toString() : null;
    if (!recipeOwnerId || recipeOwnerId !== req.user.userId) {
      return res.status(403).json({ message: 'You are not allowed to update this recipe' });
    }

    // 3. Update (only fields present)
    const allowedUpdates = ['title', 'difficultyLevel', 'category', 'image', 'ingredients', 'instructions', 'cookTime', 'serves', 'isDraft'];
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (updates.category && typeof updates.category === 'string') {
      updates.category = [updates.category];
    }

    if (updates.ingredients) {
      if (typeof updates.ingredients === 'string') {
        updates.ingredients = updates.ingredients.split(',').map(item => ({
          name: item.trim(),
          qty: '',
          unit: 'g'
        }));
      } else if (Array.isArray(updates.ingredients)) {
        updates.ingredients = updates.ingredients.map(item => {
          if (typeof item === 'string') {
            return { name: item.trim(), qty: '', unit: 'g' };
          }
          return {
            name: (item.name || '').toString().trim(),
            qty: (item.qty || '').toString(),
            unit: item.unit || 'g'
          };
        });
      }
    }

    if (updates.instructions) {
      if (typeof updates.instructions === 'string') {
        updates.instructions = updates.instructions.split(',').map(text => ({ text: text.trim() }));
      } else if (Array.isArray(updates.instructions)) {
        updates.instructions = updates.instructions.map(item => {
          if (typeof item === 'string') {
            return { text: item.trim() };
          }
          return { text: (item.text || '').toString().trim() };
        });
      }
    }

    if (updates.cookTime && typeof updates.cookTime === 'string') {
      updates.cookTime = parseInt(updates.cookTime, 10);
    }
    if (updates.serves && typeof updates.serves === 'string') {
      updates.serves = parseInt(updates.serves, 10);
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Recipe updated successfully',
      data: updatedRecipe
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete API

router.delete('/delete-recipe/:id', authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    // 1. Check recipe exists
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // 2. Check ownership
    if (recipe.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You are not allowed to delete this recipe' });
    }

    await deleteRecipeImage(recipe);

    // 3. Delete
    await Recipe.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: 'Recipe deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});



// Home Page API

router.get('/recipesView', async (req, res) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });

    res.status(200).json(recipes);

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Recipe Details API

router.get('/recipe/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('createdBy', 'name profileImage email');

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.status(200).json(recipe);

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search bar API

router.get('/recipes', async (req, res) => {
  try {
    const { category, search } = req.query;

    let filter = {};
    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const recipes = await Recipe.find(filter).sort({ createdAt: -1 });

    res.status(200).json(recipes);

  } catch (error) {
    console.error("Search API error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});


// create a home api for showing the image , title and description of the recipe every user can see the home page without login but to see the details of the recipe user have to login

router.get('/home', async (req, res) => {
  try {
    const recipes = await Recipe.find({}, 'title image cookTime serves').sort({ createdAt: -1 }).limit(12);

    res.status(200).json(recipes);

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


// create a api for allrecipes page where we will show all the recipes with pagination and sorting and filtering by category

router.get('/all-recipes', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, sortBy = 'createdAt', order = 'desc' } = req.query;

    const filter = category ? { category } : {};
    const sortOrder = order === 'asc' ? 1 : -1;

    const recipes = await Recipe.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalRecipes = await Recipe.countDocuments(filter);

    res.status(200).json({
      recipes,
      totalPages: Math.ceil(totalRecipes / limit),
      currentPage: parseInt(page)
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});



// Like Recipe API
router.put('/like-recipe/:id', authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const userId = req.user.userId;
    const likedBy = Array.isArray(recipe.likedBy) ? recipe.likedBy : [];
    const alreadyLiked = likedBy.some(id => id.toString() === userId.toString());

    if (alreadyLiked) {
      recipe.likedBy = likedBy.filter(id => id.toString() !== userId.toString());
    } else {
      recipe.likedBy = [...likedBy, userId];
    }
    recipe.likes = recipe.likedBy.length;

    await recipe.save();

    res.status(200).json({
      message: 'Recipe like status updated',
      likes: recipe.likes,
      likedBy: recipe.likedBy
    });

  } catch (error) {
    console.error("LIKE RECIPE ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Recipe API (also support /recipe/:id DELETE for frontend)
router.delete('/recipe/:id', authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    if (recipe.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await deleteRecipeImage(recipe);
    await Recipe.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard Stats API — user's recipe count + top-liked recipe
router.get('/dashboard-stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Total recipes by this user
    const totalRecipes = await Recipe.countDocuments({ createdBy: userId });

    // Find the user's recipe with the most likes
    const userRecipes = await Recipe.find({ createdBy: userId }, 'title image likes likedBy _id');
    let topRecipe = null;
    if (userRecipes.length > 0) {
      const getLikeCount = (recipe) => Number(recipe.likes) || 0;
      const sorted = userRecipes.sort((a, b) => getLikeCount(b) - getLikeCount(a));
      const best = sorted[0];
      topRecipe = {
        id: best._id,
        title: best.title,
        image: best.image,
        likeCount: getLikeCount(best)
      };
    }

    res.status(200).json({ totalRecipes, topRecipe });
  } catch (error) {
    console.error('DASHBOARD STATS ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
