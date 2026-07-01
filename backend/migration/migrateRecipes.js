require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const path = require('path');
const { pathToFileURL } = require('url');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const User = require('../models/Users');
const Recipe = require('../models/recipesDetails');

const SEED_PASSWORD = 'Recipe@Seed2024!';

const normalizeDifficulty = (value) => {
  const lower = String(value || '').toLowerCase();
  if (!['easy', 'medium', 'hard'].includes(lower)) return undefined;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const parseImagePublicId = (image = '') => {
  const match = String(image).match(/\/upload\/v\d+\/(.+)\.[a-z]+(?:\?.*)?$/i);
  return match ? match[1] : '';
};

const loadRecipesData = async () => {
  const recipesPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'data', 'recipesData.js');
  const mod = await import(pathToFileURL(recipesPath).href);
  return mod.recipesData || mod.default || {};
};

const getUniqueAuthors = (recipes) => {
  const authors = new Map();
  Object.values(recipes).forEach((recipe) => {
    const author = recipe.createdBy;
    if (!author) return;
    const key = author.id || author._id || author.username;
    if (!key || authors.has(key)) return;
    authors.set(key, author);
  });
  return authors;
};

const validateRecipe = (recipe) => {
  const missing = [];
  if (!recipe.id) missing.push('id');
  if (!recipe.title) missing.push('title');
  if (!recipe.description) missing.push('description');
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) missing.push('ingredients');
  if (!Array.isArray(recipe.instructions) || recipe.instructions.length === 0) missing.push('instructions');
  if (!Array.isArray(recipe.category) || recipe.category.length === 0) missing.push('category');
  if (!Number(recipe.cookTime) || Number(recipe.cookTime) <= 0) missing.push('cookTime');
  if (!recipe.image) missing.push('image');
  if (!recipe.createdBy?.id && !recipe.createdBy?._id && !recipe.createdBy?.username) missing.push('createdBy');
  return missing;
};

const migrate = async () => {
  const recipesData = await loadRecipesData();
  const authors = getUniqueAuthors(recipesData);
  const authorIdMap = new Map();
  let usersInserted = 0;
  let usersSkipped = 0;
  let recipesMigrated = 0;
  let recipesSkipped = 0;
  const failed = [];

  await connectDatabase();
  console.log('MongoDB connected for recipe migration.');

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  for (const [authorKey, author] of authors.entries()) {
    const username = String(author.username || author.name || authorKey)
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '') || `seed${authorKey}`;
    const email = `${username}@recipeio.seed`;

    let user = await User.findOne({ $or: [{ username }, { email }] });

    if (user) {
      usersSkipped += 1;
    } else {
      user = await User.create({
        name: author.name || username,
        username,
        email,
        password: passwordHash,
        bio: author.bio || '',
        profileImage: author.profileImage || '',
        profileImagePublicId: ''
      });
      usersInserted += 1;
    }

    authorIdMap.set(author.id || author._id || authorKey, user._id);
  }

  console.log(`Users seeded: ${usersInserted} inserted, ${usersSkipped} skipped`);

  for (const recipe of Object.values(recipesData)) {
    try {
      const missing = validateRecipe(recipe);
      if (missing.length > 0) {
        failed.push({ legacyId: recipe.id || 'unknown', title: recipe.title || 'Untitled', error: `Missing required fields: ${missing.join(', ')}` });
        continue;
      }

      const existingByLegacy = await Recipe.findOne({ legacyId: recipe.id });
      if (existingByLegacy) {
        recipesSkipped += 1;
        continue;
      }

      const imagePublicId = parseImagePublicId(recipe.image);
      if (!imagePublicId) {
        failed.push({ legacyId: recipe.id, title: recipe.title, error: 'Could not parse imagePublicId from Cloudinary URL' });
        continue;
      }

      const authorKey = recipe.createdBy.id || recipe.createdBy._id || recipe.createdBy.username;
      const createdBy = authorIdMap.get(authorKey);
      if (!createdBy) {
        failed.push({ legacyId: recipe.id, title: recipe.title, error: `Author not found for ${authorKey}` });
        continue;
      }

      const existingDuplicate = await Recipe.findOne({
        $or: [
          { title: recipe.title, imageUrl: recipe.image },
          { title: recipe.title, image: recipe.image }
        ]
      });

      if (existingDuplicate) {
        existingDuplicate.legacyId = recipe.id;
        existingDuplicate.createdBy = createdBy;
        existingDuplicate.imageUrl = recipe.image;
        existingDuplicate.image = recipe.image;
        existingDuplicate.imagePublicId = imagePublicId;
        if (!existingDuplicate.steps?.length && recipe.instructions?.length) existingDuplicate.steps = recipe.instructions;
        await existingDuplicate.save();
        recipesSkipped += 1;
        continue;
      }

      await Recipe.create({
        legacyId: recipe.id,
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        steps: recipe.instructions,
        category: recipe.category,
        cookTime: recipe.cookTime,
        imageUrl: recipe.image,
        image: recipe.image,
        imagePublicId,
        cloudinaryPublicId: imagePublicId,
        createdBy,
        difficulty: normalizeDifficulty(recipe.difficulty),
        difficultyLevel: recipe.difficultyLevel || String(recipe.difficulty || '').toLowerCase() || undefined,
        servings: recipe.serves,
        tags: recipe.tags || [],
        likes: 0,
        likedBy: [],
        views: 0,
        rating: 0,
        averageRating: 0,
        ratingCount: 0,
        ratings: [],
        reactionCounts: { laugh: 0, love: 0, wave: 0 },
        reactions: [],
        reviews: [],
        savedBy: [],
        tip: recipe.tip || undefined,
        isDraft: false,
        createdAt: recipe.createdAt ? new Date(recipe.createdAt) : undefined
      });
      recipesMigrated += 1;
    } catch (error) {
      failed.push({ legacyId: recipe.id || 'unknown', title: recipe.title || 'Untitled', error: error.message });
    }
  }

  console.log('======================================');
  console.log('  MIGRATION SUMMARY');
  console.log('======================================');
  console.log(`  Users inserted:   ${usersInserted}`);
  console.log(`  Users skipped:    ${usersSkipped}`);
  console.log(`  Recipes migrated: ${recipesMigrated}   (target: 38)`);
  console.log(`  Recipes skipped:  ${recipesSkipped}   (already existed)`);
  console.log(`  Recipes failed:   ${failed.length}`);
  console.log('--------------------------------------');
  if (failed.length > 0) {
    console.log('  Failed recipes:');
    failed.forEach((item) => console.log(`  [legacyId: ${item.legacyId} - ${item.title} - ${item.error}]`));
  } else {
    console.log('  Failed recipes: none');
  }
  console.log('======================================');

  await disconnectDatabase();
};

migrate().catch(async (error) => {
  console.error('Migration failed:', error);
  if (mongoose.connection.readyState !== 0) await disconnectDatabase();
  process.exit(1);
});
