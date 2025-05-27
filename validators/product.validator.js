const { body } = require('express-validator');

exports.createProductValidator = [
  body('description').isString(),
  body('price').isFloat({ gt: 0 }),
  body('stock').isInt({ min: 0 }),
];
