// controllers/order.controller.js
const Order = require('../models/order.model');
const OrderItem = require('../models/orderItem.model');
const Product = require('../models/product.model');

exports.createOrder = async (req, res) => {
  try {
    const { items, shipping_address_id } = req.body;
    let total_price = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ error: `Product ${item.product_id} unavailable or out of stock` });
      }

      const itemTotal = parseFloat(product.price.toString()) * item.quantity;
      total_price += itemTotal;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price
      });

      // ✅ Trừ stock bằng $inc duy nhất
      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { stock: -item.quantity }
      });
    }

    const order = new Order({
      user_id: req.user.id,
      shipping_address_id,
      total_price,
      status: 'pending'
    });
    await order.save();

    for (const item of orderItems) {
      await new OrderItem({ ...item, order_id: order._id }).save();
    }

    res.status(201).json({ message: 'Order placed successfully', order_id: order._id });
  } catch (err) {
    console.error('Order Error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
};


exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user.id }).sort({ created_at: -1 });

    const result = [];

    for (const order of orders) {
      const items = await OrderItem.find({ order_id: order._id }).populate('product_id');
      result.push({
        ...order.toObject(),
        items
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching orders with items:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const items = await OrderItem.find({ order_id: order._id }).populate('product_id');
    res.json({ order, items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Hủy đơn hàng (chỉ khi còn trạng thái "pending")
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user_id: req.user.id });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be cancelled' });
    }

    order.status = 'cancelled';
    await order.save();

    // Hoàn lại stock và giảm sold
    const orderItems = await OrderItem.find({ order_id: order._id });
    for (const item of orderItems) {
      const product = await Product.findById(item.product_id);
      if (product) {
        product.stock += item.quantity;
        product.sold = Math.max(0, (product.sold || 0) - item.quantity);
        await product.save();
      }
    }

    res.json({ message: 'Order cancelled' });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

// Cập nhật trạng thái đơn hàng (dành cho admin hoặc xử lý đơn hàng)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    await order.save();

    // 👉 Chỉ tăng sold khi đơn hoàn thành
    if (status === 'completed') {
      const orderItems = await OrderItem.find({ order_id: order._id });
      for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product_id, {
          $inc: { sold: item.quantity }
        });
      }
    }

    res.json({ message: 'Order status updated', order });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};
