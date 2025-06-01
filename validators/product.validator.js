const { body } = require('express-validator');
const mongoose = require('mongoose');

exports.createProductValidator = [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').isString().notEmpty().withMessage('Description is required'),
  body('category_id')
    .custom(value => mongoose.Types.ObjectId.isValid(value))
    .withMessage('category_id must be a valid ObjectId'),
  body('price').isFloat({ gt: 0 }),
  body('stock').isInt({ min: 0 }),
];
exports.updateProductValidator = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('description').optional().isString().notEmpty().withMessage('Description cannot be empty'),
  body('category_id')
    .optional()
    .custom(value => mongoose.Types.ObjectId.isValid(value))
    .withMessage('category_id must be a valid ObjectId'),
  body('price').optional().isFloat({ gt: 0 }),
  body('stock').optional().isInt({ min: 0 }),
];