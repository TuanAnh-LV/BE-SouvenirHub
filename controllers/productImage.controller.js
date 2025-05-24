// controllers/productImage.controller.js
const ProductImage = require('../models/productImage.model');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const streamUpload = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'souvenirhub/products',
        resource_type: 'image'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

exports.uploadProductImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const files = req.files;
    const uploadedImages = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const result = await streamUpload(file.buffer);
        const savedImage = new ProductImage({ product_id: productId, url: result.secure_url });
        await savedImage.save();
        uploadedImages.push(savedImage);
      }
    }

    res.status(201).json(uploadedImages);
  } catch (err) {
    console.error('Upload image error:', err);
    res.status(500).json({ error: 'Failed to upload images' });
  }
};


exports.getImagesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const images = await ProductImage.find({ product_id: productId });
    res.status(200).json(images);
  } catch (err) {
    console.error('Get images error:', err);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
};

exports.deleteImageById = async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = await ProductImage.findById(imageId);
    if (!image) return res.status(404).json({ error: 'Image not found' });

    const publicIdMatch = image.url.match(/souvenirhub\/products\/([^.\/]+)(?:\.[a-z]+)?/i);
    if (publicIdMatch) {
      const publicId = `souvenirhub/products/${publicIdMatch[1]}`;
      await cloudinary.uploader.destroy(publicId);
    }

    await image.deleteOne();
    res.json({ message: 'Image deleted' });
  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

exports.deleteImagesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const images = await ProductImage.find({ product_id: productId });

    for (const image of images) {
      const publicIdMatch = image.url.match(/souvenirhub\/products\/([^.\/]+)(?:\.[a-z]+)?/i);
      if (publicIdMatch) {
        const publicId = `souvenirhub/products/${publicIdMatch[1]}`;
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await ProductImage.deleteMany({ product_id: productId });
    res.json({ message: 'All images deleted for this product' });
  } catch (err) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ error: 'Failed to delete product images' });
  }
};