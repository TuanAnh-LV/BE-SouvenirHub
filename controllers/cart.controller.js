const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const Product = require("../models/product.model");
const ProductImage = require('../models/productImage.model'); 
function calculateCartSummary(items) {
  let total_price = 0;
  let total_quantity = 0;

  for (const item of items) {
    const price = parseFloat(item.product?.price?.toString() || 0);
    const quantity = item.quantity || 0;
    total_price += price * quantity;
    total_quantity += quantity;
  }

  return { total_price, total_quantity };
}
async function enrichCartAndGroup(cart) {
  const productIds = cart.items
    .map((item) => item.product?._id?.toString())
    .filter(Boolean);

  const images = await ProductImage.find({
    product_id: { $in: productIds },
  });

  const itemsWithImages = cart.items.map((item) => {
    const product = item.product.toObject?.() || item.product; // fallback
    const productImages = images
      .filter((img) => img.product_id.toString() === product._id.toString())
      .map((img) => img.url);

    return {
      ...item.toObject?.() || item,
      product: {
        ...product,
        image: productImages?.[0] || "/placeholder.jpg",
      },
    };
  });

  const groupedMap = {};

  for (const item of itemsWithImages) {
    const shop = item.product?.shop_id;
    if (!shop || !shop._id) continue;

    const shopId = shop._id.toString();
    if (!groupedMap[shopId]) {
      groupedMap[shopId] = {
        shop_id: shopId,
        shop_name: shop.name,
        items: [],
      };
    }

    groupedMap[shopId].items.push(item);
  }

  const groupedItems = Object.values(groupedMap);
  const { total_price, total_quantity } = calculateCartSummary(itemsWithImages);

  return { groupedItems, total_price, total_quantity };
}


exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate({
      path: "items.product",
      populate: { path: "shop_id", select: "name" },
    });

    if (!cart) {
      return res.json({
        groupedItems: [],
        total_price: 0,
        total_quantity: 0,
      });
    }

    const productIds = cart.items
      .map((item) => item.product?._id?.toString())
      .filter(Boolean);

    const images = await ProductImage.find({
      product_id: { $in: productIds },
    });

    const itemsWithImages = cart.items.map((item) => {
      const product = item.product.toObject();
      const productImages = images
        .filter((img) => img.product_id.toString() === product._id.toString())
        .map((img) => img.url);

      return {
        ...item.toObject(),
        product: {
          ...product,
          image: productImages?.[0] || "/placeholder.jpg",
        },
      };
    });

    // Gom nhóm sản phẩm theo shop_id
    const groupedMap = {};

    for (const item of itemsWithImages) {
      const shop = item.product?.shop_id;
      if (!shop || !shop._id) continue;

      const shopId = shop._id.toString();
      if (!groupedMap[shopId]) {
        groupedMap[shopId] = {
          shop_id: shopId,
          shop_name: shop.name,
          items: [],
        };
      }

      groupedMap[shopId].items.push(item);
    }

    const groupedItems = Object.values(groupedMap);
    const { total_price, total_quantity } = calculateCartSummary(itemsWithImages);

    res.json({ groupedItems, total_price, total_quantity });
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

    const populatedCart = await Cart.findOne({ user: req.user.id }).populate({
      path: "items.product",
      populate: { path: "shop_id", select: "name" },
    });
    
    const enriched = await enrichCartAndGroup(populatedCart);
    res.json(enriched);
    
    const { total_price, total_quantity } = calculateCartSummary(populatedCart.items);
    res.json({ ...populatedCart.toObject(), total_price, total_quantity });
  } catch (err) {
    res.status(500).json({ message: "Failed to add to cart", error: err.message });
  }
};


exports.updateCartItem = async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate({
      path: "items.product",
      populate: { path: "shop_id", select: "name" },
    });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(item => item.product._id.toString() === productId);
    if (item) item.quantity = quantity;

    await cart.save();
    const enriched = await enrichCartAndGroup(cart);
    res.json(enriched);
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
    ).populate({
      path: "items.product",
      populate: { path: "shop_id", select: "name" },
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const enriched = await enrichCartAndGroup(cart);
    res.json(enriched);
  } catch (err) {
    console.error("[removeFromCart]", err);
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

    const emptyGrouped = { groupedItems: [], total_price: 0, total_quantity: 0 };
    res.json({ ...cart.toObject(), ...emptyGrouped });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear cart" });
  }
};



exports.checkoutFromCart = async (req, res) => {
  try {
    const { shipping_address_id, selectedProductIds } = req.body;
    const cart = await Cart.findOne({ user: req.user.id }).populate({
      path: "items.product",
      populate: { path: "shop_id", select: "name" },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Lọc các item được chọn
    const selectedItems = cart.items.filter((item) =>
      selectedProductIds.includes(item.product._id.toString())
    );

    if (selectedItems.length === 0) {
      return res.status(400).json({ message: "No selected items to checkout" });
    }

    // Group items theo shop_id
    const itemsByShop = {};
    for (const item of selectedItems) {
      const shopId = item.product.shop_id._id.toString();
      if (!itemsByShop[shopId]) itemsByShop[shopId] = [];
      itemsByShop[shopId].push(item);
    }

    const createdOrders = [];

    for (const [shopId, items] of Object.entries(itemsByShop)) {
      let total_price = 0;
      const orderItems = [];

      for (const item of items) {
        const product = item.product;
        if (!product || product.stock < item.quantity) {
          return res.status(400).json({
            error: `Product ${product?.name || product?._id} is unavailable or out of stock`,
          });
        }

        const itemTotal = parseFloat(product.price.toString()) * item.quantity;
        total_price += itemTotal;

        orderItems.push({
          product_id: product._id,
          quantity: item.quantity,
          price: product.price,
        });

        // Trừ stock
        await Product.findByIdAndUpdate(product._id, {
          $inc: { stock: -item.quantity },
        });
      }

      // Tạo order cho shop này
      const order = new Order({
        user_id: req.user.id,
        shop_id: shopId,
        shipping_address_id,
        total_price,
        status: "pending",
      });
      await order.save();

      for (const item of orderItems) {
        await new OrderItem({ ...item, order_id: order._id }).save();
      }

      createdOrders.push(order._id);
    }

    // Cập nhật giỏ hàng, giữ lại các item chưa được chọn
    const remainingItems = cart.items.filter(
      (item) => !selectedProductIds.includes(item.product._id.toString())
    );
    cart.items = remainingItems;
    await cart.save();

    res.status(201).json({ message: "Orders created from selected items", order_ids: createdOrders });
  } catch (err) {
    console.error("[checkoutFromCart]", err);
    res.status(500).json({ error: "Failed to checkout from cart" });
  }
};

