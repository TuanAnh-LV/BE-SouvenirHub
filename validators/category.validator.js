const { body } = require('express-validator');

// Middleware cho việc tạo category
exports.createCategoryValidator = [
  body('name')
    .isString().withMessage('Name must be a string')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  
  body('parent_id')
    .optional({ nullable: true })
    .isMongoId().withMessage('Invalid parent_id')
];

// Middleware cho việc cập nhật category
exports.updateCategoryValidator = [
  body('name')
    .optional()
    .isString().withMessage('Name must be a string')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),

  body('parent_id')
    .optional({ nullable: true })
    .isMongoId().withMessage('Invalid parent_id')
];
