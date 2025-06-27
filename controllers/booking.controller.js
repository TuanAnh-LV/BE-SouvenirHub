const Booking = require("../models/booking.model");

// Tạo booking mới
exports.createBooking = async (req, res) => {
  try {
    const { ten, email, sdt, description, event, budget_from, budget_to } =
      req.body;

    if (
      !ten ||
      !email ||
      !sdt ||
      !description ||
      !event ||
      budget_from == null ||
      budget_to == null
    ) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const newBooking = new Booking({
      ten,
      email,
      sdt,
      description,
      event,
      budget_from,
      budget_to,
    });

    await newBooking.save();
    return res
      .status(201)
      .json({ message: "Đã ghi nhận booking", data: newBooking });
  } catch (err) {
    console.error("Lỗi tạo booking:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy danh sách booking
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ created_at: -1 });
    return res.status(200).json(bookings);
  } catch (err) {
    console.error("Lỗi lấy danh sách booking:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy booking theo ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking không tồn tại" });
    }
    return res.status(200).json(booking);
  } catch (err) {
    console.error("Lỗi lấy booking:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
