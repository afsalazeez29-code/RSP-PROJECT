const mongoose = require('mongoose');

const cloudinaryUrlPattern = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/.+/;

const imageAssetSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['recipe', 'profile', 'post', 'general'],
    default: 'general',
    index: true
  },
  imageUrl: {
    type: String,
    required: true,
    validate: {
      validator: (value) => cloudinaryUrlPattern.test(value),
      message: 'Image URL must be a valid Cloudinary image URL.'
    }
  },
  publicId: {
    type: String,
    required: true,
    unique: true
  },
  imageName: {
    type: String,
    default: ''
  },
  format: {
    type: String,
    default: ''
  },
  width: {
    type: Number,
    min: 0,
    default: 0
  },
  height: {
    type: Number,
    min: 0,
    default: 0
  },
  imageSize: {
    type: Number,
    min: 0,
    default: 0
  },
  resourceType: {
    type: String,
    default: 'image'
  },
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    default: null,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null,
    index: true
  }
}, {
  timestamps: true
});

imageAssetSchema.index({ owner: 1, createdAt: -1 });
imageAssetSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('ImageAsset', imageAssetSchema);
