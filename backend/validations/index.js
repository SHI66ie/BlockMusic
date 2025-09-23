const { body, param, query, validationResult } = require('express-validator');
const { validationError } = require('../utils/apiResponse');

/**
 * Middleware to validate request parameters
 * @param {Array} validations - Array of validation rules
 * @returns {Function} - Express middleware function
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

    return validationError(res, extractedErrors);
  };
};

// Common validation rules
const commonRules = {
  // MongoDB ObjectId validation
  id: param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),

  // Pagination
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    query('sort')
      .optional()
      .isString()
      .withMessage('Sort must be a string')
  ],

  // Ethereum address validation
  ethereumAddress: (field = 'address') => 
    body(field)
      .trim()
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address')
      .bail()
      .toLowerCase(),

  // Email validation
  email: (field = 'email') => 
    body(field)
      .trim()
      .isEmail()
      .withMessage('Invalid email address')
      .normalizeEmail(),

  // Password validation
  password: (field = 'password') => 
    body(field)
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage('Password must contain at least one special character'),

  // Username validation
  username: (field = 'username') => 
    body(field)
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),

  // IPFS hash validation
  ipfsHash: (field = 'ipfsHash') => 
    body(field)
      .trim()
      .matches(/^Qm[1-9A-HJ-NP-Za-km-z]{44,}$/)
      .withMessage('Invalid IPFS hash format'),

  // Token ID validation
  tokenId: (field = 'tokenId') => 
    body(field)
      .isInt({ min: 0 })
      .withMessage('Token ID must be a non-negative integer')
      .toInt()
};

module.exports = {
  validate,
  commonRules,
  body,
  param,
  query
};
