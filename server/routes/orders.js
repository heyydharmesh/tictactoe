const express = require('express');
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All order routes require authentication
router.use(authenticateToken);

// @route   POST /api/orders/create
// @desc    Create a new order from cart
// @access  Private
router.post('/create', [
  body('shippingAddress.name').notEmpty().withMessage('Shipping name is required'),
  body('shippingAddress.street').notEmpty().withMessage('Shipping street is required'),
  body('shippingAddress.city').notEmpty().withMessage('Shipping city is required'),
  body('shippingAddress.state').notEmpty().withMessage('Shipping state is required'),
  body('shippingAddress.zipCode').notEmpty().withMessage('Shipping zip code is required'),
  body('shippingAddress.country').notEmpty().withMessage('Shipping country is required'),
  body('billingAddress.name').notEmpty().withMessage('Billing name is required'),
  body('billingAddress.street').notEmpty().withMessage('Billing street is required'),
  body('billingAddress.city').notEmpty().withMessage('Billing city is required'),
  body('billingAddress.state').notEmpty().withMessage('Billing state is required'),
  body('billingAddress.zipCode').notEmpty().withMessage('Billing zip code is required'),
  body('billingAddress.country').notEmpty().withMessage('Billing country is required'),
  body('paymentMethod').isIn(['credit_card', 'debit_card', 'stripe']).withMessage('Valid payment method required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      shippingAddress,
      billingAddress,
      paymentMethod,
      customerNotes = '',
      isGift = false,
      giftMessage = '',
      isRush = false
    } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate cart items
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = cartItem.product;

      // Check product availability
      if (!product || !product.isActive) {
        return res.status(400).json({ 
          message: `Product ${product?.name || 'Unknown'} is no longer available` 
        });
      }

      // Check stock
      if (product.stock < cartItem.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Only ${product.stock} available` 
        });
      }

      // Create order item
      const orderItem = {
        product: product._id,
        productSnapshot: {
          name: product.name,
          description: product.description,
          images: product.images.map(img => img.url),
          sku: product.sku
        },
        quantity: cartItem.quantity,
        size: cartItem.size,
        customization: cartItem.customization,
        priceAtPurchase: cartItem.priceAtTime,
        totalPrice: cartItem.priceAtTime * cartItem.quantity
      };

      orderItems.push(orderItem);
      subtotal += orderItem.totalPrice;
    }

    // Calculate shipping and tax
    const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100
    const taxRate = 0.08; // 8% tax
    const tax = subtotal * taxRate;
    const rushFee = isRush ? 25 : 0;
    const total = subtotal + shipping + tax + rushFee;

    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      subtotal,
      tax,
      shipping,
      rushFee,
      total,
      shippingAddress,
      billingAddress,
      payment: {
        method: paymentMethod,
        status: 'pending'
      },
      customerNotes,
      isGift,
      giftMessage,
      isRush
    });

    await order.save();

    // Update order status to confirmed
    order.updateStatus('confirmed', 'Order created and awaiting payment', req.user._id);
    await order.save();

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error creating order' });
  }
});

// @route   POST /api/orders/:orderId/payment
// @desc    Process payment for an order
// @access  Private
router.post('/:orderId/payment', [
  body('paymentMethodId').notEmpty().withMessage('Payment method ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { orderId } = req.params;
    const { paymentMethodId } = req.body;

    // Find the order
    const order = await Order.findOne({ 
      _id: orderId, 
      user: req.user._id,
      'payment.status': 'pending'
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or already processed' });
    }

    try {
      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.total * 100), // Convert to cents
        currency: 'usd',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        description: `Order ${order.orderNumber}`,
        metadata: {
          orderId: order._id.toString(),
          userId: req.user._id.toString()
        }
      });

      // Update order with payment information
      if (paymentIntent.status === 'succeeded') {
        order.payment.status = 'completed';
        order.payment.transactionId = paymentIntent.id;
        order.payment.paidAt = new Date();
        
        if (paymentIntent.charges.data[0]) {
          const charge = paymentIntent.charges.data[0];
          order.payment.last4 = charge.payment_method_details?.card?.last4;
          order.payment.brand = charge.payment_method_details?.card?.brand;
        }

        order.updateStatus('processing', 'Payment completed successfully', req.user._id);

        // Reduce product stock
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: -item.quantity } }
          );
        }

        // Clear user's cart
        await Cart.findOneAndUpdate(
          { user: req.user._id },
          { $set: { items: [], totalAmount: 0, totalItems: 0 } }
        );

        await order.save();

        res.json({
          message: 'Payment processed successfully',
          order: {
            id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            total: order.total
          }
        });
      } else {
        order.payment.status = 'failed';
        order.updateStatus('cancelled', 'Payment failed', req.user._id);
        await order.save();

        res.status(400).json({ 
          message: 'Payment failed',
          paymentStatus: paymentIntent.status 
        });
      }
    } catch (stripeError) {
      console.error('Stripe payment error:', stripeError);
      
      order.payment.status = 'failed';
      order.updateStatus('cancelled', `Payment failed: ${stripeError.message}`, req.user._id);
      await order.save();

      res.status(400).json({ 
        message: 'Payment processing failed',
        error: stripeError.message 
      });
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ message: 'Server error processing payment' });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('items.product', 'name images')
      .select('-payment.transactionId');

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

// @route   GET /api/orders/:orderId
// @desc    Get single order details
// @access  Private
router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      user: req.user._id 
    })
      .populate('items.product', 'name images category')
      .select('-payment.transactionId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Order fetch error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    res.status(500).json({ message: 'Server error fetching order' });
  }
});

// @route   POST /api/orders/:orderId/cancel
// @desc    Cancel an order
// @access  Private
router.post('/:orderId/cancel', [
  body('reason').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const { reason = '' } = req.body;
    
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      user: req.user._id 
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.canBeCancelled()) {
      return res.status(400).json({ 
        message: 'Order cannot be cancelled in current status' 
      });
    }

    // Process refund if payment was completed
    if (order.payment.status === 'completed' && order.payment.transactionId) {
      try {
        await stripe.refunds.create({
          payment_intent: order.payment.transactionId,
          reason: 'requested_by_customer'
        });

        order.payment.status = 'refunded';
        order.payment.refundedAt = new Date();
        order.payment.refundAmount = order.total;
      } catch (refundError) {
        console.error('Refund error:', refundError);
        // Continue with cancellation even if refund fails
      }
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    order.updateStatus('cancelled', `Cancelled by customer: ${reason}`, req.user._id);
    await order.save();

    res.json({
      message: 'Order cancelled successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Order cancellation error:', error);
    res.status(500).json({ message: 'Server error cancelling order' });
  }
});

// @route   GET /api/orders/stats/summary
// @desc    Get user's order statistics
// @access  Private
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          pendingOrders: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'confirmed', 'processing']] }, 1, 0] }
          }
        }
      }
    ]);

    const summary = stats[0] || {
      totalOrders: 0,
      totalSpent: 0,
      completedOrders: 0,
      pendingOrders: 0
    };

    res.json(summary);
  } catch (error) {
    console.error('Order stats error:', error);
    res.status(500).json({ message: 'Server error fetching order statistics' });
  }
});

module.exports = router;