// controllers/admin.controller.js
const Order = require('../models/order.model');
const OrderItem = require('../models/orderItem.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const ShippingAddress = require('../models/shippingAddress.model');
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user_id shipping_address_id');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get orders' });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user_id shipping_address_id');
    const items = await OrderItem.find({ order_id: order._id }).populate('product_id');
    res.json({ order, items });
  } catch (err) {
    res.status(404).json({ error: 'Order not found' });
  }
};

exports.adminUpdateStatus = async (req, res) => {
  try {
    const { order_id, status } = req.body;
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.status = status;
    await order.save();
    res.json({ message: 'Order status updated by admin' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to update order status' });
  }
};
exports.getAdminStats = async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const totalOrders = await Order.countDocuments();
      const payments = await OrderItem.find();
      const revenue = payments.reduce((sum, item) => sum + parseFloat(item.price.toString()) * item.quantity, 0);
  
      const ordersByStatus = await Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
  
      res.json({ totalUsers, totalOrders, totalRevenue: revenue, ordersByStatus });
    } catch (err) {
      res.status(500).json({ error: 'Failed to get admin stats' });
    }
  };
  