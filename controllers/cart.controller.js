const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const Product = require("../models/product.model");
const ProductImage = require('../models/productImage.model'); 
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");

    if (!cart) return res.json({ items: [] });

    // Lấy danh sách productId trong giỏ hàng
    const productIds = cart.items.map(item => item.product?._id?.toString()).filter(Boolean);

    // Tìm ảnh tương ứng
    const images = await ProductImage.find({ product_id: { $in: productIds } });

    // Gắn ảnh vào từng product
    const itemsWithImages = cart.items.map(item => {
      const product = item.product.toObject(); // clone để chỉnh sửa
      const productImages = images
        .filter(img => img.product_id.toString() === product._id.toString())
        .map(img => img.url);

      return {
        ...item.toObject(),
        product: {
          ...product,
          image: productImages?.[0] || "/placeholder.jpg" // gắn ảnh đầu tiên vào
        }
      };
    });

    res.json({ ...cart.toObject(), items: itemsWithImages });
  } catch (err) {
    console.error("[getCart]", err);
    res.status(500).json({ message: "Failed to load cart" });
  }
};

exports.addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: user not found in token" });
    }
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [{ product: productId, quantity }] });
    } else {
      const index = cart.items.findIndex(item => item.product.toString() === productId);
      if (index >= 0) {
        cart.items[index].quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }
    }
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Failed to add to cart", error: err.message });
  }
};

exports.updateCartItem = async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    const item = cart.items.find(item => item.product.toString() === productId);
    if (item) item.quantity = quantity;
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Failed to update cart item" });
  }
};

exports.removeFromCart = async (req, res) => {
  const { productId } = req.params;
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { items: { product: productId } } },
      { new: true }
    );
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Failed to remove item from cart" });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [] },
      { new: true }
    );
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Failed to clear cart" });
  }
};
exports.checkoutFromCart = async (req, res) => {
    try {
      const { shipping_address_id } = req.body;
      const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
  
      let total_price = 0;
      const orderItems = [];
  
      for (const item of cart.items) {
        const product = item.product;
        if (!product || product.stock < item.quantity) {
          return res.status(400).json({ error: `Product ${product?._id} unavailable or out of stock` });
        }
        const itemTotal = parseFloat(product.price.toString()) * item.quantity;
        total_price += itemTotal;
  
        orderItems.push({
          product_id: product._id,
          quantity: item.quantity,
          price: product.price
        });
  
        await Product.findByIdAndUpdate(product._id, {
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
  
      await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
  
      res.status(201).json({ message: "Order created from cart", order_id: order._id });
    } catch (err) {
      console.error("[checkoutFromCart]", err);
      res.status(500).json({ error: "Failed to checkout from cart" });
    }
  };