const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const Product = require("../models/product.model");
const ProductImage = require('../models/productImage.model'); 
const ProductVariant = require("../models/productVariant.model");
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
    const cart = await Cart.findOne({ user: req.user.id }).populate([
      {
        path: "items.product",
        populate: { path: "shop_id", select: "name" },
      },
      {
        path: "items.variant"
      }
    ]);
    

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
          variant: item.variant || null
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
  const { productId, variantId, quantity } = req.body;

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: user not found in token" });
    }

    // Tìm giỏ hàng của user
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [{ product: productId, variant: variantId, quantity }],
      });
    } else {
      // Tìm item trùng productId + variantId
      const index = cart.items.findIndex(item =>
        item.product.toString() === productId &&
        ((item.variant && variantId && item.variant.toString() === variantId) || (!item.variant && !variantId))
      );

      if (index >= 0) {
        cart.items[index].quantity += quantity;
      } else {
        cart.items.push({ product: productId, variant: variantId, quantity });
      }
    }

    await cart.save();

    // Populate để trả về giỏ hàng đầy đủ
    const populatedCart = await Cart.findOne({ user: req.user.id }).populate([
      {
        path: "items.product",
        populate: { path: "shop_id", select: "name" },
      },
      {
        path: "items.variant",
      }
    ]);

    const enriched = await enrichCartAndGroup(populatedCart); // đã hỗ trợ variant ở bước trước
    res.json(enriched);

  } catch (err) {
    console.error("[addToCart]", err);
    res.status(500).json({ message: "Failed to add to cart", error: err.message });
  }
};



exports.updateCartItem = async (req, res) => {
  const { productId, variantId, quantity } = req.body;
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate([
      {
        path: "items.product",
        populate: { path: "shop_id", select: "name" },
      },
      {
        path: "items.variant"
      }
    ]);
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(
      item =>
        item.product._id.toString() === productId &&
        ((item.variant && variantId && item.variant._id.toString() === variantId) || (!item.variant && !variantId))
    );
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
const { variantId } = req.query;

  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(item =>
      !(item.product.toString() === productId &&
        ((item.variant && variantId && item.variant.toString() === variantId) || (!item.variant && !variantId)))
    );

    await cart.save();
    const populated = await cart.populate([
      {
        path: "items.product",
        populate: { path: "shop_id", select: "name" },
      },
      { path: "items.variant" }
    ]);

    const enriched = await enrichCartAndGroup(populated);
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
    const { shipping_address_id, selectedItems } = req.body;

    if (!selectedItems || !Array.isArray(selectedItems) || selectedItems.length === 0) {
      return res.status(400).json({ message: "No items selected" });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate([
      {
        path: "items.product",
        populate: { path: "shop_id", select: "name" },
      },
      { path: "items.variant" }
    ]);

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Lọc đúng item trong giỏ theo product + variant
    const selectedCartItems = cart.items.filter((item) =>
      selectedItems.some(
        (sel) =>
          sel.productId === item.product._id.toString() &&
          (sel.variantId || null) === (item.variant?._id?.toString() || null)
      )
    );

    if (selectedCartItems.length === 0) {
      return res.status(400).json({ message: "Selected items not found in cart" });
    }

    // Gom theo cửa hàng
    const itemsByShop = {};
    for (const item of selectedCartItems) {
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

        if (item.variant) {
          if (item.variant.stock < item.quantity) {
            return res.status(400).json({
              error: `Variant "${item.variant.name}" is out of stock`,
            });
          }

          total_price += item.quantity * parseFloat(item.variant.price.toString());
          orderItems.push({
            product_id: product._id,
            variant_id: item.variant._id,
            quantity: item.quantity,
            price: item.variant.price,
          });

          await ProductVariant.findByIdAndUpdate(item.variant._id, {
            $inc: { stock: -item.quantity },
          });
        } else {
          if (product.stock < item.quantity) {
            return res.status(400).json({
              error: `Product "${product.name}" is out of stock`,
            });
          }

          total_price += item.quantity * parseFloat(product.price.toString());
          orderItems.push({
            product_id: product._id,
            quantity: item.quantity,
            price: product.price,
          });

          await Product.findByIdAndUpdate(product._id, {
            $inc: { stock: -item.quantity },
          });
        }
      }

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

    // ❗ Cập nhật giỏ hàng: xoá các item đã chọn
    cart.items = cart.items.filter((item) => {
      return !selectedItems.some(
        (sel) =>
          sel.productId === item.product._id.toString() &&
          (sel.variantId || null) === (item.variant?._id?.toString() || null)
      );
    });

    await cart.save();

    res.status(201).json({
      message: "Orders created from selected items",
      order_id: createdOrders,
    });
  } catch (err) {
    console.error("[checkoutFromCart]", err);
    res.status(500).json({ error: "Failed to checkout from cart" });
  }
};

