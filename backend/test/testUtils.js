const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

let mongoServer;

/**
 * Connect to the in-memory database
 */
const connectDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

/**
 * Drop database, close the connection and stop mongod
 */
const closeDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

/**
 * Remove all the data for all db collections
 */
const clearDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

/**
 * Generate JWT token for testing authenticated routes
 * @param {string} userId - User ID
 * @param {string} address - Ethereum address
 * @param {string} [role='user'] - User role
 * @returns {string} JWT token
 */
const generateAuthToken = (userId, address, role = 'user') => {
  const payload = {
    sub: userId,
    address: address.toLowerCase(),
    role,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.accessExpirationMinutes * 60 });
};

/**
 * Generate mock file for testing file uploads
 * @param {string} [filename='test.jpg'] - Filename
 * @param {string} [mimetype='image/jpeg'] - MIME type
 * @param {number} [size=1000] - File size in bytes
 * @returns {Object} Mock file object
 */
const generateMockFile = (filename = 'test.jpg', mimetype = 'image/jpeg', size = 1000) => ({
  fieldname: 'file',
  originalname: filename,
  encoding: '7bit',
  mimetype,
  buffer: Buffer.from('test file content'),
  size,
});

/**
 * Generate mock NFT data for testing
 * @param {Object} [overrides={}] - Override default values
 * @returns {Object} Mock NFT data
 */
const generateMockNFT = (overrides = {}) => ({
  tokenId: 1,
  owner: '0x0000000000000000000000000000000000000001',
  tokenURI: 'ipfs://test-uri',
  ipfsHash: 'QmTestHash',
  fileIpfsHash: 'QmTestFileHash',
  metadata: {
    name: 'Test NFT',
    description: 'A test NFT',
    image: 'ipfs://test-image',
    attributes: [
      { trait_type: 'color', value: 'blue' },
      { trait_type: 'size', value: 'large' }
    ]
  },
  ...overrides
});

/**
 * Generate mock user data for testing
 * @param {Object} [overrides={}] - Override default values
 * @returns {Object} Mock user data
 */
const generateMockUser = (overrides = {}) => ({
  address: '0x0000000000000000000000000000000000000001',
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  isEmailVerified: false,
  ...overrides
});

module.exports = {
  connectDB,
  closeDB,
  clearDB,
  generateAuthToken,
  generateMockFile,
  generateMockNFT,
  generateMockUser,
};
