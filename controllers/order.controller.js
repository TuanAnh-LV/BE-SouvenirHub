// controllers/order.controller.js
const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const Product = require("../models/product.model");
const { Decimal128 } = require("mongoose").Types;

exports.createOrder = async (req, res) => {
  try {
    const { items, shipping_address_id } = req.body;
    let total_price = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          error: `Product ${item.product_id} unavailable or out of stock`,
        });
      }

      const itemTotal = parseFloat(product.price.toString()) * item.quantity;
      total_price += itemTotal;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price,
      });

      // ✅ Trừ stock bằng $inc duy nhất
      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { stock: -item.quantity },
      });
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

    res
      .status(201)
      .json({ message: "Order placed successfully", order_id: order._id });
  } catch (err) {
    console.error("Order Error:", err);
    res.status(500).json({ error: "Failed to place order" });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const { name } = req.body;

    // 1. Tìm tất cả đơn hàng của user
    const orders = await Order.find({ user_id: req.user.id }).sort({
      created_at: -1,
    });

    const result = [];

    for (const order of orders) {
      // 2. Tìm tất cả item của order và populate product
      const items = await OrderItem.find({ order_id: order._id }).populate(
        "product_id"
      );

      // 3. Nếu có truyền name, thì lọc items theo tên sản phẩm
      const filteredItems = name
        ? items.filter((item) =>
            item.product_id?.name?.toLowerCase().includes(name.toLowerCase())
          )
        : items;

      // 4. Nếu có item sau khi lọc (hoặc không lọc), thêm vào kết quả
      if (filteredItems.length > 0) {
        result.push({
          ...order.toObject(),
          items: filteredItems,
        });
      }
    }

    res.json(result);
  } catch (err) {
    console.error("Error fetching orders with items:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user_id: req.user.id,
    });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const items = await OrderItem.find({ order_id: order._id }).populate(
      "product_id"
    );
    res.json({ order, items });
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
      const product = await Product.findById(item.product_id);
      if (product) {
        product.stock += item.quantity;
        product.sold = Math.max(0, (product.sold || 0) - item.quantity);
        await product.save();
      }
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

exports.updateQuantity = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.user_id.toString() !== req.user.id)
      return res.status(403).json({ error: "You do not have permission" });
    if (order.status !== "pending")
      return res
        .status(400)
        .json({ error: "Only pending orders can be updated" });

    const orderItem = await OrderItem.findOne({
      order_id: order._id,
      product_id,
    });
    if (!orderItem)
      return res.status(404).json({ error: "Order item not found" });

    if (quantity <= 0)
      return res.status(400).json({ error: "Quantity must be greater than 0" });

    const product = await Product.findById(product_id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const oldQuantity = orderItem.quantity;
    const delta = quantity - oldQuantity;

    // Kiểm tra tồn kho nếu tăng
    if (delta > 0 && product.stock < delta) {
      return res.status(400).json({
        error: `Not enough stock to increase quantity for product ${product_id}`,
      });
    }

    // Cập nhật số lượng item
    orderItem.quantity = quantity;
    await orderItem.save();

    // Cập nhật stock sản phẩm
    await Product.findByIdAndUpdate(product_id, {
      $inc: { stock: -delta },
    });

    //Tính lại tổng tiền của tất cả các order item
    const allItems = await OrderItem.find({ order_id: order._id }).populate(
      "product_id"
    );

    let newTotal = 0;
    for (const item of allItems) {
      const itemPrice = parseFloat(item.price.toString()); // item.price hoặc item.product_id.price
      newTotal += itemPrice * item.quantity;
    }

    // Cập nhật total_price
    order.total_price = Decimal128.fromString(newTotal.toString());
    await order.save();

    res.json({
      message: "Order item quantity updated successfully",
      orderItem,
      total_price: newTotal,
    });
  } catch (err) {
    console.error("Update quantity error:", err);
    res.status(500).json({ error: "Failed to update order item quantity" });
  }
};
