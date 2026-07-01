const mongoose = require('mongoose');
const Recipe = require('../models/recipesDetails');
const User = require('../models/Users');
const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');
const { createActivity, listUserActivities } = require('../utils/activity');
const { buildProfileStats } = require('../utils/profileStats');

const DEFAULT_LIST_LIMIT = 12;
const MAX_LIST_LIMIT = 50;

const parseBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';

const parseArrayField = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  if (typeof value !== 'string') return [value];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
};

const normalizeDifficulty = (value) => {
  if (!value) return undefined;
  const lower = String(value).trim().toLowerCase();
  if (!['easy', 'medium', 'hard'].includes(lower)) return undefined;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const normalizeIngredients = (value) => parseArrayField(value)
  .map((item) => {
    if (!item) return null;
    if (typeof item === 'string') return { name: item.trim(), quantity: '', weight: '', qty: '', unit: '' };
    const name = String(item.name || '').trim();
    if (!name) return null;
    const quantity = String(item.quantity || item.qty || '').trim();
    const weight = String(item.weight || item.unit || '').trim();
    return {
      name,
      quantity,
      weight,
      qty: String(item.qty || quantity || '').trim(),
      unit: String(item.unit || weight || '').trim()
    };
  })
  .filter(Boolean);

const normalizeSteps = (value) => parseArrayField(value)
  .map((item, index) => {
    if (!item) return null;
    if (typeof item === 'string') {
      const text = item.trim();
      return text ? { step: index + 1, title: '', description: text, text } : null;
    }
    const description = String(item.description || item.text || '').trim();
    if (!description) return null;
    return {
      step: Number(item.step) || index + 1,
      title: String(item.title || '').trim(),
      description,
      text: String(item.text || description).trim()
    };
  })
  .filter(Boolean);

const parseImagePublicId = (imageUrl = '') => {
  const match = String(imageUrl).match(/\/upload\/v\d+\/(.+)\.[a-z0-9]+(?:\?.*)?$/i);
  return match ? match[1] : '';
};

const isRemoteImageUrl = (value = '') => /^https?:\/\//i.test(String(value));
const isCloudinaryUrl = (value = '') => /res\.cloudinary\.com/i.test(String(value));
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const MIN_IMAGE_BYTES = 100 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const uploadRemoteImage = async (imageUrl) => {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    const error = new Error('Unable to download image URL');
    error.statusCode = 400;
    throw error;
  }

  const contentType = String(response.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    const error = new Error('Image must be PNG, JPG, JPEG, or WEBP.');
    error.statusCode = 400;
    throw error;
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length < MIN_IMAGE_BYTES || buffer.length > MAX_IMAGE_BYTES) {
    const error = new Error('Image must be between 100KB and 5MB.');
    error.statusCode = 400;
    throw error;
  }

  return cloudinary.uploadImage(buffer, 'recipes/');
};

const getRecipeImageUrl = (recipe) => recipe.imageUrl || recipe.image || '';
const DEFAULT_REACTION_COUNTS = { delicious: 0, like: 0, fire: 0 };
const VALID_REACTION_TYPES = Object.keys(DEFAULT_REACTION_COUNTS);

const averageRating = (ratings = []) => {
  if (!ratings.length) return 0;
  const total = ratings.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  return Number((total / ratings.length).toFixed(1));
};

const getOwner = (owner) => {
  if (!owner || typeof owner !== 'object') return { id: null, _id: null, name: 'Unknown', username: '', profileImage: '', bio: '' };
  const id = owner._id?.toString?.() || owner.id?.toString?.() || null;
  return {
    id,
    _id: id,
    name: owner.name || 'Unknown',
    username: owner.username || '',
    profileImage: owner.profileImage || '',
    bio: owner.bio || '',
    createdAt: owner.createdAt || null
  };
};

