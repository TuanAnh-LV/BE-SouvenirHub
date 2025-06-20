// controllers/shop.controller.js
const Shop = require("../models/shop.model");
const ShopApplication = require("../models/shopApplication.model");

exports.getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ user_id: req.user.id });
    if (!shop)
      return res.status(404).json({ error: "No shop found for this user" });
    res.json(shop);
  } catch (err) {
    console.error("Fetch shop error:", err);
    res.status(500).json({ error: "Failed to fetch shop" });
  }
};

exports.createShop = async (req, res) => {
  try {
    const { name, description } = req.body;
    const existingShop = await Shop.findOne({ user_id: req.user.id });
    if (existingShop) {
      return res
        .status(400)
        .json({ error: "You have already registered a shop" });
    }
    const shop = new Shop({
      user_id: req.user.id,
      name,
      description,
      status: "pending",
    });
    await shop.save();
    res
      .status(201)
      .json({ message: "Shop registered and pending approval", shop });
  } catch (err) {
    console.error("Create shop error:", err);
    res
      .status(400)
      .json({ error: "Failed to register shop", detail: err.message });
  }
};
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const streamUpload = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "souvenirhub/shops",
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

exports.updateShop = async (req, res) => {
  try {
    const { name, description } = req.body;
    const shop = await Shop.findOne({ user_id: req.user.id });
    if (!shop) return res.status(404).json({ error: "Shop not found" });

    if (name) shop.name = name;
    if (description) shop.description = description;
    if (req.file && req.file.buffer) {
      const result = await streamUpload(req.file.buffer);
      shop.logo_url = result.secure_url;
    }

    await shop.save();
    res.json({ message: "Shop updated successfully", shop });
  } catch (err) {
    console.error("Update shop error:", err);
    res.status(500).json({ error: "Failed to update shop" });
  }
};

exports.getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate("user_id", "name");
    if (!shop) return res.status(404).json({ error: "Shop not found" });

    // Get all products of this shop, populate fields
    const Product = require("../models/product.model");
    const ProductImage = require("../models/productImage.model");
    const products = await Product.find({ shop_id: shop._id })
      .populate({ path: "category_id", select: "name" })
      .populate({ path: "shop_id", select: "name" });

    // Get all images for these products
    const productIds = products.map((p) => p._id);
    const images = await ProductImage.find({ product_id: { $in: productIds } });

    // Attach images to products, like getAll
    const productsWithImages = products.map((product) => {
      const productImages = images
        .filter((img) => img.product_id.toString() === product._id.toString())
        .map((img) => img.url);
      return { ...product.toObject(), images: productImages };
    });

    res.json({ shop, products: productsWithImages });
  } catch (err) {
    console.error("Fetch shop by ID error:", err);
    res.status(500).json({ error: "Failed to fetch shop" });
  }
};
