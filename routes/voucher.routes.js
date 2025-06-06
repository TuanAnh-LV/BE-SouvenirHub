const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.post('/', verifyToken, requireRole('admin'), voucherController.createVoucher);
router.get('/', verifyToken, voucherController.getAllVouchers);
router.get('/:id', verifyToken, voucherController.getVoucherById);
router.put('/:id', verifyToken, requireRole('admin'), voucherController.updateVoucher);
router.delete('/:id', verifyToken, requireRole('admin'), voucherController.deleteVoucher);

module.exports = router;