const mongoose = require('mongoose');

const shopApplicationSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  business_name: String,
  business_category: String,
  representative_name: String,
  email: String,
  phone: String,
  address: String,
  logo_url: String,
  tax_id: String,
  id_card_number: String,
  license_file_url: String,
  id_card_front_url: String,
  id_card_back_url: String,
  additional_files: [String],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submitted_at: { type: Date, default: Date.now },
  approved_at: Date,
  rejection_reason: String,
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('ShopApplication', shopApplicationSchema);
