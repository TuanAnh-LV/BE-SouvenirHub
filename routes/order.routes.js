const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");
const {
  createOrderValidator,
  updateOrderStatusValidator,
} = require("../validators/order.validator");
const { validate } = require("../middlewares/validate.middleware");
/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Place a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shipping_address_id:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Order placed
 */
router.post(
  "/",
  verifyToken,
  createOrderValidator,
  validate,
  orderController.createOrder
);

router.get("/myorders", verifyToken, orderController.getAllOrdersOfMyShop);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get current user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get("/", verifyToken, orderController.getMyOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
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
 *         description: Order details
 */
router.get("/:id", verifyToken, orderController.getOrderById);

router.put("/:id/cancel", verifyToken, orderController.cancelOrder);
/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: Cancel an order (buyer only if order is still pending)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order to cancel
 *     responses:
 *       200:
 *         description: Order cancelled
 *       400:
 *         description: Cannot cancel non-pending order
 *       404:
 *         description: Order not found
 */

router.patch(
  "/:id/status",
  verifyToken,
  requireRole(["admin", "seller"]),
  updateOrderStatusValidator,
  validate,
  orderController.updateOrderStatus
);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status (admin or seller only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order
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
 *                 enum: [pending, processing, shipped, completed, cancelled]
 *                 example: shipped
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update order (address, voucher, total_price) if order is still pending
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shipping_address_id:
 *                 type: string
 *                 description: New shipping address ID
 *               voucher_id:
 *                 type: string
 *                 description: New voucher ID (optional)
 *               total_price:
 *                 type: number
 *                 description: Total price after voucher (optional, will be validated)
 *     responses:
 *       200:
 *         description: Order updated
 *       400:
 *         description: Cannot update non-pending order or invalid voucher or total_price
 *       404:
 *         description: Order not found
 */
router.put('/:id', verifyToken, orderController.updateOrder);

module.exports = router;
