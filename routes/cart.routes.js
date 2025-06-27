const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const { verifyToken } = require('../middlewares/auth.middleware');
/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management
 */


/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get current user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's cart
 */
router.get("/",verifyToken, cartController.getCart);

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated cart
 */
router.post("/add",verifyToken, cartController.addToCart);

/**
 * @swagger
 * /api/cart/update:
 *   put:
 *     summary: Update item quantity in cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated cart
 */
router.put("/update",verifyToken, cartController.updateCartItem);

/**
 * @swagger
 * /api/cart/remove/{productId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: variantId
 *         required: false
 *         schema:
 *           type: string
 *         description: ID của mẫu mã (nếu có)
 *     responses:
 *       200:
 *         description: Updated cart
 */
router.delete("/remove/:productId",verifyToken, cartController.removeFromCart);

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Clear all items from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 */
router.delete("/clear",verifyToken, cartController.clearCart);

/**
 * @swagger
 * /api/cart/checkout:
 *   post:
 *     summary: Thanh toán các sản phẩm đã chọn từ giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shipping_address_id, selectedItems]
 *             properties:
 *               shipping_address_id:
 *                 type: string
 *               selectedItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId]
 *                   properties:
 *                     productId:
 *                       type: string
 *                     variantId:
 *                       type: string
 *                       nullable: true
 *                       description: ID mẫu mã (nếu có)
 *     responses:
 *       201:
 *         description: Đã tạo đơn hàng thành công
 */
router.post("/checkout",verifyToken, cartController.checkoutFromCart);
module.exports = router;