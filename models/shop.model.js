const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  rating: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  logo_url: String,
  address: { type: String },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shop', shopSchema);
