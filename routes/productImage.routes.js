// routes/productImage.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  uploadProductImages,
  getImagesByProduct,
  deleteImageById,
  deleteImagesByProduct
} = require('../controllers/productImage.controller');
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: ProductImages
 *   description: Upload product images
 */

/**
 * @swagger
 * /api/product-images/{productId}:
 *   post:
 *     summary: Upload images for a product
 *     tags: [ProductImages]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload image files (multiple)
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 *       500:
 *         description: Upload failed
 */


router.post('/:productId', upload.array('images', 5), uploadProductImages);

/**
 * @swagger
 * /api/product-images/{productId}:
 *   get:
 *     summary: Get all images for a product
 *     tags: [ProductImages]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of image URLs
 */
router.get('/:productId', getImagesByProduct);

/**
 * @swagger
 * /api/product-images/image/{imageId}:
 *   delete:
 *     summary: Delete a specific image by ID
 *     tags: [ProductImages]
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted
 *       404:
 *         description: Image not found
 */
router.delete('/image/:imageId', deleteImageById);

/**
 * @swagger
 * /api/product-images/product/{productId}:
 *   delete:
 *     summary: Delete all images of a product
 *     tags: [ProductImages]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All images deleted
 */
router.delete('/product/:productId', deleteImagesByProduct);

module.exports = router;
