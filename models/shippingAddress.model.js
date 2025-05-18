const mongoose = require('mongoose');

const shippingAddressSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient_name: String,
  phone: String,
  address_line: String,
  city: String,
  district: String,
  ward: String,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ShippingAddress', shippingAddressSchema);