const serializeRecipe = (recipe, { includeDetails = false, currentUserId = null } = {}) => {
  const obj = typeof recipe.toObject === 'function' ? recipe.toObject({ virtuals: true }) : recipe;
  const createdBy = getOwner(obj.createdBy);
  const likedBy = Array.isArray(obj.likedBy) ? obj.likedBy.map((id) => id.toString()) : [];
  const savedBy = Array.isArray(obj.savedBy) ? obj.savedBy.map((id) => id.toString()) : [];
  const currentId = currentUserId ? currentUserId.toString() : null;
  const steps = Array.isArray(obj.steps) ? obj.steps : [];
  const difficulty = obj.difficulty || normalizeDifficulty(obj.difficultyLevel) || 'Easy';
  const cloudinaryPublicId = obj.cloudinaryPublicId || obj.imagePublicId || '';

  const payload = {
    _id: obj._id?.toString?.(),
    id: obj._id?.toString?.(),
    legacyId: obj.legacyId,
    userId: createdBy.id,
    title: obj.title,
    description: obj.description || '',
    image: getRecipeImageUrl(obj),
    imageUrl: getRecipeImageUrl(obj),
    imagePublicId: cloudinaryPublicId,
    cloudinaryPublicId,
    category: Array.isArray(obj.category) ? obj.category : [],
    cuisine: obj.cuisine || '',
    difficulty,
    difficultyLevel: String(obj.difficultyLevel || difficulty.toLowerCase()).toLowerCase(),
    servings: obj.servings,
    serves: obj.servings,
    cookTime: obj.cookTime,
    tags: Array.isArray(obj.tags) ? obj.tags : [],
    likes: Number(obj.likes) || 0,
    views: Number(obj.views) || 0,
    rating: Number(obj.rating) || 0,
    averageRating: Number(obj.averageRating || obj.rating) || 0,
    ratingCount: Number(obj.ratingCount) || 0,
    reactionCounts: { ...DEFAULT_REACTION_COUNTS, ...(obj.reactionCounts || {}) },
    reactions: Array.isArray(obj.reactions) ? obj.reactions : [],
    reviews: Array.isArray(obj.reviews) ? obj.reviews : [],
    savedBy,
    tip: obj.tip || '',
    isDraft: Boolean(obj.isDraft),
    visibility: obj.isDraft ? 'draft' : 'public',
    featured: Boolean(obj.featured),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    createdBy,
    author: createdBy,
    isLiked: Boolean(currentId && likedBy.includes(currentId)),
    isFavorite: Boolean(currentId && likedBy.includes(currentId)),
    isSaved: Boolean(currentId && savedBy.includes(currentId))
  };

  if (includeDetails) {
    payload.ingredients = Array.isArray(obj.ingredients) ? obj.ingredients : [];
    payload.steps = steps;
    payload.instructions = steps;
    payload.userRating = currentId && Array.isArray(obj.ratings)
      ? obj.ratings.find((item) => item.user?.toString() === currentId)?.value || 0
      : 0;
  }

  return payload;
};

const getOptionalUserId = (req) => req.user?.userId || null;

const findRecipeByParam = async (id) => {
  let recipe = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    recipe = await Recipe.findById(id)
      .populate('createdBy', 'name username profileImage bio createdAt')
      .populate('likedBy', 'name username profileImage');
  }

  if (!recipe) {
    recipe = await Recipe.findOne({ legacyId: id })
      .populate('createdBy', 'name username profileImage bio createdAt')
      .populate('likedBy', 'name username profileImage');
  }

  return recipe;
};

const buildRecipePayload = async (req, existingRecipe = null) => {
  let uploaded = null;
  if (req.file?.buffer) {
    if (req.file.buffer.length < MIN_IMAGE_BYTES || req.file.buffer.length > MAX_IMAGE_BYTES) {
      const error = new Error('Image must be between 100KB and 5MB.');
      error.statusCode = 400;
      throw error;
    }
    uploaded = await cloudinary.uploadImage(req.file.buffer, 'recipes/');
  }

  const rawImageUrl = req.body.imageUrl || req.body.image;
  const hasExistingImage = existingRecipe && rawImageUrl && (
    rawImageUrl === existingRecipe.imageUrl || rawImageUrl === existingRecipe.image
  );
  const providedPublicId = req.body.cloudinaryPublicId || req.body.imagePublicId;
  if (!uploaded && rawImageUrl && isRemoteImageUrl(rawImageUrl) && !isCloudinaryUrl(rawImageUrl) && !providedPublicId && !hasExistingImage) {
    uploaded = await uploadRemoteImage(rawImageUrl);
  }

  const imageUrl = uploaded?.secure_url || req.body.imageUrl || req.body.image || existingRecipe?.imageUrl || existingRecipe?.image;
  const imagePublicId = uploaded?.public_id
    || req.body.cloudinaryPublicId
    || req.body.imagePublicId
    || parseImagePublicId(imageUrl)
    || existingRecipe?.cloudinaryPublicId
    || existingRecipe?.imagePublicId;
  const difficulty = normalizeDifficulty(req.body.difficulty || req.body.difficultyLevel) || existingRecipe?.difficulty;
  const stepsInput = req.body.steps !== undefined ? req.body.steps : req.body.instructions;
  const servingsInput = req.body.servings !== undefined ? req.body.servings : req.body.serves;
  const visibility = req.body.visibility !== undefined ? req.body.visibility : undefined;

  const payload = {};
  if (req.body.title !== undefined) payload.title = String(req.body.title).trim();
  if (req.body.description !== undefined) payload.description = String(req.body.description).trim();
  if (req.body.ingredients !== undefined) payload.ingredients = normalizeIngredients(req.body.ingredients);
  if (stepsInput !== undefined) payload.steps = normalizeSteps(stepsInput);
  if (req.body.category !== undefined) payload.category = parseArrayField(req.body.category).map(String).filter(Boolean);
  if (req.body.cookTime !== undefined) payload.cookTime = Number(req.body.cookTime);
  if (imageUrl !== undefined) {
    payload.imageUrl = imageUrl;
    payload.image = imageUrl;
  }
  if (imagePublicId !== undefined) {
    payload.imagePublicId = imagePublicId;
    payload.cloudinaryPublicId = imagePublicId;
  }
  if (difficulty) {
    payload.difficulty = difficulty;
    payload.difficultyLevel = difficulty.toLowerCase();
  }
  if (servingsInput !== undefined) payload.servings = Number(servingsInput);
  if (req.body.tags !== undefined) payload.tags = parseArrayField(req.body.tags).map(String).filter(Boolean);
  if (req.body.cuisine !== undefined) payload.cuisine = String(req.body.cuisine || '').trim();
  if (req.body.featured !== undefined) payload.featured = parseBoolean(req.body.featured);
  if (visibility !== undefined) payload.isDraft = visibility === 'draft';
  if (req.body.isDraft !== undefined && visibility === undefined) payload.isDraft = parseBoolean(req.body.isDraft);

  return { payload, uploadedPublicId: uploaded?.public_id || null };
};

