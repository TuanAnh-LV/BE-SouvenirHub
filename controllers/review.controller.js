const Review = require('../models/review.model');
const OrderItem = require('../models/orderItem.model');
const Product = require('../models/product.model');
const Shop = require('../models/shop.model');
const Order = require('../models/order.model')

exports.createReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Nếu là seller → kiểm tra không được tự review sản phẩm mình
    if (userRole === 'seller') {
      const product = await Product.findById(product_id);
      const shop = await Shop.findOne({ owner: userId });
      if (product && shop && product.shop_id.equals(shop._id)) {
        return res.status(403).json({ error: 'You cannot review your own product.' });
      }
    }

    // Kiểm tra người dùng đã mua sản phẩm chưa
    const hasPurchased = await Order.exists({
      user_id: userId,
      status: 'completed',
      _id: { $in: await OrderItem.find({ product_id }).distinct('order_id') }
    });
    
    if (!hasPurchased) {
      return res.status(403).json({ error: 'You can only review products you have purchased.' });
    }

    const review = new Review({ product_id, rating, comment, user_id: userId });
    await review.save();

    // ✅ Cập nhật điểm trung bình và số lượng đánh giá
    const reviews = await Review.find({ product_id });
    const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(product_id, {
      averageRating: average,
      reviewCount: reviews.length
    });

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
