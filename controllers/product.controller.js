const Product = require('../models/product.model');
const Shop = require('../models/shop.model'); 
const ProductImage = require('../models/productImage.model');
const sanitizeHtml = require('sanitize-html');

exports.getAll = async (req, res) => {
  try {
    const {
      name,
      minPrice,
      maxPrice,
      category,
      status,
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    let filter = {};

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    if (status) {
      filter.status = status;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const sortOptions = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const skip = (Number(page) - 1) * Number(limit);

    let products, total;

    if (category) {
      // Pipeline cho aggregate khi có category
      const basePipeline = [
        {
          $lookup: {
            from: 'categories',
            localField: 'category_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        {
          $match: {
            ...filter,
            'category.name': { $regex: category, $options: 'i' },
          },
        }
      ];

      const countPipeline = [...basePipeline, { $count: 'total' }];
      const countResult = await Product.aggregate(countPipeline);
      total = countResult[0]?.total || 0;

      products = await Product.aggregate([
        ...basePipeline,
        {
          $lookup: {
            from: 'shops',
            localField: 'shop_id',
            foreignField: '_id',
            as: 'shop',
          },
        },
        { $unwind: '$shop' },
        { $sort: sortOptions },
        { $skip: skip },
        { $limit: Number(limit) },
      ]);
    } else {
      total = await Product.countDocuments(filter);

      products = await Product.find(filter)
        .populate({ path: 'category_id', select: 'name' })
        .populate({ path: 'shop_id', select: 'name' })
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit));
    }

    const productIds = products.map((p) => p._id?.toString());
    const images = await ProductImage.find({ product_id: { $in: productIds } });

    const productsWithImages = products.map((product) => {
      const plain = typeof product.toObject === 'function' ? product.toObject() : product;
      const productId = plain._id?.toString();

      const productImages = images
        .filter((img) => img.product_id.toString() === productId)
        .map((img) => img.url);

      return {
        _id: plain._id,
        name: plain.name,
        description: plain.description,
        price: plain.price,
        stock: plain.stock,
        sold: plain.sold,
        status: plain.status,
        specifications: plain.specifications,
        specialNotes: plain.specialNotes,
        averageRating: plain.averageRating,
        reviewCount: plain.reviewCount,
        created_at: plain.created_at,

        category_id: plain.category || plain.category_id || null,
        shop_id: plain.shop || plain.shop_id || null,
        images: productImages,
      };
    });

    res.json({ items: productsWithImages, total });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'PRODUCT_FETCH_FAILED', message: err.message });
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
      shop_id: shop._id,
      sold: 0,
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
    // Tìm shop của user hiện tại
    const shop = await Shop.findOne({ user_id: req.user.id });
    if (!shop) return res.status(403).json({ error: 'Bạn không có quyền sửa sản phẩm này' });

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

    // Sửa lại điều kiện tìm kiếm
    const updated = await Product.findOneAndUpdate(
      { _id: req.params.id, shop_id: shop._id },
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