const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { isValidImage } = require('../utils/validator');
const crypto = require('crypto');
const { sendMail } = require('../utils/mailer');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash -reset_password_token -reset_password_expires');
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
};



exports.updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Remove fields with empty string values to avoid validation errors
    Object.keys(updates).forEach(key => {
      if (updates[key] === '') {
        delete updates[key];
      }
    });

    // Validate file type if avatar is uploaded
    if (req.file && !isValidImage(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'souvenirhub/avatars');
      updates.avatar = result.secure_url;
    }

    const user = await User.findById(req.user.id);

    // Email update flow
    if (updates.email && updates.email !== user.email) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      user.new_email = updates.email;
      user.email_verification_token = code;
      user.email_verification_expires = Date.now() + 15 * 60 * 1000;
      user.email_verified = false;

      await sendMail({
        to: updates.email,
        subject: 'Email Change Verification - SouvenirHub',
        html: `
          <p>Hello ${user.name},</p>
          <p>You have requested to change your email address.</p>
          <p>Please enter the following verification code:</p>
          <h2>${code}</h2>
          <p>This code will expire in 15 minutes.</p>
        `
      });

      // Do not assign email directly
      delete updates.email;
    }

    Object.assign(user, updates);
    await user.save();

    res.json({ message: 'Profile updated. If you changed your email, please verify it.' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};



exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Invalid password input' });
  }

  try {
    const user = await User.findById(req.user.id);
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: 'Current password incorrect' });
    }

    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
};
