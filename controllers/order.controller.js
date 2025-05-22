// controllers/order.controller.js
const Order = require('../models/order.model');
const OrderItem = require('../models/orderItem.model');
const Product = require('../models/product.model');

exports.createOrder = async (req, res) => {
  try {
    const { items, shipping_address_id } = req.body; // items: [{ product_id, quantity }]

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

      product.stock -= item.quantity;
      await product.save();
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
    const orders = await Order.find({ user_id: req.user.id });
    res.json(orders);
  } catch (err) {
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