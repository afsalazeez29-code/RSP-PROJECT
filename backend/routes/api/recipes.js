const express = require('express');
const upload = require('../../middleware/multer');
const auth = require('../../middleware/auth');
const { optionalAuth } = require('../../middleware/auth');
const asyncHandler = require('../../utils/asyncHandler');
const recipeController = require('../../controllers/recipeController');

const router = express.Router();

router.get('/', asyncHandler(recipeController.getRecipes));
router.get('/my', auth, asyncHandler(recipeController.getMyRecipes));
router.get('/user/my-recipes', auth, asyncHandler(recipeController.getMyRecipes));
router.get('/user/liked', auth, asyncHandler(recipeController.getLikedRecipes));
router.get('/user/saved', auth, asyncHandler(recipeController.getSavedRecipes));
router.get('/user/stats', auth, asyncHandler(recipeController.getUserStats));
router.get('/user/activity', auth, asyncHandler(recipeController.getUserActivity));
router.get('/:id', asyncHandler(recipeController.getRecipeById));
router.post('/', auth, upload.single('image'), asyncHandler(recipeController.createRecipe));
router.put('/:id', auth, upload.single('image'), asyncHandler(recipeController.updateRecipe));
router.delete('/:id', auth, asyncHandler(recipeController.deleteRecipe));
router.patch('/:id/view', optionalAuth, asyncHandler(recipeController.recordRecipeView));
router.post('/:id/copy', auth, asyncHandler(recipeController.copyRecipe));
router.post('/:id/like', auth, asyncHandler(recipeController.toggleLikeRecipe));
router.put('/:id/save', auth, asyncHandler(recipeController.toggleSaveRecipe));
router.post('/:id/react', auth, asyncHandler(recipeController.toggleReaction));
router.post('/:id/favorite', auth, asyncHandler(recipeController.addToFavorites));
router.post('/:id/rate', auth, asyncHandler(recipeController.rateRecipe));
router.post('/:id/reviews', auth, asyncHandler(recipeController.addReview));
router.put('/:id/reviews/:reviewId', auth, asyncHandler(recipeController.updateReview));
router.delete('/:id/reviews/:reviewId', auth, asyncHandler(recipeController.deleteReview));
router.post('/:id/share', auth, asyncHandler(recipeController.shareRecipe));

module.exports = router;