const validateRecipePayload = (payload, { partial = false } = {}) => {
  const errors = {};
  const required = ['title', 'description', 'ingredients', 'steps', 'category', 'cuisine', 'cookTime', 'imageUrl', 'imagePublicId', 'difficulty', 'servings'];

  required.forEach((field) => {
    if (partial && payload[field] === undefined) return;
    const value = payload[field];
    if (Array.isArray(value) && value.length === 0) errors[field] = `${field} is required`;
    else if (value === undefined || value === null || value === '') errors[field] = `${field} is required`;
  });

  if (payload.title !== undefined && (payload.title.length < 3 || payload.title.length > 80)) {
    errors.title = 'Title must be between 3 and 80 characters';
  }

  if (payload.description !== undefined && (payload.description.length < 20 || payload.description.length > 300)) {
    errors.description = 'Description must be between 20 and 300 characters';
  }

  if (payload.difficulty !== undefined && !['Easy', 'Medium', 'Hard'].includes(payload.difficulty)) {
    errors.difficulty = 'Difficulty must be Easy, Medium, or Hard';
  }

  if (payload.category !== undefined && (!Array.isArray(payload.category) || payload.category.length < 1 || payload.category.length > 3)) {
    errors.category = 'Select 1 to 3 categories';
  }

  if (payload.servings !== undefined && (!Number.isFinite(Number(payload.servings)) || Number(payload.servings) < 1 || Number(payload.servings) > 10)) {
    errors.servings = 'Servings must be between 1 and 10';
  }

  if (payload.cookTime !== undefined && (!Number.isFinite(Number(payload.cookTime)) || Number(payload.cookTime) < 5 || Number(payload.cookTime) > 300)) {
    errors.cookTime = 'Cook time must be between 5 and 300 minutes';
  }

  if (payload.ingredients !== undefined) {
    if (!Array.isArray(payload.ingredients) || payload.ingredients.length < 2 || payload.ingredients.length > 25) {
      errors.ingredients = 'Ingredients must contain 2 to 25 items';
    } else if (payload.ingredients.some((item) => item.qty && !/^\d+(\.\d+)?$/.test(String(item.qty)))) {
      errors.ingredients = 'Ingredient quantity must use numbers only';
    }
  }

  if (payload.steps !== undefined && (!Array.isArray(payload.steps) || payload.steps.length < 2 || payload.steps.length > 25)) {
    errors.steps = 'Instructions must contain 2 to 25 steps';
  }

  if (payload.tags !== undefined) {
    const normalizedTags = payload.tags.map((tag) => String(tag).trim().toLowerCase());
    if (payload.tags.length > 5) errors.tags = 'Use no more than 5 tags';
    else if (new Set(normalizedTags).size !== normalizedTags.length) errors.tags = 'Tags cannot contain duplicates';
  }

  return errors;
};

const validateDraftPayload = (payload) => {
  const errors = {};
  if (!payload.title || payload.title.length < 3 || payload.title.length > 80) {
    errors.title = 'Title must be between 3 and 80 characters';
  }
  return errors;
};

