const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name price mainImage stock sku');

    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add item to cart
router.post('/add', auth, async (req, res) => {
  try {
    const { productId, quantity = 1, customOptions = {} } = req.body;

    // Validate product exists and has stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    await cart.addItem(productId, quantity, customOptions);
    await cart.populate('items.product', 'name price mainImage stock sku');

    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Update cart item quantity
router.put('/update/:itemId', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Check stock availability
    const item = cart.items.find(item => item._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const product = await Product.findById(item.product);
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    await cart.updateQuantity(itemId, quantity);
    await cart.populate('items.product', 'name price mainImage stock sku');

    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await cart.removeItem(itemId);
    await cart.populate('items.product', 'name price mainImage stock sku');

    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear cart
router.delete('/clear', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await cart.clearCart();
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply coupon code
router.post('/apply-coupon', auth, async (req, res) => {
  try {
    const { couponCode } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Simple coupon logic - you can extend this
    const validCoupons = {
      'WELCOME10': 10,
      'SAVE20': 20,
      'FREESHIP': 10
    };

    if (!validCoupons[couponCode]) {
      return res.status(400).json({ message: 'Invalid coupon code' });
    }

    cart.couponCode = couponCode;
    cart.discount = validCoupons[couponCode];
    await cart.calculateTotals();
    await cart.populate('items.product', 'name price mainImage stock sku');

    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove coupon code
router.delete('/remove-coupon', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.couponCode = null;
    cart.discount = 0;
    await cart.calculateTotals();
    await cart.populate('items.product', 'name price mainImage stock sku');

    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get cart summary
router.get('/summary', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name price mainImage stock');

    if (!cart) {
      return res.json({
        itemCount: 0,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0
      });
    }

    res.json({
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: cart.subtotal,
      tax: cart.tax,
      shipping: cart.shipping,
      discount: cart.discount,
      total: cart.total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;