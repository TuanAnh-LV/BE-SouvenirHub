const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebase_uid: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: function () { return !this.firebase_uid; } },
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  avatar: { type: String },
  phone: { type: String },
  birthday: { type: Date },
  gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'] },
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null }, 
  created_at: { type: Date, default: Date.now },
  reset_password_token: String,
  reset_password_expires: Date,
  email_verified: { type: Boolean, default: true },
  new_email: String,
  email_verification_token: String,
  email_verification_expires: Date,
});

module.exports = mongoose.model('User', userSchema);
