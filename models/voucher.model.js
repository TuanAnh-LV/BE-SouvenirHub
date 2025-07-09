const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true },
  type: { type: String, enum: ['percent', 'amount'], default: 'percent' },
  quantity: { type: Number, required: true },
  expires_at: { type: Date, required: true },
  description: { type: String },
  min_order_value: { type: Number, default: 0 },
  max_discount: { type: Number, default: 0 },
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Voucher', voucherSchema);
