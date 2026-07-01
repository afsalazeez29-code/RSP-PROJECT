const User = require('../models/Users');
const Recipe = require('../models/recipesDetails');
const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');
const { serializeRecipe } = require('./recipeController');
const { buildProfileStats } = require('../utils/profileStats');
const { createActivity } = require('../utils/activity');

const serializeUser = (user) => {
  if (!user) return null;
  const obj = typeof user.toSafeObject === 'function'
    ? user.toSafeObject()
    : (typeof user.toObject === 'function' ? user.toObject() : user);
  delete obj.password;
  delete obj.profileImagePublicId;
  delete obj.__v;
  obj.id = obj._id?.toString?.() || obj.id;
  return obj;
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const safeUser = serializeUser(user);
    const { stats, recipes } = await buildProfileStats(req.user._id, { includeDrafts: true });
    const serializedRecipes = recipes.map((recipe) => serializeRecipe(recipe, { currentUserId: req.user._id }));
    return res.json({
      success: true,
      data: { user: safeUser, stats, recipes: serializedRecipes },
      user: safeUser,
      stats,
      recipes: serializedRecipes
    });
  } catch (error) {
    return next(error);
  }
};

const getPublicProfile = async (req, res, next) => {
  try {
    const username = String(req.params.username || '').toLowerCase().trim();
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { stats, recipes } = await buildProfileStats(user._id, { includeDrafts: false });
    const safeUser = {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      username: user.username,
      profileImage: user.profileImage || '',
      bio: user.bio || '',
      createdAt: user.createdAt,
      location: user.location || '',
      favoriteCuisine: user.favoriteCuisine || ''
    };

    const serializedRecipes = recipes.map((recipe) => serializeRecipe(recipe));
    return res.json({ success: true, user: safeUser, stats, recipes: serializedRecipes, data: { user: safeUser, stats, recipes: serializedRecipes } });
  } catch (error) {
    return next(error);
  }
};

const updateProfileImage = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }

    const user = await User.findById(req.user._id).select('+password profileImagePublicId profileImage');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.profileImagePublicId) {
      try {
        await cloudinary.deleteImage(user.profileImagePublicId);
      } catch (error) {
        logger.warn(`Profile image cleanup failed: ${error.message}`);
      }
    }

    const uploaded = await cloudinary.uploadImage(req.file.buffer, 'profiles/');
    user.profileImage = uploaded.secure_url;
    user.profileImagePublicId = uploaded.public_id;
    await user.save();
    await createActivity({
      userId: req.user._id,
      type: 'UPDATE_PROFILE',
      message: 'You updated your profile.'
    });

    const safeUser = serializeUser(user);
    return res.json({ success: true, message: 'Profile image updated', data: { user: safeUser }, user: safeUser });
  } catch (error) {
    return next(error);
  }
};

const deleteProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password profileImagePublicId');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await cloudinary.deleteImage(user.profileImagePublicId);
    await Recipe.deleteMany({ createdBy: user._id });
    await User.findByIdAndDelete(user._id);

    return res.json({ success: true, message: 'User account deleted' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  serializeUser,
  getProfile,
  getPublicProfile,
  updateProfileImage,
  deleteProfile
};
