// routes/vnpay.routes.js
const express = require('express');
const router = express.Router();
const vnpayController = require('../controllers/vnpay.controller');

/**
 * @swagger
 * tags:
 *   name: VNPay
 *   description: Thanh toán qua VNPay
 */

/**
 * @swagger
 * /api/payments/vnpay-create:
 *   post:
 *     summary: Tạo liên kết thanh toán VNPay
 *     tags: [VNPay]
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
 *         description: Trả về liên kết VNPay để chuyển hướng người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payUrl:
 *                   type: string
 *                   example: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...
 */
router.post('/vnpay-create', vnpayController.createVnpayPayment);

/**
 * @swagger
 * /api/payments/vnpay-return:
 *   get:
 *     summary: Điểm trả về từ VNPay sau thanh toán
 *     tags: [VNPay]
 *     parameters:
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trả về thông báo kết quả thanh toán
 */
router.get('/vnpay-return', vnpayController.vnpayReturn);

/**
 * @swagger
 * /api/payments/vnpay-notify:
 *   post:
 *     summary: IPN từ VNPay (server xác nhận thanh toán)
 *     tags: [VNPay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               vnp_TxnRef:
 *                 type: string
 *               vnp_Amount:
 *                 type: string
 *               vnp_ResponseCode:
 *                 type: string
 *               vnp_SecureHash:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ghi nhận thanh toán thành công
 *       400:
 *         description: Sai chữ ký hoặc thanh toán thất bại
 *       500:
 *         description: Lỗi xử lý
 */
router.post('/vnpay-notify', vnpayController.vnpayNotify);

module.exports = router;
