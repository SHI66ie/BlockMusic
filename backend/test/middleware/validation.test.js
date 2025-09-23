const { expect } = require('chai');
const sinon = require('sinon');
const { validationResult } = require('express-validator');
const { validate, commonRules } = require('../../validations');
const { validationError } = require('../../utils/apiResponse');

// Helper to create a request object with the given data
const createRequest = (data = {}) => ({
  body: {},
  params: {},
  query: {},
  ...data
});

// Helper to create a response object
const createResponse = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

// Helper to create a next function
const createNext = () => sinon.stub();

describe('Validation Middleware', () => {
  describe('Common Validation Rules', () => {
    describe('Ethereum Address', () => {
      it('should validate a valid Ethereum address', async () => {
        const req = createRequest({
          body: {
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
          }
        });
        
        const rule = commonRules.ethereumAddress('address');
        await rule(req, {}, () => {});
        
        const errors = validationResult(req);
        expect(errors.isEmpty()).to.be.true;
      });

      it('should invalidate an invalid Ethereum address', async () => {
        const req = createRequest({
          body: {
            address: '0xinvalid'
          }
        });
        
        const rule = commonRules.ethereumAddress('address');
        await rule(req, {}, () => {});
        
        const errors = validationResult(req);
        expect(errors.isEmpty()).to.be.false;
        expect(errors.array()).to.have.lengthOf(1);
        expect(errors.array()[0].msg).to.equal('Invalid Ethereum address');
      });

      it('should convert address to lowercase', async () => {
        const req = createRequest({
          body: {
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
          }
        });
        
        const rule = commonRules.ethereumAddress('address');
        await rule(req, {}, () => {});
        
        expect(req.body.address).to.equal('0x742d35cc6634c0532925a3b844bc454e4438f44e');
      });
    });

    describe('Pagination', () => {
      it('should validate valid pagination parameters', async () => {
        const req = createRequest({
          query: {
            page: '2',
            limit: '10',
            sort: '-createdAt'
          }
        });
        
        for (const rule of commonRules.pagination) {
          await rule(req, {}, () => {});
        }
        
        const errors = validationResult(req);
        expect(errors.isEmpty()).to.be.true;
        expect(req.query.page).to.equal(2);
        expect(req.query.limit).to.equal(10);
        expect(req.query.sort).to.equal('-createdAt');
      });

      it('should handle missing optional parameters', async () => {
        const req = createRequest({ query: {} });
        
        for (const rule of commonRules.pagination) {
          await rule(req, {}, () => {});
        }
        
        const errors = validationResult(req);
        expect(errors.isEmpty()).to.be.true;
      });

      it('should validate page as a positive integer', async () => {
        const req = createRequest({
          query: {
            page: '0',
            limit: '10'
          }
        });
        
        const rule = commonRules.pagination[0]; // page validation rule
        await rule(req, {}, () => {});
        
        const errors = validationResult(req);
        expect(errors.isEmpty()).to.be.false;
        expect(errors.array()[0].msg).to.equal('Page must be a positive integer');
      });

      it('should validate limit range', async () => {
        const req = createRequest({
          query: {
            page: '1',
            limit: '101'
          }
        });
        
        const rule = commonRules.pagination[1]; // limit validation rule
        await rule(req, {}, () => {});
        
        const errors = validationResult(req);
        expect(errors.isEmpty()).to.be.false;
        expect(errors.array()[0].msg).to.equal('Limit must be between 1 and 100');
      });
    });

    describe('Password', () => {
      it('should validate a strong password', async () => {
        const req = createRequest({
          body: {
            password: 'Str0ngP@ssword!'
          }
        });
        
        const rule = commonRules.password('password');
        await rule(req, {}, () => {});
        
        const errors = validationResult(req);
        expect(errors.isEmpty()).to.be.true;
      });

      it('should invalidate a weak password', async () => {
        const req = createRequest({
          body: {
            password: 'weak'
          }
        });
        
        const rule = commonRules.password('password');
        await rule(req, {}, () => {});
        
        const errors = validationResult(req);
        expect(errors.isEmpty()).to.be.false;
        expect(errors.array()).to.have.lengthOf(4); // 4 different validations failed
      });
    });

    describe('Username', () => {
      it('should validate a valid username', async () => {
        const req = createRequest({
          body: {
            username: 'user_123'
          }
        });
        
        const rule = commonRules.username('username');
        await rule(req, {}, () => {});
        
        const errors = validationResult(req);
        expect(errors.isEmpty()).to.be.true;
      });

      it('should invalidate a username with invalid characters', async () => {
        const req = createRequest({
          body: {
            username: 'user@name'
          }
        });
        
        const rule = commonRules.username('username');
        await rule(req, {}, () => {});
        
        const errors = validationResult(req);
        expect(errors.isEmpty()).to.be.false;
        expect(errors.array()[0].msg).to.include('can only contain letters, numbers, and underscores');
      });
    });
  });

  describe('Validate Middleware', () => {
    it('should call next() when validation passes', async () => {
      const req = createRequest({
        body: {
          email: 'test@example.com',
          password: 'Str0ngP@ssword!'
        }
      });
      
      const res = createResponse();
      const next = createNext();
      
      const validationRules = [
        body('email').isEmail().withMessage('Invalid email'),
        body('password').isLength({ min: 8 }).withMessage('Password too short')
      ];
      
      await validate(validationRules)(req, res, next);
      
      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
      expect(res.json.called).to.be.false;
    });

    it('should return 422 with validation errors when validation fails', async () => {
      const req = createRequest({
        body: {
          email: 'invalid-email',
          password: 'short'
        }
      });
      
      const res = createResponse();
      const next = createNext();
      
      const validationRules = [
        body('email').isEmail().withMessage('Invalid email'),
        body('password').isLength({ min: 8 }).withMessage('Password too short')
      ];
      
      await validate(validationRules)(req, res, next);
      
      expect(next.called).to.be.false;
      expect(res.status.calledWith(422)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseBody = res.json.firstCall.args[0];
      expect(responseBody).to.have.property('success', false);
      expect(responseBody).to.have.property('message', 'Validation failed');
      expect(responseBody).to.have.property('errors').that.is.an('array');
      expect(responseBody.errors).to.have.lengthOf(2);
    });
  });
});
