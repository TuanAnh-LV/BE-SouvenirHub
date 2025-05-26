const { body } = require('express-validator');

exports.createProductValidator = [
  body('name').isString().isLength({ min: 3 }),
  body('description').isString(),
  body('price').isFloat({ gt: 0 }),
  body('stock').isInt({ min: 0 }),
  body('category_id').notEmpty().isMongoId()
];
