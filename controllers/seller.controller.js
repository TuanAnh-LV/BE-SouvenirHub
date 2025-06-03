const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const Product = require("../models/product.model");
const Shop = require("../models/shop.model");
const mongoose = require("mongoose");

exports.getShopOrders = async (req, res) => {
  try {
    console.log("Current user ID from token:", req.user.id);
    const ownerShop = await Shop.findOne({ user_id: req.user.id });

    if (!ownerShop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    const shopId = ownerShop.id;
    console.log("Current shop ID from token:", shopId);

    // Lấy product của shop
    const sellerProducts = await Product.find({ shop_id: shopId }, "_id");
    const productIds = sellerProducts.map((p) => p._id);
    console.log("Seller product IDs:", productIds);

    // Lấy tên sản phẩm cần lọc (nếu có)
    const { name } = req.body;

    // Lấy order items, populate product name
    let orderItems = await OrderItem.find({
      product_id: { $in: productIds },
    }).populate({
      path: "product_id",
      select: "name",
    });

    // Nếu có truyền name, lọc orderItems theo tên sản phẩm
    if (name) {
      const nameLower = name.toLowerCase();
      orderItems = orderItems.filter((item) =>
        item.product_id?.name?.toLowerCase().includes(nameLower)
      );
    }

    // Format dữ liệu trả về
    const formattedOrders = orderItems.map((item) => ({
      order_id: item.order_id,
      product_name: item.product_id?.name || "",
      quantity: item.quantity,
      price: item.price,
    }));

    res.status(200).json({ shop: ownerShop, orders: formattedOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get shop orders" });
  }
};

// exports.getShopOrders = async (req, res) => {
//   try {
//     const sellerProducts = await Product.find({ shop_id: req.user.id }, '_id');
//     const productIds = sellerProducts.map(p => p._id);
//     const orderItems = await OrderItem.find({ product_id: { $in: productIds } }).populate('order_id');
//     res.json(orderItems);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to get orders for seller' });
//   }
// };

exports.updateOrderStatus = async (req, res) => {
  try {
    const { order_id, status } = req.body;
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    order.status = status;
    await order.save();
    res.json({ message: "Order status updated" });
  } catch (err) {
    res.status(400).json({ error: "Failed to update order status" });
  }
};

exports.getSellerStats = async (req, res) => {
  try {
    const sellerProducts = await Product.find({ shop_id: req.user.id }, "_id");
    const productIds = sellerProducts.map((p) => p._id);
    const orders = await OrderItem.find({ product_id: { $in: productIds } });
    const totalRevenue = orders.reduce(
      (sum, item) => sum + parseFloat(item.price.toString()) * item.quantity,
      0
    );
    const totalSold = orders.reduce((sum, item) => sum + item.quantity, 0);

    const topProducts = await OrderItem.aggregate([
      { $match: { product_id: { $in: productIds } } },
      { $group: { _id: "$product_id", totalSold: { $sum: "$quantity" } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $project: { name: "$product.name", totalSold: 1 } },
    ]);

    res.json({
      totalOrders: orders.length,
      totalRevenue,
      totalSold,
      topProducts,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get seller stats" });
  }
};