const mergeRecipeForValidation = (recipe, payload) => ({
  title: payload.title !== undefined ? payload.title : recipe.title,
  description: payload.description !== undefined ? payload.description : recipe.description,
  ingredients: payload.ingredients !== undefined ? payload.ingredients : recipe.ingredients,
  steps: payload.steps !== undefined ? payload.steps : recipe.steps,
  category: payload.category !== undefined ? payload.category : recipe.category,
  cuisine: payload.cuisine !== undefined ? payload.cuisine : recipe.cuisine,
  cookTime: payload.cookTime !== undefined ? payload.cookTime : recipe.cookTime,
  imageUrl: payload.imageUrl !== undefined ? payload.imageUrl : (recipe.imageUrl || recipe.image),
  imagePublicId: payload.imagePublicId !== undefined ? payload.imagePublicId : (recipe.imagePublicId || recipe.cloudinaryPublicId),
  difficulty: payload.difficulty !== undefined ? payload.difficulty : recipe.difficulty,
  servings: payload.servings !== undefined ? payload.servings : recipe.servings,
  tags: payload.tags !== undefined ? payload.tags : (recipe.tags || []),
  isDraft: payload.isDraft !== undefined ? payload.isDraft : recipe.isDraft
});

const getRecipes = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || DEFAULT_LIST_LIMIT, 1), MAX_LIST_LIMIT);
    const query = { isDraft: false };

    if (req.query.featured !== undefined) query.featured = parseBoolean(req.query.featured);
    if (req.query.category) query.category = { $regex: req.query.category, $options: 'i' };
    if (req.query.difficulty) {
      const difficulty = normalizeDifficulty(req.query.difficulty);
      if (difficulty) query.difficulty = difficulty;
    }
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { category: regex },
        { tags: regex },
        { 'ingredients.name': regex }
      ];
    }
    if (req.query.tag) {
      query.tags = { $regex: new RegExp(`^${String(req.query.tag).trim()}$`, 'i') };
    }

    const sortKey = req.query.sort || req.query.sortBy || 'newest';
    const sortMap = {
      newest: { createdAt: -1 },
      popular: { views: -1, likes: -1 },
      rating: { rating: -1, ratingCount: -1 },
      createdAt: { createdAt: req.query.order === 'asc' ? 1 : -1 }
    };
    const sort = sortMap[sortKey] || sortMap.newest;

    const [recipes, total] = await Promise.all([
      Recipe.find(query)
        .populate('createdBy', 'name username profileImage')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Recipe.countDocuments(query)
    ]);

    const serialized = recipes.map((recipe) => serializeRecipe(recipe, { currentUserId: getOptionalUserId(req) }));
    const pagination = {
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      totalRecipes: total,
      hasNext: page < Math.max(1, Math.ceil(total / limit)),
      hasPrev: page > 1
    };

    return res.json({ success: true, data: { recipes: serialized, pagination }, recipes: serialized, pagination });
  } catch (error) {
    return next(error);
  }
};

