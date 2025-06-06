const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  uploadBlogImages,
  getImagesByBlog,
  deleteImageById,
  deleteImagesByBlog,
} = require("../controllers/blogImage.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: BlogImages
 *   description: Upload blog images
 */

/**
 * @swagger
 * /api/blog-images/{blogId}:
 *   post:
 *     summary: Upload images for a blog
 *     tags: [BlogImages]
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
 *                 description: Upload image files (multiple)
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 *       500:
 *         description: Upload failed
 */
router.post(
  "/:blogId",
  verifyToken,
  upload.array("images", 5),
  uploadBlogImages
);

// /**
//  * @swagger
//  * /api/blog-images/{blogId}:
//  *   get:
//  *     summary: Get all images for a blog
//  *     tags: [BlogImages]
//  *     parameters:
//  *       - in: path
//  *         name: blogId
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: List of image URLs
//  */
// router.get("/:blogId", getImagesByBlog);

// /**
//  * @swagger
//  * /api/blog-images/image/{imageId}:
//  *   delete:
//  *     summary: Delete a specific image by ID
//  *     tags: [BlogImages]
//  *     parameters:
//  *       - in: path
//  *         name: imageId
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Image deleted
//  *       404:
//  *         description: Image not found
//  */
// router.delete("/image/:imageId", deleteImageById);

// /**
//  * @swagger
//  * /api/blog-images/blog/{blogId}:
//  *   delete:
//  *     summary: Delete all images of a blog
//  *     tags: [BlogImages]
//  *     parameters:
//  *       - in: path
//  *         name: blogId
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: All images deleted
//  */
// router.delete("/blog/:blogId", deleteImagesByBlog);

module.exports = router;
