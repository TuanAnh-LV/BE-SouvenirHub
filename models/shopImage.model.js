const mongoose = require('mongoose');

const shopImageSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  image_url: { type: String, required: true },
  type: String
});

module.exports = mongoose.model('ShopImage', shopImageSchema);
