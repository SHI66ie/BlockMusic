const { expect } = require('chai');
const sinon = require('sinon');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const nock = require('nock');

const app = require('../../app');
const NFT = require('../../models/NFT');
const { 
  connectDB, 
  closeDB, 
  clearDB, 
  generateMockNFT,
  generateAuthToken,
  generateMockFile
} = require('../testUtils');

// Mock middleware
const auth = require('../../middleware/auth');

// Test data
const mockNFT = generateMockNFT();
const mockUser = {
  _id: '5f8d0f3d9d5f3d2e3c6f8a1b',
  address: '0x0000000000000000000000000000000000000001',
  role: 'user'
};
const authToken = generateAuthToken(mockUser._id, mockUser.address, mockUser.role);

// Mock services
const nftService = require('../../services/nftService');

// Mock IPFS and blockchain responses
const mockIPFSResponse = {
  ipfsHash: 'QmTestHash',
  url: 'ipfs://test-hash'
};

const mockBlockchainResponse = {
  txHash: '0x123...',
  tokenId: 1
};

describe('NFT Controller', () => {
  before(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    // Clear database before each test
    await clearDB();
    
    // Reset all mocks
    sinon.restore();
    nock.cleanAll();
    
    // Mock auth middleware to inject test user
    sinon.stub(auth, 'protect').callsFake((req, res, next) => {
      req.user = mockUser;
      next();
    });
    
    // Mock rate limiting
    app.use((req, res, next) => {
      req.rateLimit = { remaining: 100 };
      next();
    });
  });

  after(async () => {
    await closeDB();
  });

  describe('GET /api/nfts', () => {
    it('should return all NFTs', async () => {
      // Create test NFTs
      const nfts = Array(5).fill().map((_, i) => ({
        ...mockNFT,
        tokenId: i + 1,
        owner: `0x000000000000000000000000000000000000000${i + 1}`,
        metadata: {
          ...mockNFT.metadata,
          name: `NFT #${i + 1}`
        }
      }));
      
      await NFT.insertMany(nfts);

      const res = await request(app)
        .get('/api/nfts')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array').with.lengthOf(5);
      expect(res.body).to.have.nested.property('pagination.total', 5);
    });

    it('should return paginated NFTs', async () => {
      // Create 15 test NFTs
      const nfts = Array(15).fill().map((_, i) => ({
        ...mockNFT,
        tokenId: i + 1,
        owner: `0x000000000000000000000000000000000000000${i % 5 + 1}`,
        metadata: {
          ...mockNFT.metadata,
          name: `NFT #${i + 1}`
        },
        createdAt: new Date(Date.now() - i * 1000 * 60) // Different creation times
      }));
      
      await NFT.insertMany(nfts);

      const res = await request(app)
        .get('/api/nfts?page=2&limit=5')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.data).to.be.an('array').with.lengthOf(5);
      expect(res.body).to.have.nested.property('pagination.total', 15);
      expect(res.body).to.have.nested.property('pagination.totalPages', 3);
      expect(res.body).to.have.nested.property('pagination.currentPage', 2);
      expect(res.body).to.have.nested.property('pagination.hasNext', true);
      expect(res.body).to.have.nested.property('pagination.hasPrev', true);
    });
  });

  describe('GET /api/nfts/:id', () => {
    it('should return a single NFT by ID', async () => {
      const nft = new NFT(mockNFT);
      await nft.save();

      const res = await request(app)
        .get(`/api/nfts/${nft._id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('object');
      expect(res.body.data).to.have.property('tokenId', mockNFT.tokenId);
      expect(res.body.data).to.have.property('owner', mockNFT.owner);
    });

    it('should return 404 for non-existent NFT', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .get(`/api/nfts/${nonExistentId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'NFT not found');
    });
  });

  describe('GET /api/nfts/owner/:owner', () => {
    const owner = '0x0000000000000000000000000000000000000001';
    
    beforeEach(async () => {
      // Create 3 NFTs for the test owner
      const nfts = Array(3).fill().map((_, i) => ({
        ...mockNFT,
        tokenId: i + 1,
        owner: owner,
        metadata: {
          ...mockNFT.metadata,
          name: `Owner NFT #${i + 1}`
        }
      }));
      
      await NFT.insertMany(nfts);
    });

    it('should return NFTs owned by a specific address', async () => {
      const res = await request(app)
        .get(`/api/nfts/owner/${owner}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array').with.lengthOf(3);
      
      // Verify all returned NFTs belong to the owner
      res.body.data.forEach(nft => {
        expect(nft.owner).to.equal(owner.toLowerCase());
      });
    });
  });

  describe('POST /api/nfts', () => {
    it('should create a new NFT', async () => {
      // Mock service responses
      sinon.stub(nftService, 'createNFT').resolves({
        ...mockNFT,
        _id: '5f8d0f3d9d5f3d2e3c6f8a1b',
        __v: 0
      });

      // Mock IPFS and blockchain calls
      nock('https://api.pinata.cloud')
        .post('/pinning/pinFileToIPFS')
        .reply(200, { IpfsHash: mockIPFSResponse.ipfsHash });
      
      nock('https://mainnet.infura.io')
        .post('/v3/your-infura-project-id')
        .reply(200, { result: '0x123...' });

      const nftData = {
        owner: mockUser.address,
        metadata: {
          name: 'Test NFT',
          description: 'A test NFT',
          attributes: [
            { trait_type: 'color', value: 'blue' }
          ]
        }
      };

      const res = await request(app)
        .post('/api/nfts')
        .set('Authorization', `Bearer ${authToken}`)
        .field('owner', nftData.owner)
        .field('metadata', JSON.stringify(nftData.metadata))
        .attach('file', Buffer.from('test file content'), 'test.jpg')
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('object');
      expect(res.body.data).to.have.property('owner', nftData.owner.toLowerCase());
      expect(res.body).to.have.property('message', 'NFT created successfully');
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/nfts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Validation failed');
      expect(res.body.errors).to.be.an('array');
    });
  });

  describe('PATCH /api/nfts/:id', () => {
    let nft;

    beforeEach(async () => {
      nft = new NFT(mockNFT);
      await nft.save();
    });

    it('should update an NFT', async () => {
      const updates = {
        metadata: {
          ...mockNFT.metadata,
          name: 'Updated NFT Name',
          description: 'Updated description'
        }
      };

      const res = await request(app)
        .patch(`/api/nfts/${nft._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data.metadata).to.deep.include(updates.metadata);
    });

    it('should return 404 for non-existent NFT', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .patch(`/api/nfts/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ metadata: { name: 'Updated' } })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'NFT not found');
    });
  });

  describe('DELETE /api/nfts/:id', () => {
    let nft;

    beforeEach(async () => {
      nft = new NFT(mockNFT);
      await nft.save();
    });

    it('should delete an NFT', async () => {
      const res = await request(app)
        .delete(`/api/nfts/${nft._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message', 'NFT deleted successfully');
      
      // Verify the NFT is deleted
      const deletedNFT = await NFT.findById(nft._id);
      expect(deletedNFT).to.be.null;
    });
  });
});
