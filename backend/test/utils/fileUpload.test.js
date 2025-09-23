const { expect } = require('chai');
const sinon = require('sinon');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { fileFilter, storage, upload } = require('../../utils/fileUpload');
const { AppError } = require('../../utils/errors');

// Mock file data
const createMockFile = (filename, mimetype, size) => ({
  fieldname: 'file',
  originalname: filename,
  encoding: '7bit',
  mimetype,
  buffer: Buffer.from('test file content'),
  size
});

describe('File Upload Utility', () => {
  describe('File Filter', () => {
    it('should accept valid file types', () => {
      const cb = sinon.stub();
      const req = {};
      const file = {
        mimetype: 'image/jpeg',
        originalname: 'test.jpg'
      };
      
      fileFilter(req, file, cb);
      
      expect(cb.calledOnce).to.be.true;
      expect(cb.firstCall.args[0]).to.be.null;
      expect(cb.firstCall.args[1]).to.be.true;
    });
    
    it('should reject invalid file types', () => {
      const cb = sinon.stub();
      const req = {};
      const file = {
        mimetype: 'application/octet-stream',
        originalname: 'test.exe'
      };
      
      fileFilter(req, file, cb);
      
      expect(cb.calledOnce).to.be.true;
      expect(cb.firstCall.args[0]).to.be.an.instanceOf(AppError);
      expect(cb.firstCall.args[0].message).to.equal('Invalid file type. Only images, audio, and video are allowed.');
      expect(cb.firstCall.args[1]).to.be.false;
    });
    
    it('should accept audio files', () => {
      const cb = sinon.stub();
      const req = {};
      const file = {
        mimetype: 'audio/mpeg',
        originalname: 'test.mp3'
      };
      
      fileFilter(req, file, cb);
      
      expect(cb.calledOnce).to.be.true;
      expect(cb.firstCall.args[0]).to.be.null;
      expect(cb.firstCall.args[1]).to.be.true;
    });
    
    it('should accept video files', () => {
      const cb = sinon.stub();
      const req = {};
      const file = {
        mimetype: 'video/mp4',
        originalname: 'test.mp4'
      };
      
      fileFilter(req, file, cb);
      
      expect(cb.calledOnce).to.be.true;
      expect(cb.firstCall.args[0]).to.be.null;
      expect(cb.firstCall.args[1]).to.be.true;
    });
  });
  
  describe('Storage Configuration', () => {
    it('should generate a filename with a timestamp and original extension', () => {
      const req = {};
      const file = {
        originalname: 'test.jpg'
      };
      const cb = sinon.stub();
      
      storage._filename(req, file, cb);
      
      expect(cb.calledOnce).to.be.true;
      const filename = cb.firstCall.args[1];
      expect(filename).to.match(/^nft-\d+-\w+\.jpg$/);
    });
    
    it('should use the destination from configuration', () => {
      const req = {};
      const file = {};
      const cb = sinon.stub();
      
      storage._destination(req, file, cb);
      
      expect(cb.calledOnce).to.be.true;
      expect(cb.firstCall.args[0]).to.be.null;
      expect(cb.firstCall.args[1]).to.equal('uploads/');
    });
  });
  
  describe('Upload Middleware', () => {
    let mockMulter, uploadSingle, req, res, next;
    
    beforeEach(() => {
      // Reset mocks
      sinon.resetHistory();
      
      // Create fresh request, response, and next function for each test
      req = {
        file: null,
        files: null
      };
      res = {};
      next = sinon.stub();
      
      // Mock multer
      mockMulter = {
        single: sinon.stub().returns(sinon.stub().callsFake((req, res, cb) => {
          cb(null);
        })),
        array: sinon.stub().returns(sinon.stub().callsFake((req, res, cb) => {
          cb(null);
 })),
        fields: sinon.stub().returns(sinon.stub().callsFake((req, res, cb) => {
          cb(null);
        })),
        any: sinon.stub().returns(sinon.stub().callsFake((req, res, cb) => {
          cb(null);
        }))
      };
      
      // Stub multer to return our mock
      sinon.stub(multer, 'create').returns(mockMulter);
      
      // Get a fresh instance of the upload middleware
      uploadSingle = upload.single('file');
    });
    
    afterEach(() => {
      sinon.restore();
    });
    
    it('should create a multer instance with the correct configuration', () => {
      // The upload function should have been called with the correct config
      expect(multer.create.calledOnce).to.be.true;
      const config = multer.create.firstCall.args[0];
      
      expect(config).to.have.property('storage');
      expect(config).to.have.property('fileFilter');
      expect(config).to.have.property('limits');
      expect(config.limits.fileSize).to.equal(50 * 1024 * 1024); // 50MB
    });
    
    it('should handle single file upload', (done) => {
      const testFile = createMockFile('test.jpg', 'image/jpeg', 1024);
      req.file = testFile;
      
      uploadSingle(req, res, (err) => {
        expect(err).to.be.undefined;
        expect(mockMulter.single.calledWith('file')).to.be.true;
        done();
      });
    });
    
    it('should handle array of files', (done) => {
      const uploadArray = upload.array('images', 3);
      
      uploadArray(req, res, (err) => {
        expect(err).to.be.undefined;
        expect(mockMulter.array.calledWith('images', 3)).to.be.true;
        done();
      });
    });
    
    it('should handle multiple fields', (done) => {
      const fields = [
        { name: 'image', maxCount: 1 },
        { name: 'audio', maxCount: 1 }
      ];
      const uploadFields = upload.fields(fields);
      
      uploadFields(req, res, (err) => {
        expect(err).to.be.undefined;
        expect(mockMulter.fields.calledWith(fields)).to.be.true;
        done();
      });
    });
    
    it('should handle any files', (done) => {
      const uploadAny = upload.any();
      
      uploadAny(req, res, (err) => {
        expect(err).to.be.undefined;
        expect(mockMulter.any.called).to.be.true;
        done();
      });
    });
    
    it('should handle file size limit exceeded', (done) => {
      // Simulate a file size limit error
      const error = new Error('File too large');
      error.code = 'LIMIT_FILE_SIZE';
      
      // Override the mock to call the callback with an error
      mockMulter.single().callsFake((req, res, cb) => {
        cb(error);
      });
      
      uploadSingle(req, res, (err) => {
        expect(err).to.be.an.instanceOf(AppError);
        expect(err.statusCode).to.equal(400);
        expect(err.message).to.equal('File size too large. Maximum size is 50MB.');
        done();
      });
    });
    
    it('should handle unsupported file type', (done) => {
      // Simulate a file filter error
      const error = new Error('Unsupported file type');
      error.code = 'LIMIT_FILE_TYPE';
      
      // Override the mock to call the callback with an error
      mockMulter.single().callsFake((req, res, cb) => {
        cb(error);
      });
      
      uploadSingle(req, res, (err) => {
        expect(err).to.be.an.instanceOf(AppError);
        expect(err.statusCode).to.equal(400);
        expect(err.message).to.equal('Unsupported file type');
        done();
      });
    });
    
    it('should handle other multer errors', (done) => {
      // Simulate some other multer error
      const error = new Error('Some multer error');
      
      // Override the mock to call the callback with an error
      mockMulter.single().callsFake((req, res, cb) => {
        cb(error);
      });
      
      uploadSingle(req, res, (err) => {
        expect(err).to.be.an.instanceOf(AppError);
        expect(err.statusCode).to.equal(400);
        expect(err.message).to.equal('Error uploading file');
        done();
      });
    });
  });
});
