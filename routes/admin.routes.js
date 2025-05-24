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

/**
 * @swagger
 * /api/admin/pending:
 *   get:
 *     summary: Admin get all pending shops
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending shops
 */
router.get('/pending', verifyToken, requireRole(['admin']), adminController.getAllPendingShops);


router.get('/shops', verifyToken, requireRole(['admin']), adminController.getAllShops);
/**
 * @swagger
 * /api/admin/shops:
 *   get:
 *     summary: Get all shops
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shops
 */

router.get('/shops/:id', verifyToken, requireRole(['admin']), adminController.getShopById);
/**
 * @swagger
 * /api/admin/shops/{id}:
 *   get:
 *     summary: Get shop by ID
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
 *         description: Shop detail
 *       404:
 *         description: Shop not found
 */

router.put('/shops/:shopId/status', verifyToken, requireRole(['admin']), adminController.updateShopStatus);
/**
 * @swagger
 * /api/admin/shops/{shopId}/status:
 *   put:
 *     summary: Update status of a shop (approve/reject)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *               reason:
 *                 type: string
 *                 example: Hồ sơ không hợp lệ
 *     responses:
 *       200:
 *         description: Shop status updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Shop not found
 */


router.put('/shops/:id', verifyToken, requireRole(['admin']), adminController.updateShop);
/**
 * @swagger
 * /api/admin/shops/{id}:
 *   put:
 *     summary: Update shop information
 *     tags: [Admin]
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
 *               logo_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shop updated
 *       404:
 *         description: Shop not found
 */

router.delete('/shops/:id', verifyToken, requireRole(['admin']), adminController.deleteShop);
/**
 * @swagger
 * /api/admin/shops/{id}:
 *   delete:
 *     summary: Delete a shop
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
 *         description: Shop deleted
 *       404:
 *         description: Shop not found
 */





module.exports = router;