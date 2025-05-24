// controllers/admin.controller.js
const Order = require('../models/order.model');
const OrderItem = require('../models/orderItem.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const ShippingAddress = require('../models/shippingAddress.model');
const Shop = require('../models/shop.model');
const { sendMail } = require('../utils/mailer');

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
  exports.getAllPendingShops = async (req, res) => {
    try {
      const shops = await Shop.find({ status: 'pending' }).populate('user_id', 'name email');
      res.json(shops);
    } catch (err) {
      console.error('Fetch pending shops error:', err);
      res.status(500).json({ error: 'Failed to fetch pending shops' });
    }
  };
  
  exports.approveShop = async (req, res) => {
    try {
      const { shopId } = req.params;
      const shop = await Shop.findById(shopId).populate('user_id', 'email name');
      if (!shop) return res.status(404).json({ error: 'Shop not found' });
  
      shop.status = 'approved';
      await shop.save();
  
      const user = await User.findById(shop.user_id._id);
  if (user.role === 'buyer') {
  user.role = 'seller';
  await user.save();
}
      // Gửi email xác nhận duyệt
      if (shop.user_id?.email) {
        await sendMail({
          to: shop.user_id.email,
          subject: 'Đơn đăng ký cửa hàng đã được duyệt',
          html: `
            <p>Chào ${shop.user_id.name || 'bạn'},</p>
            <p>Đơn đăng ký cửa hàng <strong>${shop.name}</strong> đã được <b>duyệt</b>.</p>
            <p>Bạn có thể bắt đầu sử dụng hệ thống ngay bây giờ.</p>
            <p>— SouvenirHub</p>
          `
        });
      }
  
      res.json({ message: 'Shop approved', shop });
    } catch (err) {
      console.error('Approve shop error:', err);
      res.status(500).json({ error: 'Failed to approve shop' });
    }
  };
  
  
  exports.rejectShop = async (req, res) => {
    try {
      const { shopId } = req.params;
      const { reason } = req.body;
      const shop = await Shop.findById(shopId).populate('user_id', 'email name');
      if (!shop) return res.status(404).json({ error: 'Shop not found' });
  
      shop.status = 'rejected';
      await shop.save();
  
      // Gửi email thông báo bị từ chối
      if (shop.user_id?.email) {
        await sendMail({
          to: shop.user_id.email,
          subject: 'Đơn đăng ký cửa hàng bị từ chối',
          html: `
            <p>Chào ${shop.user_id.name || 'bạn'},</p>
            <p>Đơn đăng ký cửa hàng <strong>${shop.name}</strong> đã bị <b>từ chối</b>.</p>
            <p>Lý do: ${reason || '(không có lý do cụ thể)'}</p>
            <p>Vui lòng kiểm tra lại thông tin và nộp lại nếu cần.</p>
            <p>— SouvenirHub</p>
          `
        });
      }
  
      res.json({ message: 'Shop rejected', reason });
    } catch (err) {
      console.error('Reject shop error:', err);
      res.status(500).json({ error: 'Failed to reject shop' });
    }
  };
  