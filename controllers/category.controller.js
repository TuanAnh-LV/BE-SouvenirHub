const Category = require('../models/category.model');

// Lấy toàn bộ danh mục, có gộp tên danh mục cha
exports.getAll = async (req, res) => {
  try {
    const categories = await Category.find().populate('parent_id', 'name');
    res.json(categories);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Tạo danh mục mới, có kiểm tra parent_id
exports.create = async (req, res) => {
  try {
    const data = { ...req.body };

    if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
      return res.status(400).json({ error: 'Invalid category name' });
    }

    // Nếu không có parent_id hoặc là rỗng thì xóa luôn
    if (data.parent_id === '' || data.parent_id === null) {
      delete data.parent_id;
    } else {
      // Kiểm tra parent_id có tồn tại không
      const parent = await Category.findById(data.parent_id);
      if (!parent) return res.status(400).json({ error: 'Parent category not found' });
    }

    const category = new Category(data);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    console.error('Create category error:', err);
    res.status(400).json({ error: 'Failed to create category', detail: err.message });
  }
};

// Cập nhật danh mục, kiểm tra parent_id
exports.update = async (req, res) => {
  try {
    const data = { ...req.body };

    if (data.parent_id === '' || data.parent_id === null) {
      delete data.parent_id;
    } else if (data.parent_id) {
      const parent = await Category.findById(data.parent_id);
      if (!parent) return res.status(400).json({ error: 'Parent category not found' });
    }

    const updated = await Category.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(400).json({ error: 'Failed to update category', detail: err.message });
  }
};

// Xoá danh mục: từ chối nếu còn danh mục con
exports.remove = async (req, res) => {
  try {
    const subCategories = await Category.find({ parent_id: req.params.id });

    if (subCategories.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category with subcategories' });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(400).json({ error: 'Failed to delete category', detail: err.message });
  }
};