const getRecipeById = async (req, res, next) => {
  try {
    const recipe = await findRecipeByParam(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const serialized = serializeRecipe(recipe, { includeDetails: true, currentUserId: getOptionalUserId(req) });
    return res.json({ success: true, data: serialized, recipe: serialized });
  } catch (error) {
    return next(error);
  }
};

const recordRecipeView = async (req, res, next) => {
  try {
    const recipe = await findRecipeByParam(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const viewerId = req.user?._id?.toString() || req.user?.userId?.toString() || null;
    const creatorId = recipe.createdBy?._id?.toString?.() || recipe.createdBy?.toString?.() || null;
    if (viewerId && creatorId && viewerId === creatorId) {
      return res.json({ success: true, views: Number(recipe.views || 0), skipped: true });
    }

    recipe.views = Number(recipe.views || 0) + 1;
    await recipe.save();

    return res.json({ success: true, views: recipe.views });
  } catch (error) {
    return next(error);
  }
};

const getMyRecipes = async (req, res, next) => {
  try {
    const query = { createdBy: req.user._id };
    if (req.query.isDraft !== undefined) query.isDraft = parseBoolean(req.query.isDraft);

    const recipes = await Recipe.find(query)
      .populate('createdBy', 'name username profileImage')
      .sort({ featured: -1, createdAt: -1 });

    const serialized = recipes.map((recipe) => serializeRecipe(recipe, { currentUserId: req.user._id }));
    return res.json({ success: true, data: { recipes: serialized }, recipes: serialized });
  } catch (error) {
    return next(error);
  }
};

const createRecipe = async (req, res, next) => {
  let uploadedPublicId = null;
  try {
    const built = await buildRecipePayload(req);
    uploadedPublicId = built.uploadedPublicId;
    const payload = {
      ...built.payload,
      createdBy: req.user._id,
      legacyId: undefined
    };

    const isDraft = Boolean(payload.isDraft);
    const errors = isDraft ? validateDraftPayload(payload) : validateRecipePayload(payload);
    if (Object.keys(errors).length > 0) {
      if (uploadedPublicId) await cloudinary.deleteImage(uploadedPublicId);
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const recipe = await Recipe.create(payload);
    if (recipe.featured) {
      await Recipe.updateMany(
        { createdBy: req.user._id, _id: { $ne: recipe._id }, featured: true },
        { $set: { featured: false } }
      );
    }
    await recipe.populate('createdBy', 'name username profileImage bio createdAt');

    await createActivity({
      userId: req.user._id,
      recipeId: recipe._id,
      recipeTitle: recipe.title,
      type: recipe.isDraft ? 'DRAFT_RECIPE' : 'CREATE_RECIPE',
      message: recipe.isDraft ? `You saved '${recipe.title}' as Draft.` : `You created '${recipe.title}'.`
    });

    const serialized = serializeRecipe(recipe, { includeDetails: true, currentUserId: req.user._id });
    return res.status(201).json({ success: true, message: 'Recipe created successfully', data: serialized, recipe: serialized });
  } catch (error) {
    if (uploadedPublicId) {
      try { await cloudinary.deleteImage(uploadedPublicId); } catch (cleanupError) { logger.warn(`Upload cleanup failed: ${cleanupError.message}`); }
    }
    return next(error);
  }
};

const updateRecipe = async (req, res, next) => {
  let uploadedPublicId = null;
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    if (recipe.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own recipes' });
    }

    const oldPublicId = recipe.imagePublicId;
    const wasDraft = recipe.isDraft;
    const built = await buildRecipePayload(req, recipe);
    uploadedPublicId = built.uploadedPublicId;

    const mergedPayload = mergeRecipeForValidation(recipe, built.payload);
    const willBeDraft = built.payload.isDraft !== undefined ? built.payload.isDraft : recipe.isDraft;
    const errors = willBeDraft
      ? validateDraftPayload(mergedPayload)
      : validateRecipePayload(mergedPayload);
    if (Object.keys(errors).length > 0) {
      if (uploadedPublicId) await cloudinary.deleteImage(uploadedPublicId);
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    Object.entries(built.payload).forEach(([key, value]) => {
      if (value !== undefined) recipe[key] = value;
    });

    await recipe.save();
    if (recipe.featured) {
      await Recipe.updateMany(
        { createdBy: req.user._id, _id: { $ne: recipe._id }, featured: true },
        { $set: { featured: false } }
      );
    }

    if (recipe.imagePublicId && oldPublicId && recipe.imagePublicId !== oldPublicId) {
      await cloudinary.deleteImage(oldPublicId);
    }

    await recipe.populate('createdBy', 'name username profileImage bio createdAt');
    const activityType = wasDraft && !recipe.isDraft
      ? 'PUBLISH_RECIPE'
      : (!wasDraft && recipe.isDraft ? 'DRAFT_RECIPE' : 'EDIT_RECIPE');
    const activityMessage = activityType === 'PUBLISH_RECIPE'
      ? `You published '${recipe.title}'.`
      : (activityType === 'DRAFT_RECIPE' ? `You saved '${recipe.title}' as Draft.` : `You updated '${recipe.title}'.`);
    await createActivity({
      userId: req.user._id,
      recipeId: recipe._id,
      recipeTitle: recipe.title,
      type: activityType,
      message: activityMessage
    });
    const serialized = serializeRecipe(recipe, { includeDetails: true, currentUserId: req.user._id });
    return res.json({ success: true, message: 'Recipe updated successfully', data: serialized, recipe: serialized });
  } catch (error) {
    if (uploadedPublicId) {
      try { await cloudinary.deleteImage(uploadedPublicId); } catch (cleanupError) { logger.warn(`Upload cleanup failed: ${cleanupError.message}`); }
    }
    return next(error);
  }
};

const deleteRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    if (recipe.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own recipes' });
    }

    const deleteResult = await cloudinary.deleteImage(recipe.imagePublicId);
    const allowedResults = [null, 'ok', 'not found', 'skipped_static_asset'];
    if (!allowedResults.includes(deleteResult?.result || null)) {
      return res.status(500).json({ success: false, message: 'Cloudinary image deletion failed' });
    }

    await User.updateMany(
      { $or: [{ likedRecipes: recipe._id }, { savedRecipes: recipe._id }] },
      { $pull: { likedRecipes: recipe._id, savedRecipes: recipe._id } }
    );
    await createActivity({
      userId: req.user._id,
      recipeId: recipe._id,
      recipeTitle: recipe.title,
      type: 'DELETE_RECIPE',
      message: `You deleted '${recipe.title}'.`
    });
    await Recipe.findByIdAndDelete(recipe._id);

    return res.json({ success: true, message: 'Recipe deleted' });
  } catch (error) {
    logger.error(`Recipe delete failed: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error while deleting recipe' });
  }
};

const copyRecipe = async (req, res, next) => {
  try {
    const original = await findRecipeByParam(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const copy = await Recipe.create({
      title: `${original.title} (Copy)`,
      description: original.description,
      ingredients: original.ingredients,
      steps: original.steps,
      category: original.category,
      cookTime: original.cookTime,
      imageUrl: original.imageUrl,
      image: original.image,
      imagePublicId: original.imagePublicId,
      cloudinaryPublicId: original.cloudinaryPublicId || original.imagePublicId,
      createdBy: req.user._id,
      difficulty: original.difficulty,
      difficultyLevel: original.difficultyLevel,
      servings: original.servings,
      tags: original.tags || [],
      cuisine: original.cuisine || '',
      tip: original.tip || undefined,
      legacyId: undefined,
      isDraft: true,
      featured: false,
      likes: 0,
      likedBy: [],
      views: 0,
      rating: 0,
      ratingCount: 0,
      ratings: [],
      reactions: [],
      reactionCounts: { ...DEFAULT_REACTION_COUNTS },
      savedBy: []
    });

    await copy.populate('createdBy', 'name username profileImage bio createdAt');
    const serialized = serializeRecipe(copy, { includeDetails: true, currentUserId: req.user._id });
    return res.status(201).json({ success: true, message: 'Recipe copied as draft', recipe: serialized, data: serialized });
  } catch (error) {
    return next(error);
  }
};
const getLikedRecipes = async (req, res, next) => {
  try {
    const recipes = await Recipe.find({ likedBy: req.user._id })
      .populate('createdBy', 'name username profileImage')
      .sort({ updatedAt: -1, createdAt: -1 });
    const serialized = recipes.map((recipe) => serializeRecipe(recipe, { currentUserId: req.user._id }));
    return res.json({ success: true, data: { recipes: serialized }, recipes: serialized });
  } catch (error) {
    return next(error);
  }
};

const getSavedRecipes = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('savedRecipes');
    const savedRecipes = Array.isArray(user?.savedRecipes) ? user.savedRecipes : [];
    const recipes = await Recipe.find({ _id: { $in: savedRecipes }, isDraft: false })
      .populate('createdBy', 'name username profileImage')
      .sort({ updatedAt: -1, createdAt: -1 });
    const serialized = recipes.map((recipe) => serializeRecipe(recipe, { currentUserId: req.user._id }));
    return res.json({ success: true, data: { recipes: serialized }, recipes: serialized });
  } catch (error) {
    return next(error);
  }
};

const getUserStats = async (req, res, next) => {
  try {
    const { recipes, stats } = await buildProfileStats(req.user._id, { includeDrafts: true });
    const published = recipes.filter((recipe) => !recipe.isDraft);
    const topRecipesByViews = [...published]
      .filter((recipe) => Number(recipe.views || 0) > 0)
      .sort((a, b) => (b.views || 0) - (a.views || 0) || new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((recipe) => serializeRecipe(recipe));
    const topRecipesByLikes = [...published]
      .filter((recipe) => Number(recipe.likes || 0) > 0)
      .sort((a, b) => (b.likes || 0) - (a.likes || 0) || new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((recipe) => serializeRecipe(recipe));

    return res.json({ ...stats, topRecipesByViews, topRecipesByLikes });
  } catch (error) {
    return next(error);
  }
};

const toggleSaveRecipe = async (req, res, next) => {
  try {
    const recipe = await findRecipeByParam(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const user = await User.findById(req.user._id).select('savedRecipes');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const savedRecipes = Array.isArray(user.savedRecipes) ? user.savedRecipes.map((item) => item.toString()) : [];
    const isSaved = savedRecipes.includes(recipe._id.toString());

    if (isSaved) {
      await User.findByIdAndUpdate(user._id, { $pull: { savedRecipes: recipe._id } });
      recipe.savedBy = (recipe.savedBy || []).filter((id) => id.toString() !== user._id.toString());
    } else {
      await User.findByIdAndUpdate(user._id, { $addToSet: { savedRecipes: recipe._id } });
      recipe.savedBy.addToSet(user._id);
    }

    await recipe.save();
    if (!isSaved) {
      await createActivity({
        userId: req.user._id,
        recipeId: recipe._id,
        recipeTitle: recipe.title,
        type: 'SAVE_RECIPE',
        message: `You saved Chef ${recipe.createdBy?.name || 'Unknown'}'s '${recipe.title}'.`
      });
    }
    const updatedUser = await User.findById(user._id).select('savedRecipes');

    return res.json({
      success: true,
      message: isSaved ? 'Removed from Saved Recipes' : 'Saved to Saved Recipes',
      isSaved: !isSaved,
      saved: !isSaved,
      savedRecipes: (updatedUser?.savedRecipes || []).map((item) => item.toString()),
      savedBy: (recipe.savedBy || []).map((item) => item.toString())
    });
  } catch (error) {
    return next(error);
  }
};

