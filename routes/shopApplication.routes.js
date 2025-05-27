const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middlewares/auth.middleware');
const shopApplicationController = require('../controllers/shopApplication.controller');

const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * @swagger
 * /api/shop-applications:
 *   post:
 *     summary: Submit a business application for shop approval (with ID card images and logo file)
 *     tags: [ShopApplications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               shop_id:
 *                 type: string
 *               business_name:
 *                 type: string
 *               business_category:
 *                 type: string
 *               representative_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               logo_file:
 *                 type: string
 *                 format: binary
 *               tax_id:
 *                 type: string
 *               id_card_number:
 *                 type: string
 *               license_file:
 *                 type: string
 *                 format: binary
 *               id_card_front:
 *                 type: string
 *                 format: binary
 *               id_card_back:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Application submitted
 */
router.post(
  '/',
  verifyToken,
  upload.fields([
    { name: 'id_card_front', maxCount: 1 },
    { name: 'id_card_back', maxCount: 1 },
    { name: 'license_file', maxCount: 1 },
    { name: 'logo_file', maxCount: 1 } // ✅ Đã thêm dòng này
  ]),
  shopApplicationController.submitApplication
);

/**
 * @swagger
 * /api/shop-applications/{shopId}:
 *   get:
 *     summary: Get business application info for a shop
 *     tags: [ShopApplications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Application data
 *       404:
 *         description: Application not found
 */
router.get('/:shopId', verifyToken, shopApplicationController.getApplicationByShop);

module.exports = router;
