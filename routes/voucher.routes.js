const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Vouchers
 *   description: Quản lý mã giảm giá
 */

/**
 * @swagger
 * /api/vouchers:
 *   post:
 *     summary: Tạo voucher mới
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               discount:
 *                 type: number
 *               type:
 *                 type: string
 *                 example: percent
 *               quantity:
 *                 type: integer
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               min_order_value:
 *                 type: number
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', verifyToken, requireRole('admin'), voucherController.createVoucher);

/**
 * @swagger
 * /api/vouchers:
 *   get:
 *     summary: Lấy danh sách tất cả voucher
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách voucher
 */
router.get('/', verifyToken, voucherController.getAllVouchers);

/**
 * @swagger
 * /api/vouchers/{id}:
 *   get:
 *     summary: Lấy thông tin voucher theo ID
 *     tags: [Vouchers]
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
 *         description: Chi tiết voucher
 */
router.get('/:id', verifyToken, voucherController.getVoucherById);

/**
 * @swagger
 * /api/vouchers/{id}:
 *   put:
 *     summary: Cập nhật voucher
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               discount:
 *                 type: number
 *               
 *     responses:
 *       200:
 *         description: Đã cập nhật
 */
router.put('/:id', verifyToken, requireRole('admin'), voucherController.updateVoucher);

/**
 * @swagger
 * /api/vouchers/{id}:
 *   delete:
 *     summary: Xoá voucher
 *     tags: [Vouchers]
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
 *         description: Xoá thành công
 */
router.delete('/:id', verifyToken, requireRole('admin'), voucherController.deleteVoucher);

module.exports = router;