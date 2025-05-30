// controllers/review.controller.js
const Review = require('../models/review.model');
const OrderItem = require('../models/orderItem.model');
const Product = require('../models/product.model');
const Shop = require('../models/shop.model');

exports.createReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // If seller → check if reviewing their own product
    if (userRole === 'seller') {
      const product = await Product.findById(product_id);
      const shop = await Shop.findOne({ owner: userId });
      if (product && shop && product.shop_id.equals(shop._id)) {
        return res.status(403).json({ error: 'You cannot review your own product.' });
      }
    }

    // Check if user has purchased the product
    const hasPurchased = await OrderItem.exists({ product_id, user_id: userId });
    if (!hasPurchased) {
      return res.status(403).json({ error: 'You can only review products you have purchased.' });
    }

    const review = new Review({ product_id, rating, comment, user_id: userId });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    console.error('Create review error:', err);
    res.status(400).json({ error: 'Failed to submit review' });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product_id: req.params.productId }).populate('user_id', 'name');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};
