const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  ten: { type: String, required: true },
  email: { type: String, required: true },
  sdt: { type: String, required: true },
  description: { type: String, required: true },
  event: { type: String, required: true },
  budget_from: { type: Number, required: true },
  budget_to: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserRequest", requestSchema);
