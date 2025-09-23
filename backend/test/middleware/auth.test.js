const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const { protect, restrictTo } = require('../../middleware/auth');
const { AppError } = require('../../utils/errors');
const User = require('../../models/User');

// Helper to create a mock request object
const createRequest = (headers = {}) => ({
  headers: {
    authorization: '',
    ...headers
  },
  ip: '127.0.0.1',
  originalUrl: '/api/test',
  method: 'GET'
});

// Helper to create a mock response object
const createResponse = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

// Helper to create a next function
const createNext = () => sinon.stub();

describe('Auth Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = createRequest();
    res = createResponse();
    next = createNext();
    
    // Stub the logger to prevent actual logging during tests
    sinon.stub(console, 'error');
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('protect', () => {
    it('should call next with error if no token is provided', async () => {
      await protect(req, res, next);
      
      expect(next.calledOnce).to.be.true;
      const error = next.firstCall.args[0];
      expect(error).to.be.an.instanceOf(AppError);
      expect(error.statusCode).to.equal(401);
      expect(error.message).to.equal('You are not logged in. Please log in to get access.');
    });
    
    it('should call next with error if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid.token.here';
      
      await protect(req, res, next);
      
      expect(next.calledOnce).to.be.true;
      const error = next.firstCall.args[0];
      expect(error).to.be.an.instanceOf(AppError);
      expect(error.statusCode).to.equal(401);
      expect(error.message).to.equal('Invalid token. Please log in again.');
    });
    
    it('should call next with error if user no longer exists', async () => {
      // Mock a valid token
      const token = jwt.sign(
        { id: '5f8d0f3d9d5f3d2e3c6f8a1b' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '90d' }
      );
      
      req.headers.authorization = `Bearer ${token}`;
      
      // Stub User.findById to return null (user not found)
      sinon.stub(User, 'findById').resolves(null);
      
      await protect(req, res, next);
      
      expect(next.calledOnce).to.be.true;
      const error = next.firstCall.args[0];
      expect(error).to.be.an.instanceOf(AppError);
      expect(error.statusCode).to.equal(401);
      expect(error.message).to.equal('The user belonging to this token no longer exists.');
    });
    
    it('should call next with error if user changed password after token was issued', async () => {
      // Mock a valid token
      const token = jwt.sign(
        { id: '5f8d0f3d9d5f3d2e3c6f8a1b', iat: Math.floor(Date.now() / 1000) - 100 },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '90d' }
      );
      
      req.headers.authorization = `Bearer ${token}`;
      
      // Mock user with passwordChangedAt after token was issued
      const user = {
        _id: '5f8d0f3d9d5f3d2e3c6f8a1b',
        passwordChangedAt: new Date(Date.now() - 50 * 1000), // 50 seconds ago
        changedPasswordAfter: () => true
      };
      
      // Stub User.findById
      sinon.stub(User, 'findById').resolves(user);
      
      await protect(req, res, next);
      
      expect(next.calledOnce).to.be.true;
      const error = next.firstCall.args[0];
      expect(error).to.be.an.instanceOf(AppError);
      expect(error.statusCode).to.equal(401);
      expect(error.message).to.equal('User recently changed password! Please log in again.');
    });
    
    it('should set req.user and call next if token is valid', async () => {
      // Mock a valid token
      const userId = '5f8d0f3d9d5f3d2e3c6f8a1b';
      const token = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '90d' }
      );
      
      req.headers.authorization = `Bearer ${token}`;
      
      // Mock user
      const user = {
        _id: userId,
        email: 'test@example.com',
        role: 'user',
        passwordChangedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        changedPasswordAfter: () => false
      };
      
      // Stub User.findById
      sinon.stub(User, 'findById').resolves(user);
      
      await protect(req, res, next);
      
      expect(req.user).to.exist;
      expect(req.user.id).to.equal(userId);
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args).to.be.empty;
    });
  });
  
  describe('restrictTo', () => {
    let middleware;
    
    beforeEach(() => {
      // Create a user with a role
      req.user = {
        role: 'user',
        id: '5f8d0f3d9d5f3d2e3c6f8a1b'
      };
      
      // Create the middleware with allowed roles
      middleware = restrictTo('admin', 'moderator');
    });
    
    it('should call next with error if user role is not authorized', () => {
      middleware(req, res, next);
      
      expect(next.calledOnce).to.be.true;
      const error = next.firstCall.args[0];
      expect(error).to.be.an.instanceOf(AppError);
      expect(error.statusCode).to.equal(403);
      expect(error.message).to.equal('You do not have permission to perform this action');
    });
    
    it('should call next without error if user role is authorized', () => {
      // Change user role to an authorized one
      req.user.role = 'admin';
      
      middleware(req, res, next);
      
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args).to.be.empty;
    });
    
    it('should handle missing req.user', () => {
      delete req.user;
      
      middleware(req, res, next);
      
      expect(next.calledOnce).to.be.true;
      const error = next.firstCall.args[0];
      expect(error).to.be.an.instanceOf(AppError);
      expect(error.statusCode).to.equal(401);
      expect(error.message).to.equal('You must be logged in to access this route');
    });
  });
  
  describe('isAuthenticated', () => {
    it('should set req.isAuthenticated to false if no token is provided', async () => {
      const { isAuthenticated } = require('../../middleware/auth');
      
      await isAuthenticated(req, res, next);
      
      expect(req.isAuthenticated).to.be.false;
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args).to.be.empty;
    });
    
    it('should set req.isAuthenticated to true and set req.user if valid token is provided', async () => {
      const { isAuthenticated } = require('../../middleware/auth');
      
      // Mock a valid token
      const userId = '5f8d0f3d9d5f3d2e3c6f8a1b';
      const token = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '90d' }
      );
      
      req.headers.authorization = `Bearer ${token}`;
      
      // Mock user
      const user = {
        _id: userId,
        email: 'test@example.com',
        role: 'user',
        passwordChangedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        changedPasswordAfter: () => false
      };
      
      // Stub User.findById
      sinon.stub(User, 'findById').resolves(user);
      
      await isAuthenticated(req, res, next);
      
      expect(req.isAuthenticated).to.be.true;
      expect(req.user).to.exist;
      expect(req.user.id).to.equal(userId);
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args).to.be.empty;
    });
  });
});
