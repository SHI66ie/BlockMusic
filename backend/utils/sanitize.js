const xss = require('xss');
const { isEmail, normalizeEmail } = require('validator');

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return xss(input.trim());
  }
  return input;
};

/**
 * Sanitize email address
 * @param {string} email - Email address to sanitize
 * @returns {string} - Sanitized email or null if invalid
 */
const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  
  const trimmedEmail = email.trim().toLowerCase();
  if (!isEmail(trimmedEmail)) return null;
  
  return normalizeEmail(trimmedEmail);
};

/**
 * Sanitize and validate Ethereum address
 * @param {string} address - Ethereum address to sanitize
 * @returns {string} - Checksummed address or null if invalid
 */
const sanitizeEthereumAddress = (address) => {
  try {
    if (!address || typeof address !== 'string') return null;
    
    // Basic validation (0x + 40 hex characters, case-insensitive)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) return null;
    
    // Convert to checksum address
    const { ethers } = require('ethers');
    return ethers.utils.getAddress(address.trim());
  } catch (error) {
    return null;
  }
};

/**
 * Sanitize object properties recursively
 * @param {Object} obj - Object to sanitize
 * @param {Array} exclude - Array of keys to exclude from sanitization
 * @returns {Object} - Sanitized object
 */
const sanitizeObject = (obj, exclude = []) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, exclude));
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (exclude.includes(key)) {
      sanitized[key] = value;
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : sanitizeObject(item, exclude)
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, exclude);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Sanitize request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const sanitizeRequest = (req, res, next) => {
  // Skip if no body
  if (!req.body || typeof req.body !== 'object') return next();
  
  // Skip if already sanitized
  if (req._bodySanitized) return next();
  
  // Sanitize request body
  req.body = sanitizeObject(req.body);
  
  // Mark as sanitized to avoid redundant processing
  req._bodySanitized = true;
  
  next();
};

module.exports = {
  sanitizeInput,
  sanitizeEmail,
  sanitizeEthereumAddress,
  sanitizeObject,
  sanitizeRequest,
};