const toggleReaction = async (req, res, next) => {
  try {
    const { type } = req.body;
    if (!VALID_REACTION_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid reaction type' });
    }

    const recipe = await findRecipeByParam(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const userId = req.user._id.toString();
    recipe.reactions = Array.isArray(recipe.reactions) ? recipe.reactions : [];
    const existingIndex = recipe.reactions.findIndex((reaction) =>
      String(reaction.userId || reaction.user || '') === userId && reaction.type === type
    );

    if (existingIndex >= 0) {
      recipe.reactions.splice(existingIndex, 1);
    } else {
      recipe.reactions.push({
        userId: req.user._id,
        userName: req.user.name,
        userAvatar: req.user.profileImage || '',
        type
      });
    }

    const reactionCounts = recipe.reactions.reduce((acc, reaction) => {
      if (VALID_REACTION_TYPES.includes(reaction.type)) acc[reaction.type] += 1;
      return acc;
    }, { ...DEFAULT_REACTION_COUNTS });

    recipe.reactionCounts = reactionCounts;
    await recipe.save();

    return res.json({
      success: true,
      toggledOn: existingIndex < 0,
      reactionCounts,
      reactions: recipe.reactions
    });
  } catch (error) {
    return next(error);
  }
};

const addToFavorites = async (req, res, next) => {
  try {
    const recipe = await findRecipeByParam(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const user = await User.findById(req.user._id).select('savedRecipes likedRecipes');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.savedRecipes = user.savedRecipes || [];
    user.likedRecipes = user.likedRecipes || [];
    user.savedRecipes.addToSet(recipe._id);
    user.likedRecipes.addToSet(recipe._id);

    recipe.savedBy.addToSet(user._id);
    recipe.likedBy.addToSet(user._id);
    recipe.likes = recipe.likedBy.length;

    await Promise.all([user.save(), recipe.save()]);

    return res.json({
      success: true,
      message: 'Recipe added to favorites',
      isSaved: true,
      isLiked: true,
      likes: recipe.likes,
      savedBy: recipe.savedBy.map((item) => item.toString())
    });
  } catch (error) {
    return next(error);
  }
};

const getUserActivity = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 15, 50);
    const activities = await listUserActivities(req.user._id, { limit });
    return res.json({ activities });
  } catch (error) {
    return next(error);
  }
};

