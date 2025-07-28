const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      subcategory,
      minPrice,
      maxPrice,
      material,
      sort = 'createdAt',
      order = 'desc',
      search,
      featured,
      inStock
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (material) query['material.metal'] = material;
    if (featured === 'true') query.isFeatured = true;
    if (inStock === 'true') query.stock = { $gt: 0 };

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions,
      populate: [
        {
          path: 'reviews.user',
          select: 'name avatar'
        }
      ]
    };

    const products = await Product.paginate(query, options);

    // Add user's wishlist status if authenticated
    if (req.user) {
      const userWishlist = req.user.wishlist.map(id => id.toString());
      products.docs = products.docs.map(product => {
        const productObj = product.toObject();
        productObj.isWishlisted = userWishlist.includes(product._id.toString());
        return productObj;
      });
    }

    res.json({
      products: products.docs,
      pagination: {
        page: products.page,
        pages: products.totalPages,
        total: products.totalDocs,
        hasNext: products.hasNextPage,
        hasPrev: products.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// @route   GET /api/products/categories
// @desc    Get all categories with product counts
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const subcategories = await Product.aggregate([
      { $match: { isActive: true, subcategory: { $exists: true, $ne: null } } },
      { $group: { _id: { category: '$category', subcategory: '$subcategory' }, count: { $sum: 1 } } },
      { $sort: { '_id.category': 1, '_id.subcategory': 1 } }
    ]);

    res.json({
      categories: categories.map(cat => ({ name: cat._id, count: cat.count })),
      subcategories: subcategories.map(sub => ({
        category: sub._id.category,
        name: sub._id.subcategory,
        count: sub.count
      }))
    });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({
      isActive: true,
      isFeatured: true,
      stock: { $gt: 0 }
    })
      .limit(parseInt(limit))
      .sort({ 'rating.average': -1, createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error('Featured products fetch error:', error);
    res.status(500).json({ message: 'Server error fetching featured products' });
  }
});

// @route   GET /api/products/search-suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/search-suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const suggestions = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    })
      .select('name category')
      .limit(5);

    const formattedSuggestions = suggestions.map(product => ({
      text: product.name,
      category: product.category
    }));

    res.json(formattedSuggestions);
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ message: 'Server error fetching suggestions' });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true
    }).populate({
      path: 'reviews.user',
      select: 'name avatar'
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const productObj = product.toObject();

    // Add user's wishlist status if authenticated
    if (req.user) {
      const userWishlist = req.user.wishlist.map(id => id.toString());
      productObj.isWishlisted = userWishlist.includes(product._id.toString());
    }

    // Get related products
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true
    })
      .limit(4)
      .select('name price salePrice images rating category');

    res.json({
      product: productObj,
      relatedProducts
    });
  } catch (error) {
    console.error('Product fetch error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

// @route   POST /api/products/:id/reviews
// @desc    Add a review for a product
// @access  Private
router.post('/:id/reviews', authenticateToken, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { rating, comment, images = [] } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user has already reviewed this product
    const existingReview = product.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Add review
    product.reviews.push({
      user: req.user._id,
      rating,
      comment,
      images
    });

    // Update product rating
    product.updateRating();
    await product.save();

    // Populate the new review
    await product.populate('reviews.user', 'name avatar');

    const newReview = product.reviews[product.reviews.length - 1];

    res.status(201).json({
      message: 'Review added successfully',
      review: newReview
    });
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ message: 'Server error submitting review' });
  }
});

// @route   GET /api/products/:id/reviews
// @desc    Get reviews for a product
// @access  Public
router.get('/:id/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'date' } = req.query;
    
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'reviews.user',
        select: 'name avatar'
      });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Sort reviews
    let sortedReviews = [...product.reviews];
    if (sort === 'rating_high') {
      sortedReviews.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'rating_low') {
      sortedReviews.sort((a, b) => a.rating - b.rating);
    } else {
      sortedReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedReviews = sortedReviews.slice(startIndex, endIndex);

    res.json({
      reviews: paginatedReviews,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(sortedReviews.length / limit),
        total: sortedReviews.length,
        hasNext: endIndex < sortedReviews.length,
        hasPrev: startIndex > 0
      },
      rating: {
        average: product.rating.average,
        count: product.rating.count
      }
    });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({ message: 'Server error fetching reviews' });
  }
});

module.exports = router;