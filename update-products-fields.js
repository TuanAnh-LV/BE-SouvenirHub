// scripts/completePendingOrders.js
const mongoose = require('mongoose');
const Order = require('./models/order.model');
const OrderItem = require('./models/orderItem.model');
const Product = require('./models/product.model');

const MONGO_URI = ''; // Cập nhật nếu cần

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const pendingOrders = await Order.find({ status: 'completed' });

    for (const order of pendingOrders) {
      order.status = 'pending';
      await order.save();

      const items = await OrderItem.find({ order_id: order._id });
      for (const item of items) {
        await Product.findByIdAndUpdate(item.product_id, {
          $inc: { sold: item.quantity }
        });
      }

      console.log(`✅ Completed order: ${order._id}`);
    }

    console.log('✅ All pending orders marked as completed');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

run();