const toggleLikeRecipe = async (req, res, next) => {
  try {
    const recipe = await findRecipeByParam(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const userId = req.user._id;
    const isLiked = recipe.likedBy.some((id) => id.toString() === userId.toString());

    if (isLiked) {
      recipe.likedBy = recipe.likedBy.filter((id) => id.toString() !== userId.toString());
      await User.findByIdAndUpdate(userId, { $pull: { likedRecipes: recipe._id } });
    } else {
      recipe.likedBy.addToSet(userId);
      await User.findByIdAndUpdate(userId, { $addToSet: { likedRecipes: recipe._id } });
    }

    recipe.likes = recipe.likedBy.length;
    await recipe.save();
    if (!isLiked) {
      await createActivity({
        userId: req.user._id,
        recipeId: recipe._id,
        recipeTitle: recipe.title,
        type: 'LIKE_RECIPE',
        message: `You liked Chef ${recipe.createdBy?.name || 'Unknown'}'s '${recipe.title}'.`
      });
    }

    return res.json({ success: true, message: isLiked ? 'Recipe unliked' : 'Recipe liked', likes: recipe.likes, isLiked: !isLiked });
  } catch (error) {
    return next(error);
  }
};

const recomputeRecipeRating = (recipe) => {
  const ratingValues = (recipe.ratings || []).map((item) => Number(item.value)).filter((value) => value >= 1 && value <= 5);
  const reviewValues = (recipe.reviews || []).map((item) => Number(item.rating)).filter((value) => value >= 1 && value <= 5);
  const combined = [...ratingValues, ...reviewValues];
  recipe.ratingCount = combined.length;
  recipe.rating = combined.length
    ? Number((combined.reduce((sum, value) => sum + value, 0) / combined.length).toFixed(1))
    : 0;
};

const rateRecipe = async (req, res, next) => {
  try {
    const value = Number(req.body.value);
    if (!Number.isFinite(value) || value < 1 || value > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const recipe = await findRecipeByParam(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const existingRating = recipe.ratings.find((item) => item.user.toString() === req.user._id.toString());
    if (existingRating) existingRating.value = value;
    else recipe.ratings.push({ user: req.user._id, value });

    recomputeRecipeRating(recipe);
    await recipe.save();
    await createActivity({
      userId: req.user._id,
      recipeId: recipe._id,
      recipeTitle: recipe.title,
      type: 'RATE_RECIPE',
      message: `You rated '${recipe.title}' ${value}★.`
    });

    return res.json({ success: true, message: 'Rating saved successfully', rating: recipe.rating, ratingCount: recipe.ratingCount, userRating: value });
  } catch (error) {
    return next(error);
  }
};

const serializeReviewResponse = async (recipe, req) => {
  await recipe.populate('createdBy', 'name username profileImage bio createdAt');
  return serializeRecipe(recipe, { includeDetails: true, currentUserId: req.user._id });
};

const addReview = async (req, res, next) => {
  try {
    const text = String(req.body.text || '').trim();
    const rating = Number(req.body.rating);
    if (text.length < 5) {
      return res.status(400).json({ success: false, message: 'Review must be at least 5 characters' });
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const recipe = await findRecipeByParam(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const userId = req.user._id.toString();
    const hasReview = (recipe.reviews || []).some((item) => String(item.user || item.userId || '') === userId);
    if (hasReview) {
      return res.status(409).json({ success: false, message: 'You already reviewed this recipe. Edit your existing review instead.' });
    }

    recipe.reviews = Array.isArray(recipe.reviews) ? recipe.reviews : [];
    recipe.reviews.push({
      _id: new mongoose.Types.ObjectId(),
      user: req.user._id,
      userId: req.user._id,
      userName: req.user.name || 'Community Member',
      userAvatar: req.user.profileImage || '',
      text,
      rating,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    recomputeRecipeRating(recipe);
    await recipe.save();

    await createActivity({
      userId: req.user._id,
      recipeId: recipe._id,
      recipeTitle: recipe.title,
      type: 'REVIEW_RECIPE',
      message: `You reviewed '${recipe.title}'.`
    });

    const serialized = await serializeReviewResponse(recipe, req);
    return res.status(201).json({ success: true, message: 'Review posted', recipe: serialized, data: serialized });
  } catch (error) {
    return next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const text = String(req.body.text || '').trim();
    const rating = Number(req.body.rating);
    if (text.length < 5) {
      return res.status(400).json({ success: false, message: 'Review must be at least 5 characters' });
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const recipe = await findRecipeByParam(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const review = (recipe.reviews || []).find((item) => String(item._id || item.id) === String(req.params.reviewId));
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (String(review.user || review.userId || '') !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own review' });
    }

    review.text = text;
    review.rating = rating;
    review.updatedAt = new Date();
    recomputeRecipeRating(recipe);
    await recipe.save();

    const serialized = await serializeReviewResponse(recipe, req);
    return res.json({ success: true, message: 'Review updated', recipe: serialized, data: serialized });
  } catch (error) {
    return next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const recipe = await findRecipeByParam(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const reviewIndex = (recipe.reviews || []).findIndex((item) => String(item._id || item.id) === String(req.params.reviewId));
    if (reviewIndex === -1) return res.status(404).json({ success: false, message: 'Review not found' });

    const review = recipe.reviews[reviewIndex];
    if (String(review.user || review.userId || '') !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own review' });
    }

    recipe.reviews.splice(reviewIndex, 1);
    recomputeRecipeRating(recipe);
    await recipe.save();

    const serialized = await serializeReviewResponse(recipe, req);
    return res.json({ success: true, message: 'Review deleted', recipe: serialized, data: serialized });
  } catch (error) {
    return next(error);
  }
};

const shareRecipe = async (req, res, next) => {
  try {
    const recipe = await findRecipeByParam(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    await createActivity({
      userId: req.user._id,
      recipeId: recipe._id,
      recipeTitle: recipe.title,
      type: 'SHARE_RECIPE',
      message: 'You copied the recipe link.'
    });

    return res.json({ success: true, message: 'Share activity recorded' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getRecipes,
  getRecipeById,
  recordRecipeView,
  getMyRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  copyRecipe,
  getLikedRecipes,
  getSavedRecipes,
  getUserStats,
  getUserActivity,
  toggleSaveRecipe,
  toggleReaction,
  addToFavorites,
  toggleLikeRecipe,
  rateRecipe,
  addReview,
  updateReview,
  deleteReview,
  shareRecipe,
  serializeRecipe,
  parseImagePublicId
};


