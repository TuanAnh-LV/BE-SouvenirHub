const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebase_uid: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
