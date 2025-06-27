const ProductVariant = require('../models/productVariant.model');

exports.createVariant = async (req, res) => {
    try {
      const data = Array.isArray(req.body) ? req.body : [req.body];
      const created = await ProductVariant.insertMany(data);
      res.status(201).json(created);
    } catch (err) {
      console.error("Create variant error:", err);
      res.status(400).json({ error: "Failed to create variant", detail: err.message });
    }
  };
  
exports.getVariantsByProduct = async (req, res) => {
  try {
    const variants = await ProductVariant.find({ product_id: req.params.productId });
    res.json(variants);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch variants' });
  }
};

exports.deleteVariant = async (req, res) => {
  try {
    await ProductVariant.findByIdAndDelete(req.params.variantId);
    res.json({ message: 'Variant deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete variant' });
  }
};
