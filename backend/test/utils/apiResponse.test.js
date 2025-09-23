const { expect } = require('chai');
const sinon = require('sinon');
const {
  successResponse,
  errorResponse,
  validationError,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse
} = require('../../utils/apiResponse');

describe('API Response Utils', () => {
  let res;
  
  beforeEach(() => {
    // Create a mock response object for each test
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis()
    };
  });
  
  afterEach(() => {
    // Reset all stubs after each test
    sinon.restore();
  });
  
  describe('successResponse', () => {
    it('should send a success response with default status code and message', () => {
      const data = { id: 1, name: 'Test' };
      
      successResponse(res, data);
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.deep.equal({
        success: true,
        message: 'Success',
        data: data
      });
    });
    
    it('should use custom status code and message when provided', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Custom success message';
      const statusCode = 201;
      
      successResponse(res, data, message, statusCode);
      
      expect(res.status.calledWith(statusCode)).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.deep.equal({
        success: true,
        message: message,
        data: data
      });
    });
    
    it('should include pagination data when provided', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10
      };
      
      successResponse(res, data, 'Success', 200, { pagination });
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('pagination', pagination);
    });
  });
  
  describe('errorResponse', () => {
    it('should send an error response with default status code and message', () => {
      const error = new Error('Test error');
      
      errorResponse(res, error.message);
      
      expect(res.status.calledWith(500)).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.deep.equal({
        success: false,
        message: 'Test error'
      });
    });
    
    it('should use custom status code and include error details in development', () => {
      // Set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      
      errorResponse(res, 'Custom error message', 400, error);
      
      expect(res.status.calledWith(400)).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.deep.equal({
        success: false,
        message: 'Custom error message',
        error: {
          message: 'Test error',
          stack: 'Error stack trace'
        }
      });
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });
  });
  
  describe('validationError', () => {
    it('should send a validation error response with 422 status code', () => {
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Password is required' }
      ];
      
      validationError(res, errors);
      
      expect(res.status.calledWith(422)).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.deep.equal({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    });
  });
  
  describe('notFoundResponse', () => {
    it('should send a not found response with 404 status code', () => {
      const message = 'Resource not found';
      
      notFoundResponse(res, message);
      
      expect(res.status.calledWith(404)).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.deep.equal({
        success: false,
        message: message
      });
    });
    
    it('should use default message if none provided', () => {
      notFoundResponse(res);
      
      const response = res.json.firstCall.args[0];
      expect(response.message).to.equal('Resource not found');
    });
  });
  
  describe('unauthorizedResponse', () => {
    it('should send an unauthorized response with 401 status code', () => {
      const message = 'Authentication required';
      
      unauthorizedResponse(res, message);
      
      expect(res.status.calledWith(401)).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.deep.equal({
        success: false,
        message: message
      });
    });
    
    it('should use default message if none provided', () => {
      unauthorizedResponse(res);
      
      const response = res.json.firstCall.args[0];
      expect(response.message).to.equal('Unauthorized');
    });
  });
  
  describe('forbiddenResponse', () => {
    it('should send a forbidden response with 403 status code', () => {
      const message = 'Insufficient permissions';
      
      forbiddenResponse(res, message);
      
      expect(res.status.calledWith(403)).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.deep.equal({
        success: false,
        message: message
      });
    });
    
    it('should use default message if none provided', () => {
      forbiddenResponse(res);
      
      const response = res.json.firstCall.args[0];
      expect(response.message).to.equal('Forbidden');
    });
  });
});
