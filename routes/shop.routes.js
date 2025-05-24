// routes/shop.routes.js
const express = require('express');
const router = express.Router();
const Shop = require('../models/shop.model');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const shopController = require('../controllers/shop.controller');

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
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const existingShop = await Shop.findOne({ user_id: req.user.id });
    if (existingShop) {
      return res.status(400).json({ error: 'You have already registered a shop' });
    }
    const shop = new Shop({ user_id: req.user.id, name, description, status: 'pending' });
    await shop.save();
    res.status(201).json({ message: 'Shop registered and pending approval', shop });
  } catch (err) {
    console.error('Create shop error:', err);
    res.status(400).json({ error: 'Failed to register shop', detail: err.message });
  }
});

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
router.get('/me', verifyToken, shopController.getMyShop);



module.exports = router;
