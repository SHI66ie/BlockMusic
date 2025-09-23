const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const config = require('../config/config');

// Test data
const testData = {
  nft: {
    tokenId: 1,
    owner: '0x0000000000000000000000000000000000000000',
    tokenURI: 'ipfs://test-uri',
    metadata: {
      name: 'Test NFT',
      description: 'Test Description',
      image: 'ipfs://test-image',
    },
  },
};

describe('API Tests', () => {
  // Connect to the database before running tests
  beforeAll(async () => {
    await mongoose.connect(config.mongo.uri, config.mongo.options);
  });

  // Clear all test data after each test
  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  // Disconnect from the database after all tests are done
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('GET /health', () => {
    it('should return 200 and status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('ok');
    });
  });

  describe('NFT API', () => {
    describe('GET /api/nfts', () => {
      it('should return empty array when no NFTs exist', async () => {
        const res = await request(app).get('/api/nfts');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toEqual(0);
      });
    });

    describe('GET /api/nfts/:id', () => {
      it('should return 404 when NFT does not exist', async () => {
        const res = await request(app).get('/api/nfts/nonexistent-id');
        expect(res.statusCode).toEqual(404);
        expect(res.body.success).toBeFalsy();
      });
    });

    describe('GET /api/nfts/owner/:owner', () => {
      it('should return empty array when owner has no NFTs', async () => {
        const res = await request(app).get(
          '/api/nfts/owner/0x0000000000000000000000000000000000000000'
        );
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toEqual(0);
      });
    });
  });
});
