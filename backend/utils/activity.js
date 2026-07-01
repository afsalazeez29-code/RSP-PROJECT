const Activity = require('../models/Activity');
const logger = require('./logger');

const createActivity = async ({ userId, type, message, recipeId = null, recipeTitle = '' }) => {
  if (!userId || !type || !message) return null;

  try {
    return await Activity.create({
      userId,
      type,
      message,
      recipeId,
      recipeTitle,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
  } catch (error) {
    logger.warn(`Activity create failed: ${error.message}`);
    return null;
  }
};

const listUserActivities = async (userId, { limit = 20 } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  return Activity.find({ userId })
    .populate('recipeId', 'title image imageUrl')
    .sort({ createdAt: -1 })
    .limit(safeLimit);
};

module.exports = {
  createActivity,
  listUserActivities
};
