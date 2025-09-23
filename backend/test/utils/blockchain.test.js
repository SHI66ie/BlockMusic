const { expect } = require('chai');
const sinon = require('sinon');
const { ethers } = require('ethers');
const {
  getProvider,
  getSigner,
  getContract,
  mintNFT,
  getTokenURI,
  getTokenOwner,
  getContractWithSigner,
  getTokenMetadata
} = require('../../utils/blockchain');
const { AppError } = require('../../utils/errors');

// Mock the ethers providers and contracts
const mockProvider = {
  getNetwork: sinon.stub(),
  getSigner: sinon.stub()
};

const mockSigner = {
  getAddress: sinon.stub(),
  provider: {}
};

const mockContract = {
  mint: sinon.stub(),
  tokenURI: sinon.stub(),
  ownerOf: sinon.stub(),
  tokenMetadata: sinon.stub()
};

// Mock the ethers module
sinon.stub(ethers.providers, 'JsonRpcProvider').returns(mockProvider);
sinon.stub(ethers, 'Contract').returns(mockContract);

// Mock the environment variables
process.env.BLOCKCHAIN_RPC_URL = 'https://testnet.example.com';
process.env.CONTRACT_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
process.env.PRIVATE_KEY = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

describe('Blockchain Utils', () => {
  const testTokenId = 1;
  const testTokenURI = 'ipfs://test-uri';
  const testOwner = '0x1234567890123456789012345678901234567890';
  const testMetadata = { name: 'Test NFT', description: 'A test NFT' };
  
  beforeEach(() => {
    // Reset all mocks before each test
    sinon.resetHistory();
    
    // Configure default mock responses
    mockProvider.getNetwork.resolves({ chainId: 5 }); // Goerli testnet
    mockProvider.getSigner.returns(mockSigner);
    mockSigner.getAddress.resolves(testOwner);
    
    // Mock contract methods
    mockContract.mint.resolves({
      wait: sinon.stub().resolves({
        events: [
          { event: 'Transfer', args: { tokenId: testTokenId } }
        ]
      })
    });
    
    mockContract.tokenURI.withArgs(testTokenId).resolves(testTokenURI);
    mockContract.ownerOf.withArgs(testTokenId).resolves(testOwner);
    mockContract.tokenMetadata.withArgs(testTokenId).resolves(JSON.stringify(testMetadata));
  });
  
  afterEach(() => {
    // Restore all stubs after each test
    sinon.restore();
  });
  
  describe('getProvider', () => {
    it('should return a provider with the configured RPC URL', () => {
      const provider = getProvider();
      
      expect(ethers.providers.JsonRpcProvider.calledOnce).to.be.true;
      expect(ethers.providers.JsonRpcProvider.firstCall.args[0]).to.equal(process.env.BLOCKCHAIN_RPC_URL);
      expect(provider).to.equal(mockProvider);
    });
    
    it('should return the same provider instance on subsequent calls', () => {
      const provider1 = getProvider();
      const provider2 = getProvider();
      
      expect(provider1).to.equal(provider2);
      expect(ethers.providers.JsonRpcProvider.calledOnce).to.be.true;
    });
  });
  
  describe('getSigner', () => {
    it('should return a signer with the configured private key', async () => {
      const signer = await getSigner();
      
      expect(mockProvider.getSigner.calledOnce).to.be.true;
      expect(signer).to.equal(mockSigner);
    });
    
    it('should return the same signer instance on subsequent calls', async () => {
      const signer1 = await getSigner();
      const signer2 = await getSigner();
      
      expect(signer1).to.equal(signer2);
      expect(mockProvider.getSigner.calledOnce).to.be.true;
    });
  });
  
  describe('getContract', () => {
    it('should return a contract instance with the configured address', async () => {
      const contract = await getContract();
      
      expect(ethers.Contract.calledOnce).to.be.true;
      expect(ethers.Contract.firstCall.args[0]).to.equal(process.env.CONTRACT_ADDRESS);
      expect(ethers.Contract.firstCall.args[1]).to.be.an('object'); // ABI
      expect(contract).to.equal(mockContract);
    });
    
    it('should return the same contract instance on subsequent calls', async () => {
      const contract1 = await getContract();
      const contract2 = await getContract();
      
      expect(contract1).to.equal(contract2);
      expect(ethers.Contract.calledOnce).to.be.true;
    });
  });
  
  describe('getContractWithSigner', () => {
    it('should return a contract instance connected to a signer', async () => {
      const contract = await getContractWithSigner();
      
      expect(ethers.Contract.calledOnce).to.be.true;
      expect(ethers.Contract.firstCall.args[0]).to.equal(process.env.CONTRACT_ADDRESS);
      expect(ethers.Contract.firstCall.args[1]).to.be.an('object'); // ABI
      expect(contract.signer).to.equal(mockSigner);
    });
  });
  
  describe('mintNFT', () => {
    const toAddress = '0x9876543210abcdef1234567890abcdef12345678';
    const tokenURI = 'ipfs://test-uri';
    
    it('should mint a new NFT and return the token ID', async () => {
      const tokenId = await mintNFT(toAddress, tokenURI);
      
      expect(mockContract.mint.calledOnce).to.be.true;
      expect(mockContract.mint.firstCall.args[0]).to.equal(toAddress);
      expect(mockContract.mint.firstCall.args[1]).to.equal(tokenURI);
      expect(tokenId).to.equal(testTokenId);
    });
    
    it('should handle errors during minting', async () => {
      const error = new Error('Transaction reverted');
      mockContract.mint.rejects(error);
      
      try {
        await mintNFT(toAddress, tokenURI);
        throw new Error('Should have thrown an error');
      } catch (err) {
        expect(err).to.be.an.instanceOf(AppError);
        expect(err.statusCode).to.equal(500);
        expect(err.message).to.equal('Failed to mint NFT');
        expect(err.isOperational).to.be.true;
      }
    });
  });
  
  describe('getTokenURI', () => {
    it('should return the token URI for a given token ID', async () => {
      const uri = await getTokenURI(testTokenId);
      
      expect(mockContract.tokenURI.calledWith(testTokenId)).to.be.true;
      expect(uri).to.equal(testTokenURI);
    });
    
    it('should handle errors when fetching token URI', async () => {
      const error = new Error('Token does not exist');
      mockContract.tokenURI.withArgs(testTokenId).rejects(error);
      
      try {
        await getTokenURI(testTokenId);
        throw new Error('Should have thrown an error');
      } catch (err) {
        expect(err).to.be.an.instanceOf(AppError);
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.equal('Token not found');
        expect(err.isOperational).to.be.true;
      }
    });
  });
  
  describe('getTokenOwner', () => {
    it('should return the owner of a token', async () => {
      const owner = await getTokenOwner(testTokenId);
      
      expect(mockContract.ownerOf.calledWith(testTokenId)).to.be.true;
      expect(owner).to.equal(testOwner);
    });
    
    it('should handle errors when fetching token owner', async () => {
      const error = new Error('Token does not exist');
      mockContract.ownerOf.withArgs(testTokenId).rejects(error);
      
      try {
        await getTokenOwner(testTokenId);
        throw new Error('Should have thrown an error');
      } catch (err) {
        expect(err).to.be.an.instanceOf(AppError);
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.equal('Token not found');
        expect(err.isOperational).to.be.true;
      }
    });
  });
  
  describe('getTokenMetadata', () => {
    it('should return the metadata for a token', async () => {
      const metadata = await getTokenMetadata(testTokenId);
      
      expect(mockContract.tokenURI.calledWith(testTokenId)).to.be.true;
      expect(metadata).to.deep.equal(testMetadata);
    });
    
    it('should handle errors when fetching token metadata', async () => {
      const error = new Error('Token does not exist');
      mockContract.tokenURI.withArgs(testTokenId).rejects(error);
      
      try {
        await getTokenMetadata(testTokenId);
        throw new Error('Should have thrown an error');
      } catch (err) {
        expect(err).to.be.an.instanceOf(AppError);
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.equal('Token not found');
        expect(err.isOperational).to.be.true;
      }
    });
  });
});
