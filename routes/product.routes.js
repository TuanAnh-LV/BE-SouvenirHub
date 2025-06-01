const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

const { createProductValidator } = require('../validators/product.validator');
const { validate } = require('../middlewares/validate.middleware');


/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', productController.getAll);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/:id', productController.getById);

/**
 * @swagger
 * /api/products/category/{categoryId}:
 *   get:
 *     summary: Get products by category
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Products by category
 */
router.get('/category/:categoryId', productController.getProductsByCategory);

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Search products by name
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Keyword to search
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', productController.searchProducts);


/**
 * @swagger
 * /api/products/filter:
 *   get:
 *     summary: Filter products by price and rating
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: priceMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: priceMax
 *         schema:
 *           type: number
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Filtered products
 */
router.get('/filter', productController.filterProducts);


/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category_id
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               specifications:
 *                 type: string
 *               specialNotes:
 *                 type: string
 *               category_id:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/', verifyToken, requireRole(['seller']), createProductValidator, validate, productController.create);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               specifications:
 *                 type: string
 *               specialNotes:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product updated
 */
router.put('/:id', verifyToken, requireRole(['seller']), productController.update);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 */
router.delete('/:id', verifyToken, requireRole(['seller']), productController.remove);

module.exports = router;
