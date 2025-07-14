const Notification = require('../models/notification.model');

exports.getUserNotifications = async (req, res) => {
  const userId = req.params.userId;
  const notifications = await Notification.find({ user_id: userId }).sort({ created_at: -1 });
  res.json(notifications);
};

exports.createNotification = async (req, res) => {
     console.log("📥 From FE - req.body:", req.body);
  const { user_id, message } = req.body;

  const newNotification = new Notification({ user_id, message });
  await newNotification.save();

  // Gửi realtime nếu có socket
  if (req.io) {
    req.io.to(user_id.toString()).emit('new_notification', newNotification);
  }

  res.status(201).json(newNotification);
};

exports.markAllAsRead = async (req, res) => {
  const userId = req.params.userId;
  await Notification.updateMany({ user_id: userId, is_read: false }, { is_read: true });
  res.json({ success: true });
};
exports.deleteAllByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    await Notification.deleteMany({ user_id: userId });
    res.json({ success: true, message: "Xóa tất cả thông báo thành công" });
  } catch (error) {
    console.error("Lỗi xóa tất cả notification:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
