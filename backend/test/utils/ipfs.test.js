const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const { uploadToIPFS, uploadMetadataToIPFS, getFromIPFS } = require('../../utils/ipfs');
const { AppError } = require('../../utils/errors');

// Mock the axios module
sinon.stub(axios, 'post');

// Mock the FormData
const mockFormData = {
  append: sinon.stub(),
  getHeaders: sinon.stub().returns({ 'content-type': 'multipart/form-data' })
};

// Mock the fs module
sinon.stub(fs, 'createReadStream').returns('file-stream');

// Mock the FormData constructor
const originalFormData = FormData;
sinon.stub(global, 'FormData').callsFake(() => mockFormData);

// Mock the Pinata SDK
const mockPinata = {
  pinFileToIPFS: sinon.stub(),
  pinJSONToIPFS: sinon.stub()
};

// Mock the Pinata SDK
jest.mock('@pinata/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    pinFileToIPFS: mockPinata.pinFileToIPFS,
    pinJSONToIPFS: mockPinata.pinJSONToIPFS
  }));
});

describe('IPFS Utils', () => {
  const testBuffer = Buffer.from('test content');
  const testFilename = 'test.txt';
  const testMetadata = { name: 'Test NFT', description: 'A test NFT' };
  const testIpfsHash = 'QmTestHash';
  const testIpfsUrl = `ipfs://${testIpfsHash}`;
  
  beforeEach(() => {
    // Reset all mocks before each test
    sinon.resetHistory();
    
    // Configure default mock responses
    mockPinata.pinFileToIPFS.resolves({ IpfsHash: testIpfsHash });
    mockPinata.pinJSONToIPFS.resolves({ IpfsHash: testIpfsHash });
  });
  
  afterEach(() => {
    // Restore all stubs after each test
    sinon.restore();
  });
  
  describe('uploadToIPFS', () => {
    it('should upload a file to IPFS using Pinata', async () => {
      const options = { pinataMetadata: { name: testFilename } };
      
      const result = await uploadToIPFS(testBuffer, testFilename, options);
      
      // Verify Pinata was called with the correct parameters
      expect(mockPinata.pinFileToIPFS.calledOnce).to.be.true;
      const [readableStream, pinataOptions] = mockPinata.pinFileToIPFS.firstCall.args;
      
      expect(readableStream).to.equal(testBuffer);
      expect(pinataOptions).to.deep.include({
        pinataMetadata: { name: testFilename }
      });
      
      // Verify the result
      expect(result).to.deep.equal({
        success: true,
        ipfsHash: testIpfsHash,
        url: `ipfs://${testIpfsHash}`,
        gatewayUrl: `https://ipfs.io/ipfs/${testIpfsHash}`
      });
    });
    
    it('should handle errors during file upload', async () => {
      const error = new Error('Failed to upload to IPFS');
      mockPinata.pinFileToIPFS.rejects(error);
      
      try {
        await uploadToIPFS(testBuffer, testFilename);
        throw new Error('Should have thrown an error');
      } catch (err) {
        expect(err).to.be.an.instanceOf(AppError);
        expect(err.statusCode).to.equal(500);
        expect(err.message).to.equal('Failed to upload file to IPFS');
        expect(err.isOperational).to.be.true;
      }
    });
    
    it('should include custom metadata in the request', async () => {
      const customMetadata = {
        name: 'custom-name',
        keyvalues: {
          customKey: 'customValue'
        }
      };
      
      await uploadToIPFS(testBuffer, testFilename, {
        pinataMetadata: customMetadata
      });
      
      const [_, pinataOptions] = mockPinata.pinFileToIPFS.firstCall.args;
      expect(pinataOptions).to.have.property('pinataMetadata');
      expect(pinataOptions.pinataMetadata).to.include(customMetadata);
    });
  });
  
  describe('uploadMetadataToIPFS', () => {
    it('should upload JSON metadata to IPFS using Pinata', async () => {
      const options = { name: 'test-metadata' };
      
      const result = await uploadMetadataToIPFS(testMetadata, options);
      
      // Verify Pinata was called with the correct parameters
      expect(mockPinata.pinJSONToIPFS.calledOnce).to.be.true;
      const [metadata, pinataOptions] = mockPinata.pinJSONToIPFS.firstCall.args;
      
      expect(metadata).to.deep.equal(testMetadata);
      expect(pinataOptions).to.deep.include({
        pinataMetadata: { name: 'test-metadata' }
      });
      
      // Verify the result
      expect(result).to.deep.equal({
        success: true,
        ipfsHash: testIpfsHash,
        url: `ipfs://${testIpfsHash}`,
        gatewayUrl: `https://ipfs.io/ipfs/${testIpfsHash}`
      });
    });
    
    it('should handle errors during metadata upload', async () => {
      const error = new Error('Failed to upload metadata to IPFS');
      mockPinata.pinJSONToIPFS.rejects(error);
      
      try {
        await uploadMetadataToIPFS(testMetadata);
        throw new Error('Should have thrown an error');
      } catch (err) {
        expect(err).to.be.an.instanceOf(AppError);
        expect(err.statusCode).to.equal(500);
        expect(err.message).to.equal('Failed to upload metadata to IPFS');
        expect(err.isOperational).to.be.true;
      }
    });
    
    it('should include custom pinata options', async () => {
      const customOptions = {
        name: 'custom-metadata',
        keyvalues: {
          customKey: 'customValue'
        }
      };
      
      await uploadMetadataToIPFS(testMetadata, customOptions);
      
      const [_, pinataOptions] = mockPinata.pinJSONToIPFS.firstCall.args;
      expect(pinataOptions).to.have.property('pinataMetadata');
      expect(pinataOptions.pinataMetadata).to.include({
        name: 'custom-metadata',
        keyvalues: {
          customKey: 'customValue'
        }
      });
    });
  });
  
  describe('getFromIPFS', () => {
    const mockAxiosGet = sinon.stub(axios, 'get');
    
    afterEach(() => {
      mockAxiosGet.reset();
    });
    
    it('should fetch data from IPFS using a public gateway', async () => {
      const testData = { name: 'Test Data' };
      mockAxiosGet.resolves({ data: testData });
      
      const result = await getFromIPFS(testIpfsHash);
      
      // Verify axios was called with the correct URL
      expect(mockAxiosGet.calledOnce).to.be.true;
      const [url] = mockAxiosGet.firstCall.args;
      expect(url).to.equal(`https://ipfs.io/ipfs/${testIpfsHash}`);
      
      // Verify the result
      expect(result).to.deep.equal(testData);
    });
    
    it('should use a custom IPFS gateway if provided', async () => {
      const customGateway = 'https://custom-ipfs-gateway.com/ipfs/';
      const testData = { name: 'Test Data' };
      mockAxiosGet.resolves({ data: testData });
      
      await getFromIPFS(testIpfsHash, customGateway);
      
      // Verify axios was called with the custom gateway URL
      expect(mockAxiosGet.calledOnce).to.be.true;
      const [url] = mockAxiosGet.firstCall.args;
      expect(url).to.equal(`${customGateway}${testIpfsHash}`);
    });
    
    it('should handle errors when fetching from IPFS', async () => {
      const error = new Error('Failed to fetch from IPFS');
      mockAxiosGet.rejects(error);
      
      try {
        await getFromIPFS(testIpfsHash);
        throw new Error('Should have thrown an error');
      } catch (err) {
        expect(err).to.be.an.instanceOf(AppError);
        expect(err.statusCode).to.equal(500);
        expect(err.message).to.equal('Failed to fetch data from IPFS');
        expect(err.isOperational).to.be.true;
      }
    });
  });
});
