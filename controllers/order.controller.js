// controllers/order.controller.js
const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const Product = require("../models/product.model");
const Shop = require("../models/shop.model");
const shopApplicationModel = require("../models/shopApplication.model");
const Voucher = require("../models/voucher.model");
const { enrichOrderItems } = require("../utils/enrichOrder");
const ProductVariant = require("../models/productVariant.model");
exports.createOrder = async (req, res) => {
  try {
    const { items, shipping_address_id, voucher_id } = req.body;
    let total_price = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(400).json({
          error: `Product ${item.product_id} not found`,
        });
      }

      let price, stock;

      if (item.variant_id) {
        const variant = await ProductVariant.findById(item.variant_id);
        if (!variant) {
          return res.status(400).json({
            error: `Variant ${item.variant_id} not found`,
          });
        }

        price = parseFloat(variant.price.toString());
        stock = variant.stock;

        if (stock < item.quantity) {
          return res.status(400).json({
            error: `Variant "${variant.name}" is out of stock`,
          });
        }

        orderItems.push({
          product_id: product._id,
          variant_id: variant._id,
          quantity: item.quantity,
          price: variant.price,
        });

        await ProductVariant.findByIdAndUpdate(variant._id, {
          $inc: { stock: -item.quantity },
        });
      } else {
        price = parseFloat(product.price.toString());
        stock = product.stock;

        if (stock < item.quantity) {
          return res.status(400).json({
            error: `Product "${product.name}" is out of stock`,
          });
        }

        orderItems.push({
          product_id: product._id,
          quantity: item.quantity,
          price: product.price,
        });

        await Product.findByIdAndUpdate(product._id, {
          $inc: { stock: -item.quantity },
        });
      }

      total_price += price * item.quantity;
    }

    // Áp dụng voucher nếu có
    let voucher = null;
    let discountAmount = 0;
    if (voucher_id) {
      voucher = await Voucher.findOne({
        _id: voucher_id,
        quantity: { $gt: 0 },
        expires_at: { $gt: new Date() },
      });
      if (!voucher) {
        return res.status(400).json({ error: "Voucher không hợp lệ hoặc đã hết hạn/số lượng" });
      }

      if (voucher.min_order_value && total_price < voucher.min_order_value) {
        return res.status(400).json({
          error: `Đơn hàng phải từ ${voucher.min_order_value}đ mới được áp dụng voucher này`,
        });
      }

      if (voucher.type === "percent") {
        discountAmount = total_price * (voucher.discount / 100);
        if (voucher.max_discount && discountAmount > voucher.max_discount) {
          discountAmount = voucher.max_discount;
        }
      } else {
        discountAmount = voucher.discount;
      }

      discountAmount = Math.min(discountAmount, total_price);
      total_price -= discountAmount;

      voucher.quantity -= 1;
      await voucher.save();
    }

    const order = new Order({
      user_id: req.user.id,
      shipping_address_id,
      total_price,
      status: "pending",
    });
    await order.save();

    for (const item of orderItems) {
      await new OrderItem({ ...item, order_id: order._id }).save();
    }

    res.status(201).json({
      message: "Order placed successfully",
      order_id: order._id,
      discount: discountAmount,
      voucher: voucher ? voucher._id : null,
    });
  } catch (err) {
    console.error("Order Error:", err);
    res.status(500).json({ error: "Failed to place order" });
  }
};


exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user.id }).sort({
      created_at: -1,
    });
    const result = [];

    for (const order of orders) {
      const rawItems = await OrderItem.find({ order_id: order._id }).populate(
        "product_id"
      ).populate("variant_id") ;
      const items = await enrichOrderItems(rawItems);
      result.push({ ...order.toObject(), items });
    }

    res.json(result);
  } catch (err) {
    console.error("Error fetching orders with items:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    console.log("==> Đã vào getOrderById");
    const order = await Order.findOne({
      _id: req.params.id,
    }).populate("user_id", "name email");
    
    if (!order) return res.status(404).json({ error: "Order not found" });

    const rawItems = await OrderItem.find({ order_id: order._id })
  .populate({
    path: "product_id",
    populate: {
      path: "shop_id",
      select: "name", // 👈 lấy tên shop
    },
  })
  .populate("variant_id");

    const items = await enrichOrderItems(rawItems);

    res.json({ ...order.toObject(), items });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

// Hủy đơn hàng (chỉ khi còn trạng thái "pending")
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user_id: req.user.id,
    });

    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Only pending orders can be cancelled" });
    }

    order.status = "cancelled";
    await order.save();

    // Hoàn lại stock và giảm sold
    const orderItems = await OrderItem.find({ order_id: order._id });

    for (const item of orderItems) {
      if (item.variant_id) {
        // hoàn lại stock cho mẫu mã
        await ProductVariant.findByIdAndUpdate(item.variant_id, {
          $inc: { stock: item.quantity }
        });
      } else {
        // hoàn lại stock cho sản phẩm gốc
        await Product.findByIdAndUpdate(item.product_id, {
          $inc: { stock: item.quantity }
        });
      }

      // Giảm sold (nếu cần)
      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { sold: -item.quantity }
      });
    }

    res.json({ message: "Order cancelled" });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({ error: "Failed to cancel order" });
  }
};

// Cập nhật trạng thái đơn hàng (dành cho admin hoặc xử lý đơn hàng)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = [
      "pending",
      "processing",
      "shipped",
      "completed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;
    await order.save();

    // 👉 Chỉ tăng sold khi đơn hoàn thành
    if (status === "completed") {
      const orderItems = await OrderItem.find({ order_id: order._id });
      for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product_id, {
          $inc: { sold: item.quantity },
        });
      }
    }

    res.json({ message: "Order status updated", order });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

