const express = require('express');
const router = express.Router();
const axios = require('axios');
const { ethers } = require('ethers');

// RPC endpoint for Base Sepolia
const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Simple ERC721 ABI for tokenURI
const ERC721_ABI = [
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)'
];

// Get NFT metadata by contract and token ID
router.get('/:contractAddress/:tokenId', async (req, res) => {
  try {
    const { contractAddress, tokenId } = req.params;
    
    // Get contract instance
    const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
    
    // Fetch tokenURI from contract
    const tokenURI = await contract.tokenURI(tokenId);
    
    if (!tokenURI) {
      return res.status(404).json({ error: 'Token URI not found' });
    }
    
    // Fetch metadata from IPFS
    const metadataResponse = await axios.get(tokenURI);
    const metadata = metadataResponse.data;
    
    // Add token ID and contract address to response
    res.json({
      ...metadata,
      tokenId,
      contractAddress,
    });
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    res.status(500).json({ 
      error: 'Failed to fetch NFT metadata',
      message: error.message 
    });
  }
});

// Get all NFTs for a contract
router.get('/:contractAddress', async (req, res) => {
  try {
    const { contractAddress } = req.params;
    
    const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
    const totalSupply = await contract.totalSupply();
    
    const nfts = [];
    const supply = Number(totalSupply);
    
    // Fetch metadata for all tokens
    for (let i = 0; i < supply; i++) {
      try {
        const tokenURI = await contract.tokenURI(i);
        const metadataResponse = await axios.get(tokenURI);
        nfts.push({
          ...metadataResponse.data,
          tokenId: i,
          contractAddress,
        });
      } catch (err) {
        console.error(`Error fetching token ${i}:`, err);
      }
    }
    
    res.json(nfts);
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch NFTs',
      message: error.message 
    });
  }
});

module.exports = router;
