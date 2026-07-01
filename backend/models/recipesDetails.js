const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: String,
    default: ''
  },
  weight: {
    type: String,
    default: ''
  },
  qty: {
    type: String,
    default: ''
  },
  unit: {
    type: String,
    default: ''
  }
}, { _id: false });

const stepSchema = new mongoose.Schema({
  step: {
    type: Number,
    required: true,
    min: 1
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  text: {
    type: String,
    default: ''
  }
}, { _id: false });

const ratingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  }
}, { _id: false, timestamps: true });

const reactionCountsSchema = new mongoose.Schema({
  delicious: { type: Number, default: 0 },
  like: { type: Number, default: 0 },
  fire: { type: Number, default: 0 }
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  ingredients: {
    type: [ingredientSchema],
    required: true,
    validate: [(value) => Array.isArray(value) && value.length > 0, 'At least one ingredient is required']
  },
  steps: {
    type: [stepSchema],
    required: true,
    validate: [(value) => Array.isArray(value) && value.length > 0, 'At least one step is required']
  },
  category: {
    type: [String],
    required: true,
    validate: [(value) => Array.isArray(value) && value.length > 0, 'At least one category is required']
  },
  cookTime: {
    type: Number,
    required: true,
    min: 1
  },
  imageUrl: {
    type: String,
    required: true
  },
  imagePublicId: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  legacyId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: undefined
  },
  difficultyLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: undefined
  },
  servings: {
    type: Number,
    default: undefined
  },
  tags: {
    type: [String],
    default: []
  },
  likes: {
    type: Number,
    default: 0,
    min: 0,
    set: (value) => Array.isArray(value) ? value.length : (Number(value) || 0)
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  ratings: {
    type: [ratingSchema],
    default: []
  },
  reactionCounts: {
    type: reactionCountsSchema,
    default: () => ({ delicious: 0, like: 0, fire: 0 })
  },
  reactions: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  reviews: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tip: {
    type: String,
    default: undefined
  },
  image: {
    type: String,
    default: ''
  },
  cuisine: {
    type: String,
    trim: true,
    default: ''
  },
  isDraft: {
    type: Boolean,
    default: false,
    index: true
  },
  featured: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

recipeSchema.virtual('serves').get(function getServes() {
  return this.servings;
}).set(function setServes(value) {
  this.servings = value;
});

recipeSchema.virtual('instructions').get(function getInstructions() {
  return this.steps;
}).set(function setInstructions(value) {
  this.steps = value;
});

recipeSchema.pre('validate', function normalizeRecipe() {
  if (!this.image && this.imageUrl) this.image = this.imageUrl;
  if (!this.imageUrl && this.image) this.imageUrl = this.image;
  if (!this.cloudinaryPublicId && this.imagePublicId) this.cloudinaryPublicId = this.imagePublicId;
  if (!this.imagePublicId && this.cloudinaryPublicId) this.imagePublicId = this.cloudinaryPublicId;

  if (!this.difficulty && this.difficultyLevel) {
    this.difficulty = this.difficultyLevel.charAt(0).toUpperCase() + this.difficultyLevel.slice(1);
  }
  if (!this.difficultyLevel && this.difficulty) {
    this.difficultyLevel = this.difficulty.toLowerCase();
  }

  if (Array.isArray(this.steps)) {
    this.steps = this.steps.map((item, index) => {
      const raw = item && typeof item.toObject === 'function' ? item.toObject() : item;
      if (typeof raw === 'string') {
        return { step: index + 1, title: '', description: raw, text: raw };
      }
      const description = raw.description || raw.text || '';
      return {
        step: Number(raw.step) || index + 1,
        title: raw.title || '',
        description,
        text: raw.text || description
      };
    });
  }

  if (Array.isArray(this.ingredients)) {
    this.ingredients = this.ingredients.map((item) => {
      const raw = item && typeof item.toObject === 'function' ? item.toObject() : item;
      if (typeof raw === 'string') return { name: raw, quantity: '', weight: '', qty: '', unit: '' };
      return {
        name: raw.name,
        quantity: raw.quantity || raw.qty || '',
        weight: raw.weight || raw.unit || '',
        qty: raw.qty || raw.quantity || '',
        unit: raw.unit || raw.weight || ''
      };
    });
  }
});

recipeSchema.index({ legacyId: 1 }, { unique: true, sparse: true });
recipeSchema.index({ category: 1 });
recipeSchema.index({ difficulty: 1 });
recipeSchema.index({ difficultyLevel: 1 });
recipeSchema.index({ createdBy: 1 });
recipeSchema.index({ title: 1 });
recipeSchema.index({ 'ingredients.name': 1 });
recipeSchema.index(
  { title: 'text', description: 'text', 'ingredients.name': 'text', category: 'text' },
  { name: 'recipe_text_search' }
);

recipeSchema.set('toJSON', { virtuals: true });
recipeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Recipe || mongoose.model('Recipe', recipeSchema);
