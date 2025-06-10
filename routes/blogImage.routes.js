const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  uploadBlogImages,
  getImagesByBlog,
  deleteImageById,
  deleteImagesByBlog,
} = require("../controllers/blogImage.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: BlogImages
 *   description: Quản lý ảnh blog
 */

/**
 * @swagger
 * /api/blog-images/{blogId}:
 *   post:
 *     summary: Upload images for a blog
 *     tags: [BlogImages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: blogId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 */
router.post(
  "/:blogId",
  verifyToken,
  upload.array("images", 5),
  uploadBlogImages
);

/**
 * @swagger
 * /api/blog-images/{blogId}:
 *   get:
 *     summary: Lấy tất cả ảnh của blog
 *     tags: [BlogImages]
 *     parameters:
 *       - in: path
 *         name: blogId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách ảnh
 */
router.get("/:blogId", getImagesByBlog);

/**
 * @swagger
 * /api/blog-images/image/{imageId}:
 *   delete:
 *     summary: Xóa ảnh blog theo ID
 *     tags: [BlogImages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/image/:imageId", verifyToken, deleteImageById);

/**
 * @swagger
 * /api/blog-images/blog/{blogId}:
 *   delete:
 *     summary: Xóa tất cả ảnh của blog
 *     tags: [BlogImages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: blogId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/blog/:blogId", verifyToken, deleteImagesByBlog);

module.exports = router;
