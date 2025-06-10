const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blog.controller");
const upload = require("../middlewares/upload.middleware");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

// Tạo blog và upload ảnh kèm theo
router.post("/", verifyToken, blogController.createBlog);

module.exports = router;
