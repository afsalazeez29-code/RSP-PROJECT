const Recipe = require('../models/recipesDetails');
const User = require('../models/Users');
const { serializeRecipe } = require('./recipeController');
const { buildProfileStats } = require('../utils/profileStats');
const { listUserActivities } = require('../utils/activity');

const serializeDashboardUser = (user) => ({
  id: user._id.toString(),
  _id: user._id.toString(),
  name: user.name,
  username: user.username,
  email: user.email,
  profileImage: user.profileImage || '',
  bio: user.bio || '',
  location: user.location || '',
  favoriteCuisine: user.favoriteCuisine || '',
  createdAt: user.createdAt
});

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [user, profileData, savedUser, recentActivities] = await Promise.all([
      User.findById(userId),
      buildProfileStats(userId, { includeDrafts: true }),
      User.findById(userId).select('savedRecipes'),
      listUserActivities(userId, { limit: req.query.limit || 20 })
    ]);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const myRecipes = profileData.recipes.map((recipe) => serializeRecipe(recipe, { currentUserId: userId }));
    const published = profileData.recipes.filter((recipe) => !recipe.isDraft);
    const sortByMetric = (metric) => [...published]
      .filter((recipe) => Number(recipe[metric] || 0) > 0)
      .sort((a, b) => Number(b[metric] || 0) - Number(a[metric] || 0) || new Date(b.createdAt) - new Date(a.createdAt));

    const byViews = sortByMetric('views').slice(0, 5).map((recipe) => serializeRecipe(recipe, { currentUserId: userId }));
    const byLikes = sortByMetric('likes').slice(0, 5).map((recipe) => serializeRecipe(recipe, { currentUserId: userId }));

    const savedIds = Array.isArray(savedUser?.savedRecipes) ? savedUser.savedRecipes : [];
    const savedDocs = await Recipe.find({ _id: { $in: savedIds }, isDraft: false })
      .populate('createdBy', 'name username profileImage')
      .sort({ updatedAt: -1, createdAt: -1 });

    return res.json({
      success: true,
      user: serializeDashboardUser(user),
      stats: profileData.stats,
      performanceHighlights: {
        mostViewed: byViews[0] || null,
        mostLiked: byLikes[0] || null
      },
      topRecipes: {
        byViews,
        byLikes
      },
      myRecipes,
      savedRecipes: savedDocs.map((recipe) => serializeRecipe(recipe, { currentUserId: userId })),
      recentActivities
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getDashboard };
