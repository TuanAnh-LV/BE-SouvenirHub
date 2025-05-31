// routes/shop.routes.js
const express = require("express");
const router = express.Router();
const Shop = require("../models/shop.model");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");
const shopController = require("../controllers/shop.controller");

/**
 * @swagger
 * tags:
 *   name: Shops
 *   description: Shop registration and management
 */

/**
 * @swagger
 * /api/shops:
 *   post:
 *     summary: Register a new shop (pending approval)
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Cửa hàng của TuanAnh
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Shop registered (pending approval)
 *       400:
 *         description: Registration failed
 */
router.post("/", verifyToken, shopController.createShop);

/**
 * @swagger
 * /api/shops/me:
 *   get:
 *     summary: Get current user's shop
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shop info
 *       404:
 *         description: No shop found
 */
router.get("/me", verifyToken, shopController.getMyShop);

const upload = require("../middlewares/upload.middleware");

/**
 * @swagger
 * /api/shops/me:
 *   put:
 *     summary: Update your shop information
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Shop updated
 *       404:
 *         description: Shop not found
 */
router.put(
  "/me",
  verifyToken,
  upload.single("logo"),
  shopController.updateShop
);

/**
 * @swagger
 * /api/shops/{id}:
 *   get:
 *     summary: Get public profile of a shop
 *     tags: [Shops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shop public profile
 *       404:
 *         description: Shop not found
 */
router.get("/:id", shopController.getShopById);

module.exports = router;
