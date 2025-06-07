// controllers/auth.controller.js
const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebase');
const { sendMail } = require('../utils/mailer');
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password_hash });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    console.error('Register Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 👇 Trả về đầy đủ user
    const fullUser = await User.findById(user._id).select("-password_hash -firebase_uid");

    res.json({ token, user: fullUser });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.googleLogin = async (req, res) => {
    const { idToken } = req.body;
  
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const { uid, email, name, picture } = decoded;
  
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          email,
          name,
          avatar: picture,
          firebase_uid: uid,
          role: 'buyer'
        });
        await user.save();
      }
  
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
  
      const fullUser = await User.findById(user._id).select("-password_hash -firebase_uid");
      res.json({ token, user: fullUser });
    } catch (err) {
      res.status(401).json({ error: 'Invalid Google token', detail: err.message });
    }
  };

  exports.getMe = async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password_hash');
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user info' });
    }
  };
  exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
      const user = await User.findById(req.user.id);
      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) return res.status(400).json({ message: 'Current password incorrect' });
  
      user.password_hash = await bcrypt.hash(newPassword, 10);
      await user.save();
  
      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to change password' });
    }
  };
  const crypto = require('crypto');

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    const token = crypto.randomBytes(32).toString('hex');
    user.reset_password_token = token;
    user.reset_password_expires = Date.now() + 15 * 60 * 1000; // 15 phút
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

    await sendMail({
      to: user.email,
      subject: 'Yêu cầu đặt lại mật khẩu - SouvenirHub',
      html: `
        <p>Xin chào ${user.name},</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào liên kết bên dưới:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Liên kết này sẽ hết hạn sau 15 phút.</p>
      `
    });

    res.json({ message: 'Email đặt lại mật khẩu đã được gửi.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      reset_password_token: token,
      reset_password_expires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;
    await user.save();

    res.json({ message: 'Mật khẩu đã được cập nhật.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
exports.verifyNewEmail = async (req, res) => {
  const { token } = req.body;

  try {
    const user = await User.findOne({
      email_verification_token: token,
      email_verification_expires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }

    user.email = user.new_email;
    user.new_email = undefined;
    user.email_verified = true;
    user.email_verification_token = undefined;
    user.email_verification_expires = undefined;

    await user.save();

    res.json({ message: 'Email verified successfully.' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Failed to verify email.' });
  }
};
exports.resendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.new_email) {
      return res.status(400).json({ message: 'No pending email to verify.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.email_verification_token = code;
    user.email_verification_expires = Date.now() + 15 * 60 * 1000;
    await user.save();

    await sendMail({
      to: user.new_email,
      subject: 'Resend Email Verification - SouvenirHub',
      html: `
        <p>Hello ${user.name},</p>
        <p>Here is your new email verification code:</p>
        <h2>${code}</h2>
        <p>This code is valid for 15 minutes.</p>
      `
    });

    res.json({ message: 'Verification code resent to your new email.' });
  } catch (err) {
    console.error('Resend email verification error:', err);
    res.status(500).json({ error: 'Failed to resend verification code.' });
  }
};
