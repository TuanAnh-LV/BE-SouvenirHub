const { body } = require('express-validator');

// Validator cho việc tạo đơn hàng
exports.createOrderValidator = [
  body('shipping_address_id')
    .isMongoId()
    .withMessage('Shipping address ID must be a valid MongoID'),

  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),

  body('items.*.product_id')
    .isMongoId()
    .withMessage('Each product_id must be a valid MongoID'),

  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item must have a quantity >= 1')
];

// Validator cho việc cập nhật trạng thái đơn hàng

exports.updateOrderStatusValidator = [
  body('status')
    .isIn(['pending', 'processing', 'shipped', 'completed', 'cancelled'])
    .withMessage('Status must be one of: pending, processing, shipped, completed, cancelled')
];
