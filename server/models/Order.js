const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productSnapshot: {
    name: String,
    description: String,
    images: [String],
    sku: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  size: String,
  customization: {
    engraving: {
      text: String,
      font: String,
      position: String
    },
    metalType: String,
    gemstoneType: String,
    specialInstructions: String
  },
  priceAtPurchase: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  
  // Pricing details
  subtotal: {
    type: Number,
    required: true
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
  total: {
    type: Number,
    required: true
  },

  // Shipping information
  shippingAddress: {
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: String
  },

  // Billing information
  billingAddress: {
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },

  // Payment information
  payment: {
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'stripe'],
      required: true
    },
    transactionId: String,
    last4: String,
    brand: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'partial_refund'],
      default: 'pending'
    },
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number
  },

  // Order status and tracking
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  
  tracking: {
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date
  },

  // Customer communication
  notes: String,
  customerNotes: String,
  
  // Timestamps for status changes
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Special handling
  isGift: {
    type: Boolean,
    default: false
  },
  giftMessage: String,
  
  // Rush order
  isRush: {
    type: Boolean,
    default: false
  },
  rushFee: {
    type: Number,
    default: 0
  },

  // Customization timeline
  customizationDeadline: Date,
  estimatedCompletion: Date

}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `JEW-${timestamp.slice(-6)}${random}`;
  }
  next();
});

// Add status change to history
orderSchema.methods.updateStatus = function(newStatus, note, updatedBy) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    note: note,
    updatedBy: updatedBy
  });

  // Update specific timestamps
  const now = new Date();
  switch (newStatus) {
    case 'shipped':
      this.tracking.shippedAt = now;
      break;
    case 'delivered':
      this.tracking.deliveredAt = now;
      break;
    case 'confirmed':
      if (this.payment.status === 'completed') {
        this.payment.paidAt = now;
      }
      break;
  }
};

// Calculate totals
orderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.total = this.subtotal + this.tax + this.shipping + this.rushFee - this.discount;
};

// Check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

// Check if order can be modified
orderSchema.methods.canBeModified = function() {
  return this.status === 'pending';
};

module.exports = mongoose.model('Order', orderSchema);