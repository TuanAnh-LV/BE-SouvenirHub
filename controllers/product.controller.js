const Product = require('../models/product.model');

exports.getAll = async (req, res) => {
  try {
    const products = await Product.find()
      .populate({ path: 'category_id', select: 'name' })
      .populate({ path: 'shop_id', select: 'name' });

    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.getById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({ path: 'category_id', select: 'name' })
      .populate({ path: 'shop_id', select: 'name' });

    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json(product);
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

exports.create = async (req, res) => {
  try {
    const shop = await Shop.findOne({ user_id: req.user.id });
    if (!shop) return res.status(400).json({ message: 'You don\'t have a shop' });

    const product = new Product({ ...req.body, shop_id: shop._id });
    await product.save();

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create product' });
  }
};

exports.update = async (req, res) => {
  try {
    const updated = await Product.findOneAndUpdate(
      { _id: req.params.id, shop_id: req.user.id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Product not found or unauthorized' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update product' });
  }
};

exports.remove = async (req, res) => {
  try {
    const removed = await Product.findOneAndDelete({ _id: req.params.id, shop_id: req.user.id });
    if (!removed) return res.status(404).json({ error: 'Product not found or unauthorized' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete product' });
  }
};