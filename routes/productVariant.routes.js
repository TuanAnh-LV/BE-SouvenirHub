const express = require('express');
const router = express.Router();
const controller = require('../controllers/productVariant.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductVariant:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         product_id:
 *           type: string
 *         name:
 *           type: string
 *         attributes:
 *           type: object
 *           example:
 *             color: "Đỏ"
 *             size: "L"
 *         price:
 *           type: number
 *         stock:
 *           type: integer
 *         images:
 *           type: array
 *           items:
 *             type: string
 */


/**
 * @swagger
 * /api/product-variants:
 *   post:
 *     summary: Tạo mẫu mã sản phẩm mới
 *     tags: [ProductVariants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - name
 *               - price
 *             properties:
 *               product_id:
 *                 type: string
 *               name:
 *                 type: string
 *                 example: "Màu đỏ - Size L"
 *               attributes:
 *                 type: object
 *                 example:
 *                   color: "Đỏ"
 *                   size: "L"
 *               price:
 *                 type: number
 *                 example: 99000
 *               stock:
 *                 type: integer
 *                 example: 10
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "https://res.cloudinary.com/demo/image.jpg"
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/',verifyToken, requireRole(['seller']), controller.createVariant);

/**
 * @swagger
 * /api/product-variants/{productId}:
 *   get:
 *     summary: Lấy danh sách mẫu mã của một sản phẩm
 *     tags: [ProductVariants]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Danh sách mẫu mã sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductVariant'
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/:productId',verifyToken, requireRole(['seller']), controller.getVariantsByProduct);

/**
 * @swagger
 * /api/product-variants/{variantId}:
 *   delete:
 *     summary: Xoá một mẫu mã sản phẩm
 *     tags: [ProductVariants]
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của mẫu mã
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       400:
 *         description: Không thể xoá
 */
router.delete('/:variantId', verifyToken, requireRole(['seller']),controller.deleteVariant);

module.exports = router;