exports.getAllOrdersOfMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ user_id: req.user.id });

    // 2. Tìm tất cả sản phẩm thuộc shop này
    const shopProducts = await Product.find({ shop_id: shop._id }, "_id");
    const shopProductIds = shopProducts.map((p) => p._id);

    if (shopProductIds.length === 0) {
      return res.json([]); // Shop chưa có sản phẩm nào
    }

    // 3. Tìm order items chứa các sản phẩm của shop
    const orderItems = await OrderItem.find({
      product_id: { $in: shopProductIds },
    });

    // 4. Lấy danh sách order_id từ orderItems
    const orderIds = [
      ...new Set(orderItems.map((item) => item.order_id.toString())),
    ];

    if (orderIds.length === 0) {
      return res.json([]); // Chưa có đơn hàng nào chứa sản phẩm của shop
    }

    // 5. Tìm đơn hàng từ danh sách orderIds
    const orders = await Order.find({ _id: { $in: orderIds } })
  .populate("user_id", "name email")
  .sort({ created_at: -1 });


    // 6. Gắn các item thuộc shop vào từng order
    const result = [];

    for (const order of orders) {
      // Lấy item thuộc order và thuộc shop
      const rawItems = await OrderItem.find({
        order_id: order._id,
        product_id: { $in: shopProductIds },
      }).populate("product_id");

      const items = await enrichOrderItems(rawItems); // hoặc dùng rawItems nếu không enrich

      result.push({
        ...order.toObject(),
        items,
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Error fetching shop orders:", err);
    res.status(500).json({ error: "Failed to fetch shop orders" });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { shipping_address_id, voucher_id } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user_id: req.user.id });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be updated' });
    }

    // Cập nhật địa chỉ nếu có
    if (shipping_address_id) order.shipping_address_id = shipping_address_id;

    // Lấy tất cả item của đơn hàng
    const orderItems = await OrderItem.find({ order_id: order._id });

    let total_price = 0;

    for (const item of orderItems) {
      let unitPrice = 0;

      if (item.variant_id) {
        const variant = await ProductVariant.findById(item.variant_id);
        if (!variant) return res.status(400).json({ error: 'Variant not found' });
        unitPrice = parseFloat(variant.price.toString());
      } else {
        const product = await Product.findById(item.product_id);
        if (!product) return res.status(400).json({ error: 'Product not found' });
        unitPrice = parseFloat(product.price.toString());
      }

      total_price += unitPrice * item.quantity;
    }

    // Xử lý voucher (nếu có)
    let discountAmount = 0;
    let voucher = null;

    if (voucher_id) {
      voucher = await Voucher.findOne({
        _id: voucher_id,
        quantity: { $gt: 0 },
        expires_at: { $gt: new Date() }
      });

      if (!voucher) {
        return res.status(400).json({ error: 'Voucher không hợp lệ hoặc đã hết hạn/số lượng' });
      }

      if (voucher.min_order_value && total_price < voucher.min_order_value) {
        return res.status(400).json({
          error: `Đơn hàng phải từ ${voucher.min_order_value}đ mới được áp dụng voucher này`,
        });
      }

      if (voucher.type === 'percent') {
        discountAmount = total_price * (voucher.discount / 100);
        if (voucher.max_discount && discountAmount > voucher.max_discount) {
          discountAmount = voucher.max_discount;
        }
      } else {
        discountAmount = voucher.discount;
      }

      discountAmount = Math.min(discountAmount, total_price);
      total_price -= discountAmount;

      // Nếu đổi voucher → hoàn voucher cũ
      if (order.voucher && order.voucher.toString() !== voucher_id) {
        const oldVoucher = await Voucher.findById(order.voucher);
        if (oldVoucher) {
          oldVoucher.quantity += 1;
          await oldVoucher.save();
        }
      }

      // Trừ số lượng voucher mới
      voucher.quantity -= 1;
      await voucher.save();

      order.voucher = voucher._id;
    } else if (order.voucher) {
      // Nếu huỷ voucher → hoàn lại số lượng
      const oldVoucher = await Voucher.findById(order.voucher);
      if (oldVoucher) {
        oldVoucher.quantity += 1;
        await oldVoucher.save();
      }
      order.voucher = null;
    }

    order.total_price = total_price;
    await order.save();

    res.json({ message: 'Order updated', order });
  } catch (err) {
    console.error("Update order error:", err);
    res.status(500).json({ error: "Thanh toán thất bại", detail: err.message });
  }
};
exports.confirmReceivedByUser = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user_id: req.user.id
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'processing') {
      return res.status(400).json({ error: 'Only processing orders can be confirmed as received' });
    }

    order.status = 'completed';
    await order.save();

    res.json({ message: 'Order marked as shipped (received by customer)', order });
  } catch (err) {
    console.error('Error confirming received order:', err);
    res.status(500).json({ error: 'Failed to confirm received order' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    console.log("Bắt đầu lấy orders");
    const orders = await Order.find()
      .populate("user_id", "name email")
      .sort({ created_at: -1 });
    console.log("Tìm thấy orders:", orders.length);

    const result = [];
    for (const order of orders) {
      console.log("Đang xử lý order:", order._id);
      const rawItems = await OrderItem.find({ order_id: order._id })
        .populate({
          path: "product_id",
          populate: { path: "shop_id", select: "name" }
        })
        .populate("variant_id");
      console.log("OrderItems:", rawItems.length);

      // Nếu nghi ngờ enrichOrderItems lỗi, thử comment dòng dưới
      const items = await enrichOrderItems(rawItems);
      // const items = rawItems; // Dùng rawItems để debug

      console.log("Enriched items:", items.length);

      result.push({ ...order.toObject(), items });
    }

    res.json(result);
  } catch (err) {
    console.error("Error fetching all orders:", err); // Log chi tiết lỗi
    res.status(500).json({ error: "Failed to fetch all orders", detail: err.message });
  }
};