const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const Product = require("../models/product.model");
const Shop = require("../models/shop.model");
const mongoose = require("mongoose");
const ProductImage = require("../models/productImage.model");
const moment = require("moment");


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
    const formattedOrders = orderItems.map((item) => {
      const price = item.price;
      const quantity = item.quantity;
      const rate = getCommissionRate(price);
      const commission = price * rate * quantity;
      const total = price * quantity;
    
      return {
        order_id: item.order_id,
        product_name: item.product_id?.name || "",
        quantity,
        price,
        commission_rate: rate,
        commission_amount: commission,
        total_amount: total,
        net_amount: total - commission,
      };
    });
    

    res.status(200).json({ shop: ownerShop, orders: formattedOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get shop orders" });
  }
};


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
function getCommissionRate(price) {
  if (price < 100000) return 0.03;
  if (price <= 400000) return 0.07;
  if (price <= 1000000) return 0.12;
  return 0.07;
}
exports.getSellerStats = async (req, res) => {
  try {
    const shop = await Shop.findOne({ user_id: req.user.id }).populate("user_id", "name email");
    if (!shop) return res.status(404).json({ error: "Shop not found" });

    const products = await Product.find({ shop_id: shop._id });
    const productIds = products.map((p) => p._id);

    const images = await ProductImage.find({ product_id: { $in: productIds } });
    const productsWithImages = products.map((product) => {
      const productImages = images
        .filter((img) => img.product_id.toString() === product._id.toString())
        .map((img) => img.url);
      return { ...product.toObject(), images: productImages };
    });

    const orderItems = await OrderItem.find({ product_id: { $in: productIds } });
    const orderIds = [...new Set(orderItems.map((item) => item.order_id.toString()))];
    const orders = await Order.find({ _id: { $in: orderIds } });

    const completedOrders = orders.filter((o) => o.status === "completed");

    // 1. Tính tổng hoa hồng
    let totalCommission = 0;
    for (const item of orderItems) {
      const order = completedOrders.find(
        (o) => o._id.toString() === item.order_id.toString()
      );
      if (!order) continue;

      const productPrice = Number(item.price?.$numberDecimal || item.price || 0);
      const rate = getCommissionRate(productPrice);
      totalCommission += productPrice * rate * item.quantity;
    }

    // 2. Tính tổng doanh thu từ các đơn hoàn thành
    const totalRevenue = completedOrders.reduce((sum, o) => {
      const total = Number(o.total_price?.$numberDecimal || o.total_price || 0);
      return sum + total;
    }, 0);

    // 3. Tính doanh thu thực nhận
    const netRevenue = totalRevenue - totalCommission;

    // 4. Đếm số đơn
    const totalOrders = completedOrders.length;
    const totalCancelled = orders.filter((o) => o.status === "cancelled").length;

    // 5. Doanh thu theo tháng
    const revenueByMonth = {};
    for (const order of completedOrders) {
      const total = Number(order.total_price?.$numberDecimal || order.total_price || 0);
      const monthKey = moment(order.created_at).format("YYYY-MM");
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + total;
    }

    // 6. Tính sản phẩm bán chạy
    const completedOrderIds = new Set(completedOrders.map((o) => o._id.toString()));
    const productSales = {};
    for (const item of orderItems) {
      if (completedOrderIds.has(item.order_id.toString())) {
        const pid = item.product_id.toString();
        productSales[pid] = (productSales[pid] || 0) + item.quantity;
      }
    }

    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, quantity]) => {
        const product = products.find((p) => p._id.toString() === productId);
        return product ? {
          product_id: productId,
          name: product.name,
          quantity_sold: quantity,
        } : null;
      }).filter(Boolean);

    // 7. Trả kết quả
    res.json({
      ...shop.toObject(),
      address: shop.address || "",
      productCount: products.length,
      products: productsWithImages,
      totalRevenue,
      totalCommission,
      netRevenue,
      totalOrders,
      totalCancelled,
      revenueByMonth,
      topProducts,
      rating: shop.rating || 0,
    });
  } catch (err) {
    console.error("Failed to get seller stats:", err);
    res.status(500).json({ error: "Failed to get seller stats" });
  }
};


