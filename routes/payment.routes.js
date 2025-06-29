// routes/payment.routes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const {
    mockPayValidator,
    processOnlinePaymentValidator,
    createMomoPaymentValidator
  } = require('../validators/payment.validator');
  const { validate } = require('../middlewares/validate.middleware');
/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment handling
 */

/**
 * @swagger
 * /api/payments/mock:
 *   post:
 *     summary: Simulate a COD payment
 *     tags: [Payments]
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
 *     responses:
 *       200:
 *         description: Payment simulated
 */
router.post('/mock', verifyToken, mockPayValidator, validate, paymentController.mockPay);



router.post('/payos/create', paymentController.createPayOSPayment);

router.post('/payos/webhook', paymentController.handlePayOSWebhook);


/**
 * @swagger
 * /api/payments/online:
 *   post:
 *     summary: Confirm payment from Momo or VNPAY
 *     tags: [Payments]
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
 *               method:
 *                 type: string
 *                 enum: [momo, vnpay]
 *               real_amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment recorded
 */
router.post('/online', verifyToken, processOnlinePaymentValidator, validate, paymentController.processOnlinePayment);

/**
 * @swagger
 * /api/payments/momo-create:
 *   post:
 *     summary: Tạo liên kết thanh toán Momo và trả về payUrl
 *     tags: [Payments]
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
 *     responses:
 *       200:
 *         description: URL thanh toán trả về từ Momo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payUrl:
 *                   type: string
 *                   example: https://test-payment.momo.vn/gw_payment/transactionProcessor?...
 */
router.post('/momo-create', verifyToken, createMomoPaymentValidator, validate, paymentController.createMomoPayment);

/**
 * @swagger
 * /api/payments/momo-return:
 *   get:
 *     summary: Redirect URL sau thanh toán từ Momo
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *       - in: query
 *         name: amount
 *         schema:
 *           type: number
 *       - in: query
 *         name: resultCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: message
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kết quả hiển thị cho người dùng sau thanh toán
 */
router.get('/momo-return', paymentController.handleMomoReturn);

/**
 * @swagger
 * /api/payments/momo-notify:
 *   post:
 *     summary: Momo gửi IPN về xác nhận thanh toán
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *               resultCode:
 *                 type: integer
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: IPN hợp lệ, đã xử lý
 *       400:
 *         description: IPN không hợp lệ
 */
router.post('/momo-notify', paymentController.handleMomoNotify);

module.exports = router;
