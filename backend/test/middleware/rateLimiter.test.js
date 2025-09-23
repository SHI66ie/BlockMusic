const { expect } = require('chai');
const sinon = require('sinon');
const redis = require('redis');
const { rateLimiter } = require('../../middleware/rateLimiter');
const { AppError } = require('../../utils/errors');

// Mock the Redis client
const mockRedisClient = {
  multi: sinon.stub().returnsThis(),
  setex: sinon.stub().returnsThis(),
  ttl: sinon.stub().returnsThis(),
  exec: sinon.stub(),
  on: sinon.stub()
};

// Mock the Redis createClient
sinon.stub(redis, 'createClient').returns(mockRedisClient);

// Helper to create a mock request object
const createRequest = (ip = '127.0.0.1', headers = {}) => ({
  ip,
  headers,
  originalUrl: '/api/test',
  method: 'GET'
});

// Helper to create a mock response object
const createResponse = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.set = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

// Helper to create a next function
const createNext = () => sinon.stub();

describe('Rate Limiter Middleware', () => {
  let req, res, next, rateLimitMiddleware;
  
  beforeEach(() => {
    // Reset mocks
    sinon.resetHistory();
    
    // Create fresh request, response, and next function for each test
    req = createRequest();
    res = createResponse();
    next = createNext();
    
    // Create a new rate limiter middleware for each test
    rateLimitMiddleware = rateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again after 15 minutes',
      keyGenerator: (req) => req.ip,
      handler: (req, res, next, options) => {
        next(new AppError(options.message, 429));
      }
    });
    
    // Mock Redis response for a new IP (not in cache yet)
    mockRedisClient.exec.resetBehavior();
    mockRedisClient.exec.callsArgWith(0, null, [
      null, // No error for SETEX
      null, // No error for TTL
      [1, 899] // [current count, TTL]
    ]);
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  it('should allow requests below the limit', async () => {
    // First request
    await rateLimitMiddleware(req, res, next);
    
    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args).to.be.empty;
    
    // Verify rate limit headers
    expect(res.set.calledWith('X-RateLimit-Limit', '100')).to.be.true;
    expect(res.set.calledWith('X-RateLimit-Remaining', '99')).to.be.true;
    expect(res.set.calledWith('X-RateLimit-Reset')).to.be.true;
  });
  
  it('should block requests over the limit', async () => {
    // Mock Redis to return count over the limit
    mockRedisClient.exec.callsArgWith(0, null, [
      null, // No error for SETEX
      null, // No error for TTL
      [101, 899] // [current count, TTL] - over the limit
    ]);
    
    await rateLimitMiddleware(req, res, next);
    
    // Should call next with an error
    expect(next.calledOnce).to.be.true;
    const error = next.firstCall.args[0];
    expect(error).to.be.an.instanceOf(AppError);
    expect(error.statusCode).to.equal(429);
    expect(error.message).to.include('Too many requests');
    
    // Should set Retry-After header
    expect(res.set.calledWith('Retry-After', '899')).to.be.true;
  });
  
  it('should handle different IPs separately', async () => {
    const req1 = createRequest('192.168.1.1');
    const req2 = createRequest('192.168.1.2');
    
    // First request from IP 1
    await rateLimitMiddleware(req1, res, next);
    expect(next.calledOnce).to.be.true;
    expect(res.set.calledWith('X-RateLimit-Remaining', '99')).to.be.true;
    
    // Reset next for the next test
    next.resetHistory();
    
    // First request from IP 2 should also have 99 remaining
    await rateLimitMiddleware(req2, res, next);
    expect(next.calledOnce).to.be.true;
    expect(res.set.calledWith('X-RateLimit-Remaining', '99')).to.be.true;
  });
  
  it('should handle Redis errors gracefully', async () => {
    // Mock Redis to return an error
    mockRedisClient.exec.callsArgWith(0, new Error('Redis connection error'));
    
    await rateLimitMiddleware(req, res, next);
    
    // Should still call next without error (fail open)
    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args).to.be.empty;
    
    // Should not set rate limit headers
    expect(res.set.called).to.be.false;
  });
  
  it('should respect the skip function', async () => {
    // Create a rate limiter with a skip function that skips for certain IPs
    const skipRateLimit = rateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 100,
      skip: (req) => req.ip === '192.168.1.100'
    });
    
    // Request from whitelisted IP
    const whitelistedReq = createRequest('192.168.1.100');
    await skipRateLimit(whitelistedReq, res, next);
    
    // Should call next without checking Redis
    expect(next.calledOnce).to.be.true;
    expect(mockRedisClient.multi.called).to.be.false;
    
    // Reset for next test
    next.resetHistory();
    
    // Request from non-whitelisted IP
    const normalReq = createRequest('192.168.1.101');
    await skipRateLimit(normalReq, res, next);
    
    // Should check Redis for non-whitelisted IP
    expect(next.calledOnce).to.be.true;
    expect(mockRedisClient.multi.called).to.be.true;
  });
  
  it('should use custom key generator', async () => {
    const customKeyRateLimit = rateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 100,
      keyGenerator: (req) => `${req.ip}:${req.headers['user-agent']}`
    });
    
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
    req.headers['user-agent'] = userAgent;
    
    await customKeyRateLimit(req, res, next);
    
    // Should call next without error
    expect(next.calledOnce).to.be.true;
    
    // Verify the key was generated correctly
    expect(mockRedisClient.multi.calledOnce).to.be.true;
    const multiCall = mockRedisClient.multi.firstCall;
    expect(multiCall.args[0][0]).to.equal('setex');
    expect(multiCall.args[0][1]).to.include(`:${userAgent}`);
  });
  
  it('should use custom handler when provided', async () => {
    const customHandler = sinon.stub();
    
    const customHandlerRateLimit = rateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 100,
      handler: customHandler
    });
    
    // Mock Redis to return count over the limit
    mockRedisClient.exec.callsArgWith(0, null, [
      null,
      null,
      [101, 899] // Over the limit
    ]);
    
    await customHandlerRateLimit(req, res, next);
    
    // Should call the custom handler
    expect(customHandler.calledOnce).to.be.true;
    expect(customHandler.firstCall.args[0]).to.equal(req);
    expect(customHandler.firstCall.args[1]).to.equal(res);
    expect(customHandler.firstCall.args[2]).to.be.a('function');
    expect(customHandler.firstCall.args[3]).to.be.an('object');
    expect(customHandler.firstCall.args[3].message).to.include('Too many requests');
  });
});
