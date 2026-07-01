const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'CREATE_RECIPE',
      'EDIT_RECIPE',
      'DELETE_RECIPE',
      'LIKE_RECIPE',
      'SAVE_RECIPE',
      'RATE_RECIPE',
      'REVIEW_RECIPE',
      'UPDATE_PROFILE',
      'SHARE_RECIPE',
      'PUBLISH_RECIPE',
      'DRAFT_RECIPE'
    ],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  recipeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    default: null
  },
  recipeTitle: {
    type: String,
    default: '',
    trim: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    required: true
  },

  // Legacy fields are kept briefly so old documents do not break population reads.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    default: null
  }
}, {
  timestamps: true
});

activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Activity', activitySchema);
