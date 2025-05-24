const User = require('../models/user.model');
const bcrypt = require('bcrypt');

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash -reset_password_token -reset_password_expires');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
};

exports.updateProfile = async (req, res) => {
    try {
      const updates = { ...req.body };
  
      // Nếu có file ảnh avatar
      if (req.file) {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'souvenirhub/avatars',
              resource_type: 'image'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.file.buffer);
        });
  
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
