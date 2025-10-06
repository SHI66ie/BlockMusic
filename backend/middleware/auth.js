const jwt = require('jsonwebtoken');
const { promisify } = require('util');

/**
 * Middleware to protect routes that require authentication
 */
const protect = async (req, res, next) => {
  try {
    // 1) Get token and check if it exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in! Please log in to get access.',
      });
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists (you would typically fetch the user from DB here)
    // For now, we'll just attach the decoded user to the request
    req.user = decoded;
    res.locals.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token or token expired. Please log in again.',
    });
  }
};

/**
 * Middleware to restrict routes to specific roles
 * @param  {...string} roles - Roles that are allowed to access the route
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

/**
 * Middleware to check if user is authenticated (without throwing error)
 * Useful for optional authentication
 */
const isAuthenticated = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (token) {
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      req.user = decoded;
      res.locals.user = decoded;
    }
  } catch (err) {
    // Token is invalid or expired, but we don't throw an error
    // since this is just for optional authentication
  }
  next();
};

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {string} - JWT token
 */
const signToken = (userId, role = 'user') => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  });
};

/**
 * Create and send JWT token in cookie
 * @param {Object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, user.role);

  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
  };

  // Send cookie with JWT
  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

module.exports = {
  protect,
  restrictTo,
  isAuthenticated,
  signToken,
  createSendToken,
};
