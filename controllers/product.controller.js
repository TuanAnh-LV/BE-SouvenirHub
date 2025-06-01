const Product = require('../models/product.model');
const Shop = require('../models/shop.model'); 
const ProductImage = require('../models/productImage.model');
const sanitizeHtml = require('sanitize-html');

exports.getAll = async (req, res) => {
  try {
    const products = await Product.find()
      .populate({ path: 'category_id', select: 'name' })
      .populate({ path: 'shop_id', select: 'name' });

    // Gộp ảnh
    const productIds = products.map(p => p._id);
    const images = await ProductImage.find({ product_id: { $in: productIds } });

    const productsWithImages = products.map(product => {
      const productImages = images
        .filter(img => img.product_id.toString() === product._id.toString())
        .map(img => img.url);
      return { ...product.toObject(), images: productImages };
    });

    res.json(productsWithImages);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'PRODUCT_FETCH_FAILED', message: 'Failed to fetch product' });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category_id: req.params.categoryId });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'PRODUCT_FETCH_FAILED', message: 'Failed to fetch products by category' });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const query = req.query.q || '';
    const products = await Product.find({ name: { $regex: query, $options: 'i' } });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'PRODUCT_FETCH_FAILED', message: 'Failed to search products' });
  }
};

exports.filterProducts = async (req, res) => {
  try {
    const { priceMin, priceMax, rating } = req.query;
    const filter = {};
    if (priceMin || priceMax) filter.price = {};
    if (priceMin) filter.price.$gte = Number(priceMin);
    if (priceMax) filter.price.$lte = Number(priceMax);
    if (rating) filter.rating = { $gte: Number(rating) };

    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'PRODUCT_FETCH_FAILED', message: 'Failed to filter products' });
  }
};


exports.getById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({ path: 'category_id', select: 'name' })
      .populate({ path: 'shop_id', select: 'name' });

    if (!product) return res.status(404).json({ error: 'Product not found' });

    const images = await ProductImage.find({ product_id: product._id });
    const imageUrls = images.map(img => img.url);

    res.json({ ...product.toObject(), images: imageUrls });
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    res.status(500).json({ error: 'PRODUCT_FETCH_FAILED', message: 'Failed to fetch product' });
  }
};


exports.create = async (req, res) => {
  try {
    const shop = await Shop.findOne({ user_id: req.user.id });
    if (!shop) return res.status(400).json({ message: 'You don\'t have a shop' });

    const cleanDescription = sanitizeHtml(req.body.description, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'u', 'iframe']),
      allowedAttributes: {
        '*': ['style', 'class', 'href', 'src', 'alt', 'title'],
        iframe: ['src', 'allowfullscreen', 'width', 'height'],
      }
    });

    const product = new Product({
      ...req.body,
      description: cleanDescription,
      shop_id: shop._id
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('Product create error:', err);
    res.status(400).json({ error: 'PRODUCT_CREATE_FAILED', message: 'Failed to create product' });
  }
};


exports.update = async (req, res) => {
  try {
    const cleanDescription = req.body.description
      ? sanitizeHtml(req.body.description, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'u', 'iframe']),
          allowedAttributes: {
            '*': ['style', 'class', 'href', 'src', 'alt', 'title'],
            iframe: ['src', 'allowfullscreen', 'width', 'height'],
          }
        })
      : undefined;

    const updateData = {
      ...req.body,
      ...(cleanDescription && { description: cleanDescription })
    };

    const updated = await Product.findOneAndUpdate(
      { _id: req.params.id, shop_id: req.user.id },
      updateData,
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Product not found or unauthorized' });

    res.json(updated);
  } catch (err) {
    console.error('Product update error:', err);
    res.status(400).json({ error: 'PRODUCT_UPDATE_FAILED', message: 'Failed to update product' });
  }
};


exports.remove = async (req, res) => {
  try {
    const removed = await Product.findOneAndDelete({ _id: req.params.id, shop_id: req.user.id });
    if (!removed) return res.status(404).json({ error: 'Product not found or unauthorized' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(400).json({ error: 'PRODUCT_DELETE_FAILED', message: 'Failed to delete product' });
  }
};