const mongoose = require('mongoose');
const Recipe = require('../models/recipesDetails');

const toObjectId = (value) => (value instanceof mongoose.Types.ObjectId ? value : new mongoose.Types.ObjectId(value));

const buildProfileStats = async (userId, { includeDrafts = true } = {}) => {
  const createdBy = toObjectId(userId);
  const recipeMatch = includeDrafts ? { createdBy } : { createdBy, isDraft: false };
  const allRecipeMatch = { createdBy };

  const [
    totalRecipes,
    sharedRecipes,
    viewsAgg,
    likesAgg,
    ratingAgg,
    latestRecipe,
    recipes
  ] = await Promise.all([
    Recipe.countDocuments(recipeMatch),
    Recipe.countDocuments({ createdBy, isDraft: false }),
    Recipe.aggregate([
      { $match: allRecipeMatch },
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]),
    Recipe.aggregate([
      { $match: allRecipeMatch },
      { $group: { _id: null, total: { $sum: '$likes' } } }
    ]),
    Recipe.aggregate([
      { $match: { ...allRecipeMatch, ratingCount: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          stars: { $sum: { $multiply: ['$rating', '$ratingCount'] } },
          count: { $sum: '$ratingCount' }
        }
      }
    ]),
    Recipe.findOne(recipeMatch).sort({ createdAt: -1 }),
    Recipe.find(recipeMatch)
      .populate('createdBy', 'name username profileImage bio createdAt')
      .sort({ featured: -1, createdAt: -1 })
  ]);

  const avgRating = ratingAgg[0]?.count
    ? Number((ratingAgg[0].stars / ratingAgg[0].count).toFixed(1))
    : null;

  return {
    recipes,
    stats: {
      totalRecipes,
      recipesCount: totalRecipes,
      sharedRecipes,
      sharedRecipesCount: sharedRecipes,
      totalViews: viewsAgg[0]?.total || 0,
      totalLikes: likesAgg[0]?.total || 0,
      avgRating,
      latestRecipe: latestRecipe
        ? `${latestRecipe.title}${latestRecipe.cuisine ? ` (${latestRecipe.cuisine})` : ''}`
        : ''
    }
  };
};

module.exports = { buildProfileStats };
