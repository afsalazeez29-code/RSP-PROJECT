const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../../models/Users');
const authMiddleware = require('../../middleware/auth');
const { createActivity } = require('../../utils/activity');

const serializeUser = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  profileImage: user.profileImage || '',
  bio: user.bio || '',
  location: user.location || '',
  favoriteCuisine: user.favoriteCuisine || '',
  isPrivate: Boolean(user.isPrivate),
  likedRecipes: Array.isArray(user.likedRecipes)
    ? user.likedRecipes.map((recipeId) => recipeId.toString())
    : [],
  createdAt: user.createdAt
});

const buildUsername = async (email, name) => {
  const base = String(email || name || '')
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '') || `user${Date.now()}`;

  let username = base;
  let suffix = 1;
  while (await User.exists({ username })) {
    username = `${base}${suffix}`;
    suffix += 1;
  }
  return username;
};

const signToken = (user) => jwt.sign(
  { userId: user._id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6 || password.length > 12) {
      return res.status(400).json({ message: 'Password must be between 6 and 12 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const username = await buildUsername(email, name);
    const user = new User({ name, username, email, password });
    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      token: signToken(user),
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return res.status(401).json({ message: 'Your account has been blocked' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      token: signToken(user),
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: serializeUser(user) });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, username, email, bio, profileImage, profileImagePublicId, location, favoriteCuisine, isPrivate } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    if (name) user.name = name;
    if (username !== undefined) user.username = username;
    if (email) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (profileImagePublicId !== undefined) user.profileImagePublicId = profileImagePublicId;
    if (location !== undefined) user.location = location;
    if (favoriteCuisine !== undefined) user.favoriteCuisine = favoriteCuisine;
    if (isPrivate !== undefined) user.isPrivate = Boolean(isPrivate);

    await user.save();
    await createActivity({
      userId: req.user._id || req.user.userId,
      type: 'UPDATE_PROFILE',
      message: 'You updated your profile.'
    });

    res.json({
      message: 'Profile updated successfully',
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

module.exports = router;
