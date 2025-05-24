// controllers/category.controller.js
const Category = require('../models/category.model');

exports.getAll = async (req, res) => {
  try {
    const categories = await Category.find().populate('parent_id', 'name');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.parent_id === '' || data.parent_id === null) {
      delete data.parent_id; // tránh CastError khi parent_id rỗng
    }
    const category = new Category(data);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    console.error('Create category error:', err);
    res.status(400).json({ error: 'Failed to create category', detail: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.parent_id === '' || data.parent_id === null) {
      delete data.parent_id;
    }
    const updated = await Category.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update category' });
  }
};

exports.remove = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete category' });
  }
};
