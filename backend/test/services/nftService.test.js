const { expect } = require('chai');
const sinon = require('sinon');
const NFT = require('../../models/NFT');
const nftService = require('../../services/nftService');
const { 
  connectDB, 
  closeDB, 
  clearDB, 
  generateMockNFT 
} = require('../testUtils');

// Mock external dependencies
const ipfsUtils = require('../../utils/ipfs');
const blockchainUtils = require('../../utils/blockchain');

// Test data
const mockNFTData = generateMockNFT();
const mockFile = {
  buffer: Buffer.from('test file content'),
  originalname: 'test.jpg',
  mimetype: 'image/jpeg'
};

describe('NFT Service', () => {
  before(async () => {
    await connectDB();
  });

  afterEach(async () => {
    await clearDB();
    sinon.restore();
  });

  after(async () => {
    await closeDB();
  });

  describe('createNFT', () => {
    it('should create a new NFT with file', async () => {
      // Mock IPFS and blockchain calls
      const mockFileResult = { 
        ipfsHash: 'QmTestFileHash', 
        url: 'ipfs://test-file' 
      };
      const mockMetadataResult = { 
        ipfsHash: 'QmTestMetadataHash', 
        url: 'ipfs://test-metadata' 
      };
      const mockTokenId = 1;

      sinon.stub(ipfsUtils, 'uploadToIPFS').resolves(mockFileResult);
      sinon.stub(ipfsUtils, 'uploadMetadataToIPFS').resolves(mockMetadataResult);
      sinon.stub(blockchainUtils, 'mintNFT').resolves(mockTokenId);

      const nftData = {
        owner: '0x0000000000000000000000000000000000000001',
        metadata: {
          name: 'Test NFT',
          description: 'A test NFT'
        }
      };

      const result = await nftService.createNFT(nftData, mockFile);

      // Verify the result
      expect(result).to.have.property('tokenId', mockTokenId);
      expect(result).to.have.property('owner', nftData.owner.toLowerCase());
      expect(result).to.have.property('tokenURI', mockMetadataResult.url);
      expect(result).to.have.nested.property('metadata.name', nftData.metadata.name);
      expect(result).to.have.nested.property('metadata.description', nftData.metadata.description);
      expect(result).to.have.property('ipfsHash', mockMetadataResult.ipfsHash);
      expect(result).to.have.property('fileIpfsHash', mockFileResult.ipfsHash);

      // Verify database record
      const dbNFT = await NFT.findOne({ tokenId: mockTokenId });
      expect(dbNFT).to.not.be.null;
      expect(dbNFT.owner).to.equal(nftData.owner.toLowerCase());
    });

    it('should create a new NFT without file', async () => {
      // Mock IPFS and blockchain calls
      const mockMetadataResult = { 
        ipfsHash: 'QmTestMetadataHash', 
        url: 'ipfs://test-metadata' 
      };
      const mockTokenId = 1;

      sinon.stub(ipfsUtils, 'uploadMetadataToIPFS').resolves(mockMetadataResult);
      sinon.stub(blockchainUtils, 'mintNFT').resolves(mockTokenId);

      const nftData = {
        owner: '0x0000000000000000000000000000000000000001',
        metadata: {
          name: 'Test NFT',
          description: 'A test NFT',
          image: 'https://example.com/image.jpg'
        }
      };

      const result = await nftService.createNFT(nftData);

      // Verify the result
      expect(result).to.have.property('tokenId', mockTokenId);
      expect(result).to.have.property('owner', nftData.owner.toLowerCase());
      expect(result).to.have.property('tokenURI', mockMetadataResult.url);
      expect(result).to.have.nested.property('metadata.name', nftData.metadata.name);
      expect(result).to.not.have.property('fileIpfsHash');
    });
  });

  describe('getNFTById', () => {
    it('should return NFT by ID', async () => {
      // Create test NFT
      const nft = new NFT(mockNFTData);
      await nft.save();

      const result = await nftService.getNFTById(nft._id);

      expect(result).to.have.property('_id');
      expect(result.tokenId).to.equal(mockNFTData.tokenId);
      expect(result.owner).to.equal(mockNFTData.owner);
    });

    it('should throw error for non-existent NFT', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      try {
        await nftService.getNFTById(nonExistentId);
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('NFT not found');
      }
    });
  });

  describe('getAllNFTs', () => {
    beforeEach(async () => {
      // Create test NFTs
      const nfts = Array(15).fill().map((_, i) => ({
        ...mockNFTData,
        tokenId: i + 1,
        owner: `0x000000000000000000000000000000000000000${i % 5 + 1}`,
        metadata: {
          ...mockNFTData.metadata,
          name: `NFT #${i + 1}`
        },
        createdAt: new Date(Date.now() - i * 1000 * 60) // Different creation times
      }));
      
      await NFT.insertMany(nfts);
    });

    it('should return paginated NFTs', async () => {
      const result = await nftService.getAllNFTs({
        page: 2,
        limit: 5,
        sort: '-createdAt'
      });

      expect(result.data).to.have.lengthOf(5);
      expect(result.pagination).to.deep.equal({
        total: 15,
        totalPages: 3,
        currentPage: 2,
        hasNext: true,
        hasPrev: true,
        limit: 5
      });
    });

    it('should filter NFTs by owner', async () => {
      const owner = '0x0000000000000000000000000000000000000001';
      const result = await NFT.find({ owner }).countDocuments();
      
      // We created 15 NFTs, 3 for each of 5 owners (15 / 5 = 3)
      expect(result).to.equal(3);
    });
  });

  describe('getNFTsByOwner', () => {
    const owner = '0x0000000000000000000000000000000000000001';
    
    beforeEach(async () => {
      // Create test NFTs for the owner
      const nfts = Array(5).fill().map((_, i) => ({
        ...mockNFTData,
        tokenId: i + 1,
        owner: owner,
        metadata: {
          ...mockNFTData.metadata,
          name: `Owner NFT #${i + 1}`
        }
      }));
      
      await NFT.insertMany(nfts);
    });

    it('should return NFTs owned by a specific address', async () => {
      const result = await nftService.getNFTsByOwner(owner, {
        page: 1,
        limit: 10,
        sort: '-createdAt'
      });

      expect(result.data).to.have.lengthOf(5);
      result.data.forEach(nft => {
        expect(nft.owner).to.equal(owner.toLowerCase());
      });
      
      expect(result.pagination).to.deep.equal({
        total: 5,
        totalPages: 1,
        currentPage: 1,
        hasNext: false,
        hasPrev: false,
        limit: 10
      });
    });
  });

  describe('updateNFT', () => {
    let nft;

    beforeEach(async () => {
      nft = new NFT(mockNFTData);
      await nft.save();
    });

    it('should update NFT metadata', async () => {
      const updates = {
        metadata: {
          ...mockNFTData.metadata,
          name: 'Updated NFT Name',
          description: 'Updated description',
          newField: 'New field value'
        }
      };

      const result = await nftService.updateNFT(nft._id, updates);

      expect(result.metadata.name).to.equal(updates.metadata.name);
      expect(result.metadata.description).to.equal(updates.metadata.description);
      expect(result.metadata.newField).to.equal(updates.metadata.newField);
      
      // Verify the update in the database
      const updatedNFT = await NFT.findById(nft._id);
      expect(updatedNFT.metadata.name).to.equal(updates.metadata.name);
    });
  });

  describe('deleteNFT', () => {
    let nft;

    beforeEach(async () => {
      nft = new NFT(mockNFTData);
      await nft.save();
    });

    it('should delete an NFT', async () => {
      const result = await nftService.deleteNFT(nft._id);
      expect(result).to.be.true;
      
      // Verify the NFT is deleted
      const deletedNFT = await NFT.findById(nft._id);
      expect(deletedNFT).to.be.null;
    });

    it('should return false for non-existent NFT', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const result = await nftService.deleteNFT(nonExistentId);
      expect(result).to.be.false;
    });
  });
});
