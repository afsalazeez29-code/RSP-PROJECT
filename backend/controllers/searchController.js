const Recipe = require('../models/recipesDetails');
const User = require('../models/Users');
const { serializeRecipe } = require('./recipeController');

const search = async (req, res, next) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, data: { recipes: [], users: [] } });
    }

    const regex = new RegExp(q, 'i');

    const [recipes, users] = await Promise.all([
      Recipe.find({
        isDraft: false,
        $or: [
          { title: regex },
          { description: regex },
          { category: regex },
          { tags: regex },
          { 'ingredients.name': regex }
        ]
      })
        .select('_id legacyId title description image imageUrl category cookTime difficulty difficultyLevel rating ratingCount createdBy')
        .populate('createdBy', 'name username')
        .limit(8),
      User.find({
        $or: [
          { username: regex },
          { name: regex }
        ]
      })
        .select('_id name username profileImage bio')
        .limit(5)
        .lean()
    ]);

    const recipeResults = recipes.map((recipe) => {
      const serialized = serializeRecipe(recipe, { currentUserId: req.user._id });
      return {
        ...serialized,
        recipeId: serialized.id || serialized._id || serialized.legacyId,
        imageUrl: serialized.imageUrl || serialized.image || '',
        category: Array.isArray(serialized.category) ? serialized.category[0] : serialized.category
      };
    });

    return res.json({
      success: true,
      data: {
        recipes: recipeResults,
        users: users.map((user) => ({
          _id: user._id.toString(),
          id: user._id.toString(),
          userId: user._id.toString(),
          name: user.name,
          fullName: user.name,
          username: user.username,
          profileImage: user.profileImage || '',
          bio: user.bio || ''
        }))
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { search };
