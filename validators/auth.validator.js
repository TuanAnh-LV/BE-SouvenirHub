const { body } = require('express-validator');

// Validator cho đăng ký người dùng
exports.registerValidator = [
  body('name')
    .isString().withMessage('Name must be a string')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),

  body('email')
    .isEmail().withMessage('Invalid email address'),

  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Validator cho đăng nhập
exports.loginValidator = [
  body('email')
    .isEmail().withMessage('Invalid email address'),

  body('password')
    .notEmpty().withMessage('Password is required')
];

// Validator cho quên mật khẩu
exports.forgotPasswordValidator = [
  body('email')
    .isEmail().withMessage('Valid email is required')
];

// Validator cho đặt lại mật khẩu
exports.resetPasswordValidator = [
  body('token')
    .notEmpty().withMessage('Token is required'),

  body('newPassword')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];
