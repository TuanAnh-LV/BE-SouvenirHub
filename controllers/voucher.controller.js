const Voucher = require('../models/voucher.model');

exports.createVoucher = async (req, res) => {
  try {
    const { code, discount, type, quantity, expires_at, description, min_order_value } = req.body;
    const voucher = await Voucher.create({ code, discount, type, quantity, expires_at, description, min_order_value });
    res.status(201).json(voucher);
  } catch (err) {
    res.status(400).json({ error: 'CREATE_VOUCHER_FAILED', message: err.message });
  }
};

exports.getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ created_at: -1 });
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ error: 'FETCH_VOUCHERS_FAILED', message: err.message });
  }
};

exports.getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ error: 'Voucher not found' });
    res.json(voucher);
  } catch (err) {
    res.status(500).json({ error: 'FETCH_VOUCHER_FAILED', message: err.message });
  }
};

exports.updateVoucher = async (req, res) => {
  try {
    const { code, discount, type, quantity, expires_at, description, min_order_value } = req.body;
    const voucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      { code, discount, type, quantity, expires_at, description, min_order_value },
      { new: true }
    );
    if (!voucher) return res.status(404).json({ error: 'Voucher not found' });
    res.json(voucher);
  } catch (err) {
    res.status(400).json({ error: 'UPDATE_VOUCHER_FAILED', message: err.message });
  }
};

exports.deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!voucher) return res.status(404).json({ error: 'Voucher not found' });
    res.json({ message: 'Voucher deleted' });
  } catch (err) {
    res.status(500).json({ error: 'DELETE_VOUCHER_FAILED', message: err.message });
  }
};