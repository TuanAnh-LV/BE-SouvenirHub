const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebase_uid: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: function () { return !this.firebase_uid; } },
    role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
    avatar:{ type: String},
    created_at: { type: Date, default: Date.now },
    reset_password_token: String,
    reset_password_expires: Date,
    

});

module.exports = mongoose.model('User', userSchema);
