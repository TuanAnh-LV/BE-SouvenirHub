const mongoose = require("mongoose");
const User = require('./user.model');

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
    required: false, // Có thể không có nếu sản phẩm không có mẫu mã
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  }
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  items: [CartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Cart", CartSchema);
