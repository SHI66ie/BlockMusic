const { expect } = require('chai');
const sinon = require('sinon');
const { errorHandler } = require('../../middleware/errorHandler');
const { AppError } = require('../../utils/errors');

// Helper to create a mock response object
const createResponse = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('Error Handler Middleware', () => {
  let res;
  let req;
  
  beforeEach(() => {
    res = createResponse();
    req = {
      originalUrl: '/api/test',
      method: 'GET',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent'
      }
    };
    
    // Stub the logger to prevent actual logging during tests
    sinon.stub(console, 'error');
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  it('should handle AppError with status code and message', () => {
    const err = new AppError('Test error', 400);
    
    errorHandler(err, req, res);
    
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledOnce).to.be.true;
    
    const response = res.json.firstCall.args[0];
    expect(response).to.have.property('success', false);
    expect(response).to.have.property('message', 'Test error');
    expect(response).to.have.property('status', 'error');
    expect(response).to.have.property('statusCode', 400);
    expect(response).to.have.property('stack').that.is.undefined;
  });
  
  it('should include stack trace in development environment', () => {
    // Save original env
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const err = new AppError('Test error', 400);
    
    errorHandler(err, req, res);
    
    const response = res.json.firstCall.args[0];
    expect(response).to.have.property('stack').that.is.a('string');
    
    // Restore original env
    process.env.NODE_ENV = originalEnv;
  });
  
  it('should handle validation errors from express-validator', () => {
    const err = {
      name: 'ValidationError',
      statusCode: 400,
      errors: [
        { param: 'email', msg: 'Invalid email' },
        { param: 'password', msg: 'Password too short' }
      ]
    };
    
    errorHandler(err, req, res);
    
    expect(res.status.calledWith(400)).to.be.true;
    
    const response = res.json.firstCall.args[0];
    expect(response).to.have.property('success', false);
    expect(response).to.have.property('message', 'Validation failed');
    expect(response).to.have.property('errors').that.is.an('array');
    expect(response.errors).to.have.lengthOf(2);
  });
  
  it('should handle JWT errors', () => {
    const err = new Error('jwt malformed');
    err.name = 'JsonWebTokenError';
    
    errorHandler(err, req, res);
    
    expect(res.status.calledWith(401)).to.be.true;
    
    const response = res.json.firstCall.args[0];
    expect(response).to.have.property('success', false);
    expect(response).to.have.property('message', 'Invalid token');
  });
  
  it('should handle JWT expired error', () => {
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    
    errorHandler(err, req, res);
    
    expect(res.status.calledWith(401)).to.be.true;
    
    const response = res.json.firstCall.args[0];
    expect(response).to.have.property('success', false);
    expect(response).to.have.property('message', 'Token expired');
  });
  
  it('should handle MongoDB duplicate key error', () => {
    const err = new Error('E11000 duplicate key error');
    err.code = 11000;
    
    errorHandler(err, req, res);
    
    expect(res.status.calledWith(400)).to.be.true;
    
    const response = res.json.firstCall.args[0];
    expect(response).to.have.property('success', false);
    expect(response).to.have.property('message', 'Duplicate field value entered');
  });
  
  it('should handle MongoDB validation error', () => {
    const err = new Error('Validation failed');
    err.name = 'ValidationError';
    
    errorHandler(err, req, res);
    
    expect(res.status.calledWith(400)).to.be.true;
    
    const response = res.json.firstCall.args[0];
    expect(response).to.have.property('success', false);
    expect(response).to.have.property('message', 'Validation failed');
  });
  
  it('should handle CastError for invalid ObjectId', () => {
    const err = new Error('Cast to ObjectId failed');
    err.name = 'CastError';
    err.kind = 'ObjectId';
    
    errorHandler(err, req, res);
    
    expect(res.status.calledWith(400)).to.be.true;
    
    const response = res.json.firstCall.args[0];
    expect(response).to.have.property('success', false);
    expect(response).to.have.property('message', 'Invalid ID format');
  });
  
  it('should handle unknown errors with 500 status code', () => {
    const err = new Error('Some unexpected error');
    
    errorHandler(err, req, res);
    
    expect(res.status.calledWith(500)).to.be.true;
    
    const response = res.json.firstCall.args[0];
    expect(response).to.have.property('success', false);
    expect(response).to.have.property('message', 'Internal Server Error');
  });
  
  it('should log the error in production', () => {
    // Save original env
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const err = new Error('Test error');
    
    // Stub the logger
    const loggerStub = {
      error: sinon.stub()
    };
    
    // Replace the logger in the error handler
    const originalLogger = require('../../utils/logger');
    require('../../middleware/errorHandler').__setLogger(loggerStub);
    
    errorHandler(err, req, res);
    
    // Restore the original logger
    require('../../middleware/errorHandler').__setLogger(originalLogger);
    process.env.NODE_ENV = originalEnv;
    
    expect(loggerStub.error.calledOnce).to.be.true;
    const logArgs = loggerStub.error.firstCall.args;
    expect(logArgs[0]).to.include('Test error');
  });
});

// Helper to allow replacing the logger in tests
const errorHandlerModule = require('../../middleware/errorHandler');
errorHandlerModule.__setLogger = (logger) => {
  errorHandlerModule.logger = logger;
};
