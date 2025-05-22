// routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin order control
 */

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders in the system
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All orders
 */
router.get('/orders', verifyToken, requireRole(['admin']), adminController.getAllOrders);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   get:
 *     summary: Get detailed order by ID
 *     tags: [Admin]
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
 *         description: Detailed order info
 */
router.get('/orders/:id', verifyToken, requireRole(['admin']), adminController.getOrderDetails);

/**
 * @swagger
 * /api/admin/orders/status:
 *   put:
 *     summary: Admin updates order status
 *     tags: [Admin]
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
 *         description: Status updated
 */
router.put('/orders/status', verifyToken, requireRole(['admin']), adminController.adminUpdateStatus);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Admin dashboard overview
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin stats summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                   example: 100
 *                 totalOrders:
 *                   type: integer
 *                   example: 250
 *                 totalRevenue:
 *                   type: number
 *                   example: 10230.75
 *                 ordersByStatus:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "pending"
 *                       count:
 *                         type: integer
 *                         example: 85
 */
router.get('/stats', verifyToken, requireRole(['admin']), adminController.getAdminStats);


module.exports = router;