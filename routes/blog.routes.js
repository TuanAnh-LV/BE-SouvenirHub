const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blog.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * /api/blogs/my:
 *   get:
 *     summary: Lấy tất cả blog của người đang đăng nhập (kèm ảnh)
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách blog
 */
router.get("/my", verifyToken, blogController.getMyBlogs);


/**
 * @swagger
 * tags:
 *   name: Blogs
 *   description: Quản lý blog
 */

/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Lấy tất cả blog (kèm ảnh)
 *     tags: [Blogs]
 *     responses:
 *       200:
 *         description: Danh sách blog
 */
router.get("/", blogController.getAllBlogs);

/**
 * @swagger
 * /api/blogs/{id}:
 *   get:
 *     summary: Lấy chi tiết blog (kèm ảnh)
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết blog
 */
router.get("/:id", blogController.getBlogById);

/**
 * @swagger
 * /api/blogs:
 *   post:
 *     summary: Tạo blog mới
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post("/", verifyToken, blogController.createBlog);

/**
 * @swagger
 * /api/blogs/{id}:
 *   put:
 *     summary: Cập nhật blog
 *     tags: [Blogs]
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
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/:id", verifyToken, blogController.updateBlog);

/**
 * @swagger
 * /api/blogs/{id}:
 *   delete:
 *     summary: Xóa blog
 *     tags: [Blogs]
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
 *         description: Xóa thành công
 */
router.delete("/:id", verifyToken, blogController.deleteBlog);




module.exports = router;
