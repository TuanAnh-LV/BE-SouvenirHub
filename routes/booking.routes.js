const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// Route tạo booking
router.post("/", verifyToken, bookingController.createBooking);

// (Tuỳ chọn) Route lấy tất cả booking
router.get("/", verifyToken, bookingController.getAllBookings);

// Route lấy booking theo ID
router.get("/:id", verifyToken, bookingController.getBookingById);

module.exports = router;
