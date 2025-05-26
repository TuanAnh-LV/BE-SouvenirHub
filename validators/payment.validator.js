const { body } = require('express-validator');

// Validator cho thanh toán COD giả lập
exports.mockPayValidator = [
  body('order_id')
    .isMongoId()
    .withMessage('Invalid order_id')
];

// Validator cho thanh toán nội bộ (momo/vnpay)
exports.processOnlinePaymentValidator = [
  body('order_id')
    .isMongoId()
    .withMessage('Invalid order_id'),
  body('method')
    .isIn(['momo', 'vnpay'])
    .withMessage('Payment method must be momo or vnpay'),
  body('real_amount')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number')
];

// Validator cho tạo liên kết thanh toán Momo
exports.createMomoPaymentValidator = [
  body('order_id')
    .isMongoId()
    .withMessage('Invalid order_id')
];
