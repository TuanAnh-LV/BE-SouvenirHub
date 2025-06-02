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
  

  exports.getAllShops = async (req, res) => {
    try {
      const shops = await Shop.find().populate('user_id', 'name email');
      const enhancedShops = await Promise.all(
        shops.map(async (shop) => {
          const productCount = await Product.countDocuments({ shop_id: shop._id });
          return {
            ...shop.toObject(),
            productCount,
            address: shop.address || '',
          };
        })
      );
  
      res.json(enhancedShops);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch shops' });
    }
  };
  
  
  exports.getShopById = async (req, res) => {
    try {
      const shop = await Shop.findById(req.params.id).populate('user_id', 'name email');
      if (!shop) return res.status(404).json({ error: 'Shop not found' });
      res.json(shop);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch shop' });
    }
  };
  
  exports.updateShopStatus = async (req, res) => {
    try {
      const { status, reason } = req.body;
      const { shopId } = req.params;
  
      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
  
      const shop = await Shop.findById(shopId).populate('user_id', 'email name role');
      if (!shop) return res.status(404).json({ error: 'Shop not found' });
  
      shop.status = status;
      await shop.save();
  
      // Nếu duyệt → nâng role seller
      if (status === 'approved') {
        const user = await User.findById(shop.user_id._id);
        if (user.role === 'buyer') {
          user.role = 'seller';
          await user.save();
        }
      }
  
      // Gửi email theo trạng thái
      if (shop.user_id?.email) {
        let subject = '', html = '';
  
        if (status === 'approved') {
          subject = 'Đơn đăng ký cửa hàng đã được duyệt';
          html = `
            <p>Chào ${shop.user_id.name || 'bạn'},</p>
            <p>Đơn đăng ký cửa hàng <strong>${shop.name}</strong> đã được <b>duyệt</b>.</p>
            <p>Bạn có thể bắt đầu sử dụng hệ thống ngay bây giờ.</p>
            <p>— SouvenirHub</p>
          `;
        } else if (status === 'rejected') {
          subject = 'Đơn đăng ký cửa hàng bị từ chối';
          html = `
            <p>Chào ${shop.user_id.name || 'bạn'},</p>
            <p>Đơn đăng ký cửa hàng <strong>${shop.name}</strong> đã bị <b>từ chối</b>.</p>
            <p>Lý do: ${reason || '(không có lý do cụ thể)'}</p>
            <p>Vui lòng kiểm tra lại thông tin và nộp lại nếu cần.</p>
            <p>— SouvenirHub</p>
          `;
        }
  
        await sendMail({ to: shop.user_id.email, subject, html });
      }
  
      res.json({ message: 'Shop status updated', shop });
    } catch (err) {
      console.error('Update shop status error:', err);
      res.status(500).json({ error: 'Failed to update shop status' });
    }
  };
  
  exports.updateShop = async (req, res) => {
    try {
      const updated = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) return res.status(404).json({ error: 'Shop not found' });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update shop' });
    }
  };
  
  exports.deleteShop = async (req, res) => {
    try {
      const deleted = await Shop.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Shop not found' });
      res.json({ message: 'Shop deleted' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete shop' });
    }
  };
  exports.approveProduct = async (req, res) => {
    try {
      const { productId } = req.params;
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ error: 'Product not found' });
  
      product.status = 'onSale';
      await product.save();
  
      res.json({ message: 'Product approved and set to onSale', product });
    } catch (err) {
      res.status(500).json({ error: 'Failed to approve product' });
    }
  };
  
  exports.getPendingProducts = async (req, res) => {
    try {
      const products = await Product.find({ status: 'pendingApproval' }).populate('shop_id', 'name');
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch pending products' });
    }
  };
  exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); 
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get users' });
  }
};
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
