const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const logger = require('../../utils/logger');
const { createLogger, format, transports } = winston;

// Mock the winston module
jest.mock('winston', () => {
  const originalModule = jest.requireActual('winston');
  const mockTransports = {
    Console: jest.fn(),
    File: jest.fn(),
    DailyRotateFile: jest.fn()
  };
  
  return {
    ...originalModule,
    createLogger: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      log: jest.fn()
    }),
    format: {
      ...originalModule.format,
      combine: jest.fn(),
      timestamp: jest.fn(),
      colorize: jest.fn(),
      printf: jest.fn()
    },
    transports: mockTransports
  };
});

// Mock the fs module to avoid actual file system operations
jest.mock('fs');
jest.mock('winston-daily-rotate-file', () => jest.fn());

describe('Logger Utility', () => {
  let mockLogger;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Get the mock logger instance
    mockLogger = createLogger();
    
    // Mock the fs.existsSync to simulate the logs directory existing
    fs.existsSync.mockReturnValue(true);
    
    // Mock mkdirSync to do nothing
    fs.mkdirSync.mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Reset the NODE_ENV after each test
    delete process.env.NODE_ENV;
  });
  
  it('should create a logger with console transport in development', () => {
    process.env.NODE_ENV = 'development';
    
    // Require the logger after setting NODE_ENV
    const devLogger = require('../../utils/logger');
    
    // Verify createLogger was called with the correct config
    expect(createLogger).toHaveBeenCalled();
    
    // Get the config passed to createLogger
    const loggerConfig = createLogger.mock.calls[0][0];
    
    // Should have a console transport in development
    expect(loggerConfig.transports).toHaveLength(1);
    expect(loggerConfig.transports[0]).toBeInstanceOf(transports.Console);
    
    // Should not have file transports in development
    expect(fs.existsSync).not.toHaveBeenCalled();
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });
  
  it('should create a logger with file transports in production', () => {
    process.env.NODE_ENV = 'production';
    
    // Require the logger after setting NODE_ENV
    const prodLogger = require('../../utils/logger');
    
    // Verify createLogger was called with the correct config
    expect(createLogger).toHaveBeenCalled();
    
    // Get the config passed to createLogger
    const loggerConfig = createLogger.mock.calls[0][0];
    
    // Should have file transports in production
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.mkdirSync).toHaveBeenCalled();
    
    // Should have both console and file transports
    expect(loggerConfig.transports).toHaveLength(3);
    expect(loggerConfig.transports[0]).toBeInstanceOf(transports.Console);
    expect(loggerConfig.transports[1]).toBeInstanceOf(transports.File);
    expect(loggerConfig.transports[2]).toBeInstanceOf(transports.File);
  });
  
  it('should create logs directory if it does not exist', () => {
    // Mock fs.existsSync to return false (directory doesn't exist)
    fs.existsSync.mockReturnValue(false);
    
    process.env.NODE_ENV = 'production';
    
    // Require the logger after setting NODE_ENV
    require('../../utils/logger');
    
    // Should check if directory exists and create it
    expect(fs.existsSync).toHaveBeenCalledWith(path.join(__dirname, '../../logs'));
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(__dirname, '../../logs'));
  });
  
  it('should log info messages', () => {
    const message = 'Test info message';
    const meta = { key: 'value' };
    
    logger.info(message, meta);
    
    expect(mockLogger.info).toHaveBeenCalledWith(message, meta);
  });
  
  it('should log error messages', () => {
    const message = 'Test error message';
    const error = new Error('Test error');
    
    logger.error(message, error);
    
    expect(mockLogger.error).toHaveBeenCalledWith(message, { error });
  });
  
  it('should log warning messages', () => {
    const message = 'Test warning message';
    const meta = { key: 'value' };
    
    logger.warn(message, meta);
    
    expect(mockLogger.warn).toHaveBeenCalledWith(message, meta);
  });
  
  it('should log debug messages in development', () => {
    process.env.NODE_ENV = 'development';
    
    const message = 'Test debug message';
    const meta = { key: 'value' };
    
    logger.debug(message, meta);
    
    expect(mockLogger.debug).toHaveBeenCalledWith(message, meta);
  });
  
  it('should not log debug messages in production', () => {
    process.env.NODE_ENV = 'production';
    
    const message = 'Test debug message';
    const meta = { key: 'value' };
    
    logger.debug(message, meta);
    
    expect(mockLogger.debug).not.toHaveBeenCalled();
  });
  
  it('should handle circular references in log metadata', () => {
    const circularObj = { name: 'Test' };
    circularObj.self = circularObj; // Create circular reference
    
    logger.info('Test circular reference', circularObj);
    
    // The logger should handle the circular reference without throwing
    expect(mockLogger.info).toHaveBeenCalled();
  });
});
