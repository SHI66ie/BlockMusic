const { validationResult, check } = require('express-validator');

/**
 * Middleware to validate request using express-validator
 * @param {Array} validations - Array of validation rules
 * @returns {Function} - Express middleware function
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = [];
    errors.array().map((err) =>
      extractedErrors.push({ [err.param]: err.msg })
    );

    return res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      errors: extractedErrors,
    });
  };
};

// Common validation rules
const commonRules = {
  // Ethereum address validation
  ethereumAddress: check('address')
    .trim()
    .isEthereumAddress()
    .withMessage('Please provide a valid Ethereum address'),

  // Email validation
  email: check('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  // Password validation
  password: check('password')
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
  username: check('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  // IPFS hash validation
  ipfsHash: check('ipfsHash')
    .trim()
    .matches(/^Qm[1-9A-HJ-NP-Za-km-z]{44,}$/)
    .withMessage('Please provide a valid IPFS hash'),

  // Token ID validation
  tokenId: check('tokenId')
    .isInt({ min: 0 })
    .withMessage('Token ID must be a non-negative integer'),

  // File validation
  file: (fieldName, allowedTypes, maxSizeMB = 10) => {
    return (req, res, next) => {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: `Please upload a file for ${fieldName}`,
        });
      }

      // Check file type
      const fileType = req.file.mimetype.split('/')[0];
      if (!allowedTypes.includes(fileType)) {
        return res.status(400).json({
          status: 'error',
          message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        });
      }

      // Check file size (in bytes)
      const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
      if (req.file.size > maxSize) {
        return res.status(400).json({
          status: 'error',
          message: `File size too large. Maximum size: ${maxSizeMB}MB`,
        });
      }

      next();
    };
  },
};

module.exports = {
  validate,
  commonRules,
};
