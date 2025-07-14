const express = require('express');
const router = express.Router();
const controller = require('../controllers/notification.controller');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Quản lý thông báo người dùng
 */

/**
 * @swagger
 * /api/notifications/{userId}:
 *   get:
 *     summary: Lấy danh sách thông báo của người dùng
 *     tags: [Notifications]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID người dùng
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách thông báo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                   is_read:
 *                     type: boolean
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */
router.get('/:userId', controller.getUserNotifications);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Tạo thông báo mới
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - message
 *             properties:
 *               user_id:
 *                 type: string
 *               message:
 *                 type: string
 *             example:
 *               user_id: "64a9c859d1234567890abcdef"
 *               message: "Đơn hàng #123 đã được xác nhận"
 *     responses:
 *       201:
 *         description: Thông báo đã được tạo
 */
router.post('/', controller.createNotification);

/**
 * @swagger
 * /api/notifications/read-all/{userId}:
 *   put:
 *     summary: Đánh dấu tất cả thông báo đã đọc
 *     tags: [Notifications]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID người dùng
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.put('/read-all/:userId', controller.markAllAsRead);
/**
 * @swagger
 * /api/notifications/user/{userId}:
 *   delete:
 *     summary: Xóa tất cả thông báo của user
 *     tags: [Notifications]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/user/:userId', controller.deleteAllByUser);

module.exports = router;
