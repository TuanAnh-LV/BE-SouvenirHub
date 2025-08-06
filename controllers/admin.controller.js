// controllers/admin.controller.js
const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const ShippingAddress = require("../models/shippingAddress.model");
const Shop = require("../models/shop.model");
const { sendMail } = require("../utils/mailer");
const ShopApplication = require("../models/shopApplication.model");
const ShopImage = require("../models/shopImage.model");
const { uploadToCloudinary } = require("../utils/cloudinary"); 
const { isValidImage } = require('../utils/validator'); 

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user_id shipping_address_id");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to get orders" });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user_id shipping_address_id"
    );
    const items = await OrderItem.find({ order_id: order._id }).populate(
      "product_id"
    );
    res.json({ order, items });
  } catch (err) {
    res.status(404).json({ error: "Order not found" });
  }
};

exports.adminUpdateStatus = async (req, res) => {
  try {
    const { order_id, status } = req.body;
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    order.status = status;
    await order.save();
    res.json({ message: "Order status updated by admin" });
  } catch (err) {
    res.status(400).json({ error: "Failed to update order status" });
  }
};
exports.getAdminStats = async (req, res) => {
  try {
    // 1. Tổng số liệu
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalShops = await Shop.countDocuments();

    // 2. Tổng doanh thu
    const payments = await OrderItem.find();
    const revenue = payments.reduce(
      (sum, item) => sum + parseFloat(item.price.toString()) * item.quantity,
      0
    );

    // 3. Đơn hàng theo trạng thái
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // 4. Doanh thu theo tháng (6 tháng gần nhất)
    const recentOrders = await Order.find({ status: "completed" });
    const revenueByMonth = {};

    recentOrders.forEach((order) => {
      const monthKey = moment(order.created_at).format("YYYY-MM");
      const price = Number(order.total_price?.$numberDecimal || order.total_price || 0);
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + price;
    });

    // 5. Người dùng mới theo tháng (6 tháng gần nhất)
    const sixMonthsAgo = moment().subtract(6, "months").startOf("month").toDate();
    const usersByMonthAgg = await User.aggregate([
      { $match: { created_at: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$created_at" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const usersByMonth = {};
    usersByMonthAgg.forEach((item) => {
      usersByMonth[item._id] = item.count;
    });
    
    

    // ✅ Trả về
    res.json({
      totalUsers,
      totalOrders,
      totalRevenue: revenue,
      ordersByStatus,
      totalProducts,
      totalShops,
      revenueByMonth,
      usersByMonth,
    });
  } catch (err) {
    console.error("getAdminStats error:", err);
    res.status(500).json({ error: "Failed to get admin stats" });
  }
};
exports.getAllPendingShops = async (req, res) => {
  try {
    const shops = await Shop.find({ status: "pending" }).populate(
      "user_id",
      "name email"
    );
    res.json(shops);
  } catch (err) {
    console.error("Fetch pending shops error:", err);
    res.status(500).json({ error: "Failed to fetch pending shops" });
  }
};

exports.getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find().populate("user_id", "name email");
    const enhancedShops = await Promise.all(
      shops.map(async (shop) => {
        const productCount = await Product.countDocuments({
          shop_id: shop._id,
        });
        return {
          ...shop.toObject(),
          productCount,
          address: shop.address || "",
        };
      })
    );

    res.json(enhancedShops);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch shops" });
  }
};

const ProductImage = require("../models/productImage.model"); // nhớ import nếu chưa có

const moment = require("moment"); // thêm nếu bạn chưa có


function getCommissionRate(price) {
  if (price < 100000) return 0.03;
  if (price <= 400000) return 0.07;
  if (price <= 1000000) return 0.12;
  return 0.07;
}

exports.getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate("user_id", "name email");
    if (!shop) return res.status(404).json({ error: "Shop not found" });

    const products = await Product.find({ shop_id: shop._id });
    const productIds = products.map((p) => p._id);
const ratedProducts = products.filter(p => p.averageRating && p.reviewCount > 0);
const rating =
  ratedProducts.length > 0
    ? (
        ratedProducts.reduce((sum, p) => sum + p.averageRating, 0) /
        ratedProducts.length
      ).toFixed(1)
    : 0;
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

    const completedOrders = orders.filter((order) => order.status === "completed");
    const completedOrderIds = new Set(completedOrders.map((o) => o._id.toString()));

    // 🔢 Tổng doanh thu
    const totalRevenue = completedOrders.reduce((sum, order) => {
      const price = Number(order.total_price?.$numberDecimal || order.total_price || 0);
      return sum + price;
    }, 0);

    // 🔢 Tổng hoa hồng
    let totalCommission = 0;
    for (const item of orderItems) {
      const order = completedOrders.find(
        (o) => o._id.toString() === item.order_id.toString()
      );
      if (!order) continue;

      const price = Number(item.price?.$numberDecimal || item.price || 0);
      const rate = getCommissionRate(price);
      totalCommission += price * rate * item.quantity;
    }

    // 🔢 Doanh thu thực nhận
    const netRevenue = totalRevenue - totalCommission;

    // 🔢 Thống kê đơn
    const totalOrders = completedOrders.length;
    const totalCancelled = orders.filter((o) => o.status === "cancelled").length;

    // 🔢 Doanh thu theo tháng
    const revenueByMonth = {};
    for (const order of completedOrders) {
      const monthKey = moment(order.created_at).format("YYYY-MM");
      const price = Number(order.total_price?.$numberDecimal || order.total_price || 0);
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + price;
    }

    // 🔢 Sản phẩm bán chạy
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
        return product
          ? {
              product_id: productId,
              name: product.name,
              quantity_sold: quantity,
            }
          : null;
      })
      .filter(Boolean);

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
      rating: Number(rating),
    });
  } catch (err) {
    console.error("Failed to fetch shop by ID:", err);
    res.status(500).json({ error: "Failed to fetch shop" });
  }
};


exports.updateShopStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const { shopId } = req.params;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const shop = await Shop.findById(shopId).populate("user_id", "email name role shop_id");
    if (!shop) return res.status(404).json({ error: "Shop not found" });

    shop.status = status;

    const user = await User.findById(shop.user_id._id);

    if (status === "approved") {
      // ✅ Gán role & shop_id
      if (user.role === "buyer") user.role = "seller";
      if (!user.shop_id) user.shop_id = shop._id;

      // ✅ Đồng bộ từ đơn
      const application = await ShopApplication.findOne({ shop_id: shop._id });
      if (application) {
        if (!shop.logo_url && application.logo_file) {
          shop.logo_url = application.logo_file;
        }
        if (!shop.address && application.address) {
          shop.address = application.address;
        }
        if (!shop.name && application.business_name) {
          shop.name = application.business_name;
        }
      }
    }

    if (status === "rejected") {
      // ✅ Xoá liên kết shop_id để cho phép đăng ký lại
      if (user.shop_id?.toString() === shop._id.toString()) {
        user.shop_id = null;
      }
    }

    await user.save();
    await shop.save();

    // 📨 Gửi mail cho seller
    if (shop.user_id?.email) {
      let subject = "", html = "";

      if (status === "approved") {
        subject = "Đơn đăng ký cửa hàng đã được duyệt";
        html = `
          <p>Chào ${shop.user_id.name || "bạn"},</p>
          <p>Đơn đăng ký cửa hàng <strong>${shop.name}</strong> đã được <b>duyệt</b>.</p>
          <p>Bạn có thể bắt đầu sử dụng hệ thống ngay bây giờ.</p>
          <p>— SouvenirHub</p>
        `;
      } else if (status === "rejected") {
        subject = "Đơn đăng ký cửa hàng bị từ chối";
        html = `
          <p>Chào ${shop.user_id.name || "bạn"},</p>
          <p>Đơn đăng ký cửa hàng <strong>${shop.name}</strong> đã bị <b>từ chối</b>.</p>
          <p><b>Lý do:</b> ${reason || "(không rõ lý do)"}</p>
          <p>Bạn có thể chỉnh sửa hồ sơ và gửi lại đăng ký nếu muốn.</p>
          <p>— SouvenirHub</p>
        `;
      }

      await sendMail({ to: shop.user_id.email, subject, html });
    }

    res.json({ message: "Shop status updated", shop });
  } catch (err) {
    console.error("Update shop status error:", err);
    res.status(500).json({ error: "Failed to update shop status" });
  }
};


