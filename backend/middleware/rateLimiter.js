const rateLimit = require('express-rate-limit');
const { createClient } = require('redis');
const RedisStore = require('rate-limit-redis');

// Create Redis client if REDIS_URL is provided
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });
  
  // Don't block the application startup if Redis connection fails
  redisClient.connect().catch(console.error);
}

/**
 * Rate limiting middleware
 * @param {Object} options - Rate limiting options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @param {number} options.max - Maximum number of requests per window (default: 100)
 * @param {string} options.message - Error message when rate limit is exceeded
 * @param {string} options.keyGenerator - Function to generate rate limit key
 * @returns {Function} - Express middleware function
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later',
    keyGenerator = (req) => req.ip, // default key generator uses IP address
    ...otherOptions
  } = options;

  // Use Redis store if available, otherwise use in-memory store
  const store = redisClient
    ? new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: 'blockmusic:ratelimit:',
      })
    : new rateLimit.MemoryStore(windowMs);

  return rateLimit.rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    keyGenerator,
    store,
    ...otherOptions,
  });
};

// Common rate limiters
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

const authLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 login attempts per hour
  message: 'Too many login attempts from this IP, please try again after an hour',
});

const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 file uploads per hour
  message: 'Too many file uploads from this IP, please try again later',
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  uploadLimiter,
};
