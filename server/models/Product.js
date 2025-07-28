const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  salePrice: {
    type: Number,
    min: [0, 'Sale price cannot be negative'],
    validate: {
      validator: function(value) {
        return !value || value < this.price;
      },
      message: 'Sale price must be less than regular price'
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    altText: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['rings', 'necklaces', 'earrings', 'bracelets', 'watches', 'sets', 'custom']
  },
  subcategory: {
    type: String,
    enum: ['engagement', 'wedding', 'fashion', 'luxury', 'vintage', 'modern', 'custom']
  },
  material: {
    metal: {
      type: String,
      enum: ['gold', 'silver', 'platinum', 'titanium', 'stainless-steel', 'brass', 'copper', 'other'],
      required: true
    },
    purity: {
      type: String,
      enum: ['14k', '18k', '22k', '24k', '925', 'platinum', 'titanium', 'other']
    },
    finish: {
      type: String,
      enum: ['polished', 'matte', 'brushed', 'hammered', 'textured', 'rhodium-plated']
    }
  },
  gemstones: [{
    type: {
      type: String,
      enum: ['diamond', 'ruby', 'sapphire', 'emerald', 'pearl', 'amethyst', 'topaz', 'garnet', 'opal', 'other']
    },
    carat: Number,
    cut: {
      type: String,
      enum: ['round', 'princess', 'emerald', 'oval', 'marquise', 'pear', 'cushion', 'heart', 'radiant', 'asscher']
    },
    color: String,
    clarity: {
      type: String,
      enum: ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3']
    },
    quantity: {
      type: Number,
      default: 1
    }
  }],
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    diameter: Number,
    weight: Number,
    unit: {
      type: String,
      enum: ['mm', 'cm', 'inches'],
      default: 'mm'
    }
  },
  sizes: [{
    size: String,
    stock: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  sku: {
    type: String,
    unique: true,
    required: true
  },
  tags: [String],
  isCustomizable: {
    type: Boolean,
    default: false
  },
  customizationOptions: {
    engraving: {
      available: { type: Boolean, default: false },
      maxLength: { type: Number, default: 50 },
      additionalCost: { type: Number, default: 0 }
    },
    resizing: {
      available: { type: Boolean, default: false },
      additionalCost: { type: Number, default: 0 }
    },
    metalOptions: [String],
    gemstoneOptions: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    images: [String],
    verified: {
      type: Boolean,
      default: false
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ isFeatured: -1 });
productSchema.index({ sku: 1 });
productSchema.index({ tags: 1 });

// Virtual for effective price (considering sale price)
productSchema.virtual('effectivePrice').get(function() {
  return this.salePrice && this.salePrice < this.price ? this.salePrice : this.price;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.salePrice && this.salePrice < this.price) {
    return Math.round(((this.price - this.salePrice) / this.price) * 100);
  }
  return 0;
});

// Method to update rating
productSchema.methods.updateRating = function() {
  if (this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating.average = totalRating / this.reviews.length;
    this.rating.count = this.reviews.length;
  } else {
    this.rating.average = 0;
    this.rating.count = 0;
  }
};

// Add pagination plugin
productSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Product', productSchema);