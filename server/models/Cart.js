const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  customOptions: {
    engraving: String,
    size: String,
    material: String,
    stone: String
  },
  price: {
    type: Number,
    required: true
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  total: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  shipping: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate totals
cartSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.tax = this.subtotal * 0.08; // 8% tax rate
  this.shipping = this.subtotal > 100 ? 0 : 10; // Free shipping over $100
  this.total = this.subtotal + this.tax + this.shipping - this.discount;
  return this.save();
};

// Add item to cart
cartSchema.methods.addItem = async function(productId, quantity = 1, customOptions = {}) {
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  if (product.stock < quantity) {
    throw new Error('Insufficient stock');
  }
  
  const existingItem = this.items.find(item => 
    item.product.toString() === productId &&
    JSON.stringify(item.customOptions) === JSON.stringify(customOptions)
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      quantity,
      customOptions,
      price: product.price
    });
  }
  
  await this.calculateTotals();
  return this;
};

// Remove item from cart
cartSchema.methods.removeItem = async function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId);
  await this.calculateTotals();
  return this;
};

// Update item quantity
cartSchema.methods.updateQuantity = async function(itemId, quantity) {
  const item = this.items.find(item => item._id.toString() === itemId);
  if (item) {
    item.quantity = quantity;
    await this.calculateTotals();
  }
  return this;
};

// Clear cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  this.total = 0;
  this.subtotal = 0;
  this.tax = 0;
  this.shipping = 0;
  this.discount = 0;
  this.couponCode = null;
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);