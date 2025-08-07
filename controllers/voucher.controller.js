const Voucher = require('../models/voucher.model');

exports.createVoucher = async (req, res) => {
  try {
    const {
      code,
      discount,
      type,
      quantity,
      expires_at,
      description,
      min_order_value,
      max_discount,
    } = req.body;

    const shop_id = req.user.role === 'seller' ? req.user.shop_id : null;

    const voucher = await Voucher.create({
      code,
      discount,
      type,
      quantity,
      expires_at,
      description,
      min_order_value,
      max_discount,
      shop_id,
      created_by: req.user.id,
    });

    res.status(201).json(voucher);
  } catch (err) {
    res.status(400).json({
      error: 'CREATE_VOUCHER_FAILED',
      message: err.message,
    });
  }
};

exports.getAllVouchers = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'seller') {
      filter.shop_id = req.user.shop_id;
    }

    const vouchers = await Voucher.find(filter).sort({ created_at: -1 });
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({
      error: 'FETCH_VOUCHERS_FAILED',
      message: err.message,
    });
  }
};

exports.getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher)
      return res.status(404).json({ error: 'Voucher not found' });

    if (
      req.user.role === 'seller' &&
      voucher.shop_id?.toString() !== req.user.shop_id
    ) {
      return res.status(403).json({ error: 'FORBIDDEN: Not your voucher' });
    }

    res.json(voucher);
  } catch (err) {
    res.status(500).json({
      error: 'FETCH_VOUCHER_FAILED',
      message: err.message,
    });
  }
};

exports.updateVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    if (req.user.role === 'seller') {
      if (!voucher.shop_id) {
        return res.status(403).json({ error: 'FORBIDDEN: Cannot update global voucher' });
      }
      if (voucher.shop_id.toString() !== req.user.shop_id) {
        return res.status(403).json({ error: 'FORBIDDEN: Not your voucher' });
      }
    }

    // Optional: Validate type
    const allowedTypes = ['percent', 'amount', 'freeship'];
    if (req.body.type && !allowedTypes.includes(req.body.type)) {
      return res.status(400).json({
        error: 'INVALID_TYPE',
        message: `Loại voucher không hợp lệ. Chỉ chấp nhận: ${allowedTypes.join(', ')}`
      });
    }

    const updated = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({
      error: 'UPDATE_VOUCHER_FAILED',
      message: err.message,
    });
  }
};


exports.deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher)
      return res.status(404).json({ error: 'Voucher not found' });

    if (
      req.user.role === 'seller' &&
      voucher.shop_id?.toString() !== req.user.shop_id
    ) {
      return res.status(403).json({ error: 'FORBIDDEN: Not your voucher' });
    }

    await Voucher.findByIdAndDelete(req.params.id);
    res.json({ message: 'Voucher deleted' });
  } catch (err) {
    res.status(500).json({
      error: 'DELETE_VOUCHER_FAILED',
      message: err.message,
    });
  }
};
