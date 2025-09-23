const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config/config');
const logger = require('./utils/logger');
const { sanitizeRequest } = require('./utils/sanitize');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const nftRoutes = require('./routes/nft');

// Initialize Express app
const app = express();

// Trust proxy (needed for Heroku, etc.)
app.set('trust proxy', 1);

// Middleware
app.use(helmet()); // Security headers
app.use(cors(config.cors)); // CORS configuration
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(sanitizeRequest); // Sanitize request data

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Rate limiting
app.use(config.api.prefix, apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use(`${config.api.prefix}/nfts`, nftRoutes);

// Serve static files in production
if (config.nodeEnv === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle SPA
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
    error: {
      code: 404,
      message: `Cannot ${req.method} ${req.url}`,
    },
  });
});

// Error handler (must be last middleware)
app.use(errorHandler);

module.exports = app;
