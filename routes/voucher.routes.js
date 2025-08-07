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
router.post('/', verifyToken, requireRole(['admin', 'seller']), voucherController.createVoucher);

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
 *     summary: Cập nhật thông tin voucher
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của voucher cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: FREESHIP
 *               discount:
 *                 type: number
 *                 example: 25000
 *               type:
 *                 type: string
 *                 enum: [percent, amount, freeship]
 *                 example: freeship
 *               quantity:
 *                 type: number
 *                 example: 100
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-12-31T23:59:59.000Z
 *               description:
 *                 type: string
 *                 example: Miễn phí vận chuyển cho đơn từ 100.000₫
 *               min_order_value:
 *                 type: number
 *                 example: 100000
 *               max_discount:
 *                 type: number
 *                 example: 0
 *     responses:
 *       200:
 *         description: Voucher đã được cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voucher'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc cập nhật thất bại
 *       403:
 *         description: Không có quyền cập nhật voucher này
 *       404:
 *         description: Voucher không tồn tại
 */
router.put('/:id', verifyToken, requireRole(['admin', 'seller']), voucherController.updateVoucher);

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
router.delete('/:id', verifyToken, requireRole(['admin', 'seller']), voucherController.deleteVoucher);

module.exports = router;