const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const slugifyUsername = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9_]+/g, '')
  .slice(0, 32);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  bio: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: ''
  },
  profileImagePublicId: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  favoriteCuisine: {
    type: String,
    trim: true,
    default: ''
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false,
    index: true
  },
  likedRecipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  }],
  savedRecipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    default: []
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

userSchema.pre('validate', function ensureUsername() {
  if (this.username) {
    this.username = slugifyUsername(this.username);
    return;
  }

  const emailPrefix = this.email ? String(this.email).split('@')[0] : '';
  const generated = slugifyUsername(emailPrefix || this.name || `user${Date.now()}`);
  this.username = generated || `user${Date.now()}`;
});

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  if (/^\$2[aby]\$\d{2}\$/.test(this.password)) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.profileImagePublicId;
  delete obj.__v;
  return obj;
};

const stripPrivateFields = (doc, ret) => {
  delete ret.password;
  delete ret.profileImagePublicId;
  delete ret.__v;
  return ret;
};

userSchema.set('toJSON', { virtuals: true, transform: stripPrivateFields });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
