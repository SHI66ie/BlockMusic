const app = require('./app');
const mongoose = require('mongoose');
const config = require('./config/config');
const logger = require('./utils/logger');

// Connect to MongoDB (optional - skip if no URI provided)
if (config.mongo && config.mongo.uri) {
  mongoose
    .connect(config.mongo.uri, config.mongo.options)
    .then(() => {
      logger.info('Connected to MongoDB');
      startServer();
    })
    .catch((error) => {
      logger.error('MongoDB connection error:', error);
      logger.warn('Starting server without MongoDB...');
      startServer();
    });
} else {
  logger.warn('No MongoDB URI provided. Starting server without database...');
  startServer();
}

// Start the server
function startServer() {
  const server = app.listen(config.port, config.host || '0.0.0.0', () => {
    logger.info(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (error) => {
    logger.error(`Unhandled Rejection: ${error.message}`);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    process.exit(1);
  });

  // Handle SIGTERM (for Docker, Kubernetes, etc.)
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully');
    server.close(() => {
      logger.info('Process terminated');
    });
  });
}
