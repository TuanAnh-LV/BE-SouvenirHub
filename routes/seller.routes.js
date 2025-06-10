// routes/seller.routes.js
const express = require("express");
const router = express.Router();
const sellerController = require("../controllers/seller.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Seller
 *   description: Seller order management
 */

/**
 * @swagger
 * /api/seller/orders:
 *   post:
 *     summary: Get orders for seller's products
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Filter orders by product name (optional)
 *     responses:
 *       200:
 *         description: Orders related to seller
 */
router.post(
  "/orders",
  verifyToken,
  requireRole(["seller"]),
  sellerController.getShopOrders
);
// /**
//  * @swagger
//  * /api/seller/orders:
//  *   post:
//  *     summary: Get orders for seller's products, optionally filtered by product name
//  *     tags: [Seller]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: false
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               productName:
//  *                 type: string
//  *                 description: Name of the product to filter orders by
//  *                 example: "Áo thun tay lỡ"
//  *     responses:
//  *       200:
//  *         description: Orders related to seller
//  *       500:
//  *         description: Server error
//  */
// router.post(
//   "/orders",
//   verifyToken,
//   requireRole(["seller"]),
//   sellerController.getShopOrders
// );

/**
 * @swagger
 * /api/seller/orders/status:
 *   put:
 *     summary: Update status of an order
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_id:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, shipped, done, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.put(
  "/orders/status",
  verifyToken,
  requireRole(["seller"]),
  sellerController.updateOrderStatus
);

/**
 * @swagger
 * /api/seller/stats:
 *   get:
 *     summary: Seller dashboard metrics
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller summary statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalOrders:
 *                   type: integer
 *                   example: 24
 *                 totalRevenue:
 *                   type: number
 *                   example: 1570.5
 *                 totalSold:
 *                   type: integer
 *                   example: 102
 *                 topProducts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "Nón lá"
 *                       totalSold:
 *                         type: integer
 *                         example: 25
 */
router.get(
  "/stats",
  verifyToken,
  requireRole(["seller"]),
  sellerController.getSellerStats
);

module.exports = router;
