require('dotenv').config();
const mongoose = require('mongoose');
const NFT = require('../models/NFT');

const seedNFTs = [
  {
    tokenId: 1,
    owner: '0x0000000000000000000000000000000000000000',
    tokenURI: 'ipfs://example1',
    metadata: {
      name: 'BlockMusic #1',
      description: 'First BlockMusic NFT',
      image: 'ipfs://example1/image.png',
      attributes: [
        { trait_type: 'Genre', value: 'Electronic' },
        { trait_type: 'BPM', value: 128 }
      ]
    }
  },
  {
    tokenId: 2,
    owner: '0x0000000000000000000000000000000000000000',
    tokenURI: 'ipfs://example2',
    metadata: {
      name: 'BlockMusic #2',
      description: 'Second BlockMusic NFT',
      image: 'ipfs://example2/image.png',
      attributes: [
        { trait_type: 'Genre', value: 'Hip Hop' },
        { trait_type: 'BPM', value: 95 }
      ]
    }
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blockmusic', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await NFT.deleteMany({});
    console.log('Cleared NFT collection');

    // Insert seed data
    await NFT.insertMany(seedNFTs);
    console.log('Added seed data');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
