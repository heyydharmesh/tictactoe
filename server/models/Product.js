const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['rings', 'necklaces', 'earrings', 'bracelets', 'watches', 'anklets', 'pendants']
  },
  subcategory: {
    type: String,
    trim: true
  },
  material: {
    type: String,
    required: true,
    enum: ['gold', 'silver', 'platinum', 'rose-gold', 'white-gold', 'diamond', 'pearl', 'gemstone', 'crystal']
  },
  images: [{
    type: String,
    required: true
  }],
  mainImage: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  features: [{
    type: String
  }],
  tags: [{
    type: String
  }],
  isCustom: {
    type: Boolean,
    default: false
  },
  customOptions: {
    engraving: Boolean,
    sizeAdjustment: Boolean,
    materialChoice: Boolean,
    stoneChoice: Boolean
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  sku: {
    type: String,
    unique: true,
    required: true
  }
}, {
  timestamps: true
});

// Calculate average rating
productSchema.methods.calculateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
  } else {
    const totalRating = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
    this.averageRating = totalRating / this.ratings.length;
    this.totalReviews = this.ratings.length;
  }
  return this.save();
};

// Generate SKU
productSchema.pre('save', function(next) {
  if (!this.sku) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.sku = `${this.category.substring(0, 3).toUpperCase()}-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);