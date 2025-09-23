const app = require('./app');
const mongoose = require('mongoose');
const config = require('./config/config');
const logger = require('./utils/logger');

// Connect to MongoDB
mongoose
  .connect(config.mongo.uri, config.mongo.options)
  .then(() => {
    logger.info('Connected to MongoDB');
    startServer();
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Start the server
function startServer() {
  const server = app.listen(config.port, config.host, () => {
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

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled Rejection: ${error.message}`);
  // Optionally exit the process with a failure code
  // process.exit(1);
});
