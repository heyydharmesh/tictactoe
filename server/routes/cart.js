const express = require('express');
const { body, validationResult } = require('express-validator');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All cart routes require authentication
router.use(authenticateToken);

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name price salePrice images stock isActive category sku'
      });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }

    // Filter out inactive products and update cart
    const activeItems = cart.items.filter(item => 
      item.product && item.product.isActive
    );

    if (activeItems.length !== cart.items.length) {
      cart.items = activeItems;
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ message: 'Server error fetching cart' });
  }
});

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private
router.post('/add', [
  body('productId').isMongoId().withMessage('Valid product ID required'),
  body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10'),
  body('size').optional().trim(),
  body('customization').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { productId, quantity, size = '', customization = {} } = req.body;

    // Check if product exists and is active
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${product.stock} items available` 
      });
    }

    // Check size availability if provided
    if (size && product.sizes.length > 0) {
      const sizeInfo = product.sizes.find(s => s.size === size);
      if (!sizeInfo || sizeInfo.stock < quantity) {
        return res.status(400).json({ 
          message: `Size ${size} not available or insufficient stock` 
        });
      }
    }

    // Get current price (considering sale price)
    const currentPrice = product.salePrice && product.salePrice < product.price 
      ? product.salePrice 
      : product.price;

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Add item to cart
    cart.addItem(productId, quantity, size, customization, currentPrice);
    await cart.save();

    // Populate the cart before sending response
    await cart.populate({
      path: 'items.product',
      select: 'name price salePrice images stock isActive category sku'
    });

    res.json({
      message: 'Item added to cart successfully',
      cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error adding item to cart' });
  }
});

// @route   PUT /api/cart/update/:itemId
// @desc    Update cart item quantity
// @access  Private
router.put('/update/:itemId', [
  body('quantity').isInt({ min: 0, max: 10 }).withMessage('Quantity must be between 0 and 10')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { quantity } = req.body;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(item => item._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Check stock if increasing quantity
    if (quantity > item.quantity) {
      const product = await Product.findById(item.product);
      const additionalQuantity = quantity - item.quantity;
      
      if (product.stock < additionalQuantity) {
        return res.status(400).json({ 
          message: `Insufficient stock. Only ${product.stock} additional items available` 
        });
      }

      // Check size stock if applicable
      if (item.size && product.sizes.length > 0) {
        const sizeInfo = product.sizes.find(s => s.size === item.size);
        if (!sizeInfo || sizeInfo.stock < additionalQuantity) {
          return res.status(400).json({ 
            message: `Size ${item.size} has insufficient stock` 
          });
        }
      }
    }

    // Update item quantity
    cart.updateItemQuantity(itemId, quantity);
    await cart.save();

    // Populate the cart before sending response
    await cart.populate({
      path: 'items.product',
      select: 'name price salePrice images stock isActive category sku'
    });

    res.json({
      message: 'Cart updated successfully',
      cart
    });
  } catch (error) {
    console.error('Cart update error:', error);
    res.status(500).json({ message: 'Server error updating cart' });
  }
});

// @route   DELETE /api/cart/remove/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/remove/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.removeItem(itemId);
    await cart.save();

    // Populate the cart before sending response
    await cart.populate({
      path: 'items.product',
      select: 'name price salePrice images stock isActive category sku'
    });

    res.json({
      message: 'Item removed from cart successfully',
      cart
    });
  } catch (error) {
    console.error('Cart item removal error:', error);
    res.status(500).json({ message: 'Server error removing item from cart' });
  }
});

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete('/clear', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.clearCart();
    await cart.save();

    res.json({
      message: 'Cart cleared successfully',
      cart
    });
  } catch (error) {
    console.error('Cart clear error:', error);
    res.status(500).json({ message: 'Server error clearing cart' });
  }
});

// @route   GET /api/cart/count
// @desc    Get cart item count
// @access  Private
router.get('/count', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    const count = cart ? cart.totalItems : 0;

    res.json({ count });
  } catch (error) {
    console.error('Cart count error:', error);
    res.status(500).json({ message: 'Server error fetching cart count' });
  }
});

// @route   POST /api/cart/validate
// @desc    Validate cart items before checkout
// @access  Private
router.post('/validate', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const validationErrors = [];
    const validItems = [];

    for (const item of cart.items) {
      const product = item.product;
      
      // Check if product is still active
      if (!product || !product.isActive) {
        validationErrors.push({
          itemId: item._id,
          message: 'Product is no longer available'
        });
        continue;
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        validationErrors.push({
          itemId: item._id,
          message: `Only ${product.stock} items available, but ${item.quantity} requested`
        });
        continue;
      }

      // Check size availability
      if (item.size && product.sizes.length > 0) {
        const sizeInfo = product.sizes.find(s => s.size === item.size);
        if (!sizeInfo || sizeInfo.stock < item.quantity) {
          validationErrors.push({
            itemId: item._id,
            message: `Size ${item.size} not available or insufficient stock`
          });
          continue;
        }
      }

      // Check if price has changed significantly
      const currentPrice = product.salePrice && product.salePrice < product.price 
        ? product.salePrice 
        : product.price;
      
      const priceDifference = Math.abs(currentPrice - item.priceAtTime);
      const priceChangePercentage = (priceDifference / item.priceAtTime) * 100;

      if (priceChangePercentage > 5) { // 5% price change threshold
        validationErrors.push({
          itemId: item._id,
          message: `Price has changed from $${item.priceAtTime} to $${currentPrice}`,
          priceChange: {
            old: item.priceAtTime,
            new: currentPrice
          }
        });
      }

      validItems.push(item);
    }

    res.json({
      isValid: validationErrors.length === 0,
      errors: validationErrors,
      validItems: validItems.length,
      totalItems: cart.items.length
    });
  } catch (error) {
    console.error('Cart validation error:', error);
    res.status(500).json({ message: 'Server error validating cart' });
  }
});

module.exports = router;