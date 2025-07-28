const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// DASHBOARD STATS
// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      recentOrders,
      topProducts,
      monthlyRevenue
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
        .populate('items.product', 'name'),
      Product.aggregate([
        { $match: { isActive: true } },
        { $sort: { 'rating.average': -1, 'rating.count': -1 } },
        { $limit: 5 },
        { $project: { name: 1, 'rating.average': 1, 'rating.count': 1, price: 1 } }
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            status: { $in: ['delivered', 'processing', 'shipped'] }
          }
        },
        { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } }
      ])
    ]);

    const monthlyStats = monthlyRevenue[0] || { revenue: 0, count: 0 };

    res.json({
      overview: {
        totalProducts,
        totalOrders,
        totalUsers,
        monthlyRevenue: monthlyStats.revenue,
        monthlyOrders: monthlyStats.count
      },
      recentOrders,
      topProducts
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

// PRODUCT MANAGEMENT
// @route   GET /api/admin/products
// @desc    Get all products for admin
// @access  Admin
router.get('/products', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      status,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};
    if (category) query.category = category;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('name price salePrice stock category isActive isFeatured sku rating createdAt');

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Admin products fetch error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// @route   POST /api/admin/products
// @desc    Create a new product
// @access  Admin
router.post('/products', upload.array('images', 10), [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Product name is required (1-100 characters)'),
  body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Description is required (max 2000 characters)'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isIn(['rings', 'necklaces', 'earrings', 'bracelets', 'watches', 'sets', 'custom']).withMessage('Valid category required'),
  body('material.metal').isIn(['gold', 'silver', 'platinum', 'titanium', 'stainless-steel', 'brass', 'copper', 'other']).withMessage('Valid metal type required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('sku').trim().isLength({ min: 1 }).withMessage('SKU is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    // Check if SKU already exists
    const existingSku = await Product.findOne({ sku: req.body.sku });
    if (existingSku) {
      return res.status(400).json({ message: 'SKU already exists' });
    }

    // Upload images to Cloudinary
    const images = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        try {
          const result = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            {
              folder: 'jewelry-store/products',
              transformation: [
                { width: 800, height: 800, crop: 'limit', quality: 'auto' }
              ]
            }
          );
          images.push({
            url: result.secure_url,
            altText: req.body.name,
            isPrimary: i === 0
          });
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }
    }

    // Parse complex fields
    const material = JSON.parse(req.body.material || '{}');
    const gemstones = req.body.gemstones ? JSON.parse(req.body.gemstones) : [];
    const dimensions = req.body.dimensions ? JSON.parse(req.body.dimensions) : {};
    const sizes = req.body.sizes ? JSON.parse(req.body.sizes) : [];
    const customizationOptions = req.body.customizationOptions ? JSON.parse(req.body.customizationOptions) : {};

    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      salePrice: req.body.salePrice ? parseFloat(req.body.salePrice) : undefined,
      category: req.body.category,
      subcategory: req.body.subcategory,
      material,
      gemstones,
      dimensions,
      sizes,
      stock: parseInt(req.body.stock),
      sku: req.body.sku,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      isCustomizable: req.body.isCustomizable === 'true',
      customizationOptions,
      isFeatured: req.body.isFeatured === 'true',
      images
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ message: 'Server error creating product' });
  }
});

// @route   GET /api/admin/products/:id
// @desc    Get single product for admin
// @access  Admin
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('reviews.user', 'name email');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Product fetch error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

// @route   PUT /api/admin/products/:id
// @desc    Update a product
// @access  Admin
router.put('/products/:id', upload.array('newImages', 10), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Handle new image uploads
    const newImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            {
              folder: 'jewelry-store/products',
              transformation: [
                { width: 800, height: 800, crop: 'limit', quality: 'auto' }
              ]
            }
          );
          newImages.push({
            url: result.secure_url,
            altText: req.body.name || product.name,
            isPrimary: false
          });
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }
    }

    // Combine existing images with new ones
    const existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : product.images;
    const allImages = [...existingImages, ...newImages];

    // Update product fields
    const updateFields = [
      'name', 'description', 'price', 'salePrice', 'category', 'subcategory',
      'stock', 'tags', 'isCustomizable', 'isFeatured', 'isActive'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'price' || field === 'salePrice') {
          product[field] = req.body[field] ? parseFloat(req.body[field]) : undefined;
        } else if (field === 'stock') {
          product[field] = parseInt(req.body[field]);
        } else if (field === 'tags') {
          product[field] = req.body[field] ? req.body[field].split(',').map(tag => tag.trim()) : [];
        } else if (field === 'isCustomizable' || field === 'isFeatured' || field === 'isActive') {
          product[field] = req.body[field] === 'true';
        } else {
          product[field] = req.body[field];
        }
      }
    });

    // Update complex fields if provided
    if (req.body.material) product.material = JSON.parse(req.body.material);
    if (req.body.gemstones) product.gemstones = JSON.parse(req.body.gemstones);
    if (req.body.dimensions) product.dimensions = JSON.parse(req.body.dimensions);
    if (req.body.sizes) product.sizes = JSON.parse(req.body.sizes);
    if (req.body.customizationOptions) product.customizationOptions = JSON.parse(req.body.customizationOptions);

    product.images = allImages;
    await product.save();

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ message: 'Server error updating product' });
  }
});

// @route   DELETE /api/admin/products/:id
// @desc    Delete a product (soft delete)
// @access  Admin
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = false;
    await product.save();

    res.json({ message: 'Product deactivated successfully' });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

// ORDER MANAGEMENT
// @route   GET /api/admin/orders
// @desc    Get all orders for admin
// @access  Admin
router.get('/orders', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      dateFrom,
      dateTo,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};
    if (status) query.status = status;
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;

    const orders = await Order.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email')
      .populate('items.product', 'name sku')
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
    console.error('Admin orders fetch error:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Admin
router.put('/orders/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).withMessage('Valid status required'),
  body('note').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { status, note = '', trackingNumber = '', carrier = '' } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update tracking information if provided
    if (trackingNumber) order.tracking.trackingNumber = trackingNumber;
    if (carrier) order.tracking.carrier = carrier;

    order.updateStatus(status, note, req.user._id);
    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ message: 'Server error updating order status' });
  }
});

// USER MANAGEMENT
// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;

    const users = await User.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

module.exports = router;