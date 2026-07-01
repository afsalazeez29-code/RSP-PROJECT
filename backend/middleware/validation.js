const { body, param, query, validationResult } = require('express-validator');

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters.')
    .trim()
];

const mongoIdParam = (field = 'id') => [
  param(field)
    .isMongoId()
    .withMessage('Invalid resource identifier.')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive number.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.')
];

const searchValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search cannot exceed 100 characters.')
];

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const message = errors.array({ onlyFirstError: true })[0].msg;

  if (req.accepts('html')) {
    const error = new Error(message);
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  return res.status(400).json({
    success: false,
    error: {
      message,
      code: 'VALIDATION_ERROR',
      statusCode: 400
    }
  });
};

module.exports = {
  loginValidation,
  mongoIdParam,
  paginationValidation,
  searchValidation,
  validateRequest
};
