const express = require('express');
const router = express.Router();
const NFT = require('../models/NFT');

// Get all NFTs
router.get('/', async (req, res) => {
  try {
    const nfts = await NFT.find().sort({ createdAt: -1 });
    res.json(nfts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get NFT by ID
router.get('/:id', async (req, res) => {
  try {
    const nft = await NFT.findOne({ tokenId: req.params.id });
    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }
    res.json(nft);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get NFTs by owner
router.get('/owner/:owner', async (req, res) => {
  try {
    const nfts = await NFT.find({ owner: req.params.owner.toLowerCase() });
    res.json(nfts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
