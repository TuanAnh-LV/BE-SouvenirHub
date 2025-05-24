// controllers/shop.controller.js
const Shop = require('../models/shop.model');
const ShopApplication = require('../models/shopApplication.model');

exports.getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ user_id: req.user.id });
    if (!shop) return res.status(404).json({ error: 'No shop found for this user' });
    res.json(shop);
  } catch (err) {
    console.error('Fetch shop error:', err);
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
};