exports.updateShop = async (req, res) => {
  try {
    const updated = await Shop.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Shop not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update shop" });
  }
};

exports.deleteShop = async (req, res) => {
  try {
    const shopId = req.params.id;

    // ✅ Xoá dữ liệu liên quan trước
    await Promise.all([
      Product.deleteMany({ shop_id: shopId }),
      ShopApplication.deleteMany({ shop_id: shopId }),
      ShopImage.deleteMany({ shop_id: shopId }),
    ]);

    const deleted = await Shop.findByIdAndDelete(shopId);
    await User.findOneAndUpdate({ shop_id: shopId }, { shop_id: null });
    if (!deleted) return res.status(404).json({ error: "Shop not found" });

    res.json({ message: "Shop and related data deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete shop:", err);
    res.status(500).json({ error: "Failed to delete shop" });
  }
};

exports.approveProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.status = "onSale";
    await product.save();

    res.json({ message: "Product approved and set to onSale", product });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve product" });
  }
};

exports.getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "pendingApproval" }).populate(
      "shop_id",
      "name"
    );
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pending products" });
  }
};


exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("shop_id", "name")
      .lean();
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Nếu bạn có model productImage => lấy ảnh
    const ProductImage = require("../models/productImage.model");
    const images = await ProductImage.find({ product_id: product._id });
    product.images = images.map((img) => img.url);

    res.json(product);
  } catch (err) {
    console.error("Get product by ID error:", err);
    res.status(500).json({ error: "Failed to get product detail" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password_hash");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
exports.updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Remove empty strings
    Object.keys(updates).forEach((key) => {
      if (updates[key] === "") {
        delete updates[key];
      }
    });

    // Validate file type
    if (req.file && !isValidImage(req.file.mimetype)) {
      return res.status(400).json({ error: "Invalid file type" });
    }

    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "souvenirhub/avatars"
      );
      updates.avatar = result.secure_url;
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    Object.assign(user, updates);
    await user.save();

    res.json({
      message: "User updated",
      user: user.toObject({ versionKey: false }),
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "User not found" });

    // ✅ Nếu user là seller, cũng xóa shop nếu có (nếu muốn)
    if (deleted.shop_id) {
      await Shop.findByIdAndDelete(deleted.shop_id);
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};

exports.deleteShop = async (req, res) => {
  try {
    const shopId = req.params.id;

    // ✅ Xoá dữ liệu liên quan trước
    await Promise.all([
      Product.deleteMany({ shop_id: shopId }),
      ShopApplication.deleteMany({ shop_id: shopId }),
      ShopImage.deleteMany({ shop_id: shopId }),
    ]);

    // ✅ Cập nhật user: xoá shop_id và đổi role thành 'customer'
    await User.findOneAndUpdate(
      { shop_id: shopId },
      {
        $set: {
          shop_id: null,
          role: 'buyer'
        }
      }
    );

    const deleted = await Shop.findByIdAndDelete(shopId);
    if (!deleted) return res.status(404).json({ error: "Shop not found" });

    res.json({ message: "Shop and related data deleted successfully" });
  } catch (err) {
    console.error(" Failed to delete shop:", err);
    res.status(500).json({ error: "Failed to delete shop" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

exports.rejectProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;

    const product = await Product.findById(productId).populate("shop_id");
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.status = "archived";
    await product.save();

    const shop = await Shop.findById(product.shop_id._id).populate("user_id");
    const user = shop?.user_id;

    if (user?.email) {
      await sendMail({
        to: user.email,
        subject: "Sản phẩm bị từ chối duyệt",
        html: `
          <p>Chào ${user.name || "bạn"},</p>
          <p>Sản phẩm <strong>${
            product.name
          }</strong> đã bị <b>từ chối duyệt</b>.</p>
          <p><b>Lý do:</b> ${reason || "(không rõ)"}</p>
          <p>Vui lòng kiểm tra và cập nhật lại sản phẩm nếu cần.</p>
          <p>— SouvenirHub</p>
        `,
      });
    }

    res.json({ message: "Product rejected", product });
  } catch (err) {
    console.error("Reject product error:", err);
    res.status(500).json({ error: "Failed to reject product" });
  }
};
