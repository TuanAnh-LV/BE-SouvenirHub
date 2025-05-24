const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { isValidImage } = require('../utils/validator');

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

    // Validate file type nếu có
    if (req.file && !isValidImage(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'souvenirhub/avatars');
      updates.avatar = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password_hash');
    res.json(updatedUser);
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
