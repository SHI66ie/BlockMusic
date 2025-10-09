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
    
    // Try to fetch tokenURI from contract
    let tokenURI;
    try {
      tokenURI = await contract.tokenURI(tokenId);
    } catch (err) {
      console.log(`No tokenURI for token ${tokenId}, returning placeholder`);
      // Return placeholder metadata if tokenURI doesn't exist
      return res.json({
        name: `Track ${parseInt(tokenId) + 1}`,
        artist: 'Unknown Artist',
        genre: 'Unknown',
        duration: '0:00',
        plays: 0,
        downloadable: false,
        tokenId,
        contractAddress,
      });
    }
    
    if (!tokenURI) {
      return res.json({
        name: `Track ${parseInt(tokenId) + 1}`,
        artist: 'Unknown Artist',
        genre: 'Unknown',
        duration: '0:00',
        plays: 0,
        downloadable: false,
        tokenId,
        contractAddress,
      });
    }
    
    // Fetch metadata from IPFS
    try {
      // Convert ipfs:// to https:// gateway URL
      let metadataUrl = tokenURI;
      if (tokenURI.startsWith('ipfs://')) {
        const hash = tokenURI.replace('ipfs://', '');
        metadataUrl = `https://gateway.pinata.cloud/ipfs/${hash}`;
      }
      
      const metadataResponse = await axios.get(metadataUrl, { timeout: 10000 });
      const metadata = metadataResponse.data;
      
      // Convert ipfs:// URLs in metadata to gateway URLs
      if (metadata.image && metadata.image.startsWith('ipfs://')) {
        metadata.image = metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
      }
      if (metadata.animation_url && metadata.animation_url.startsWith('ipfs://')) {
        metadata.animation_url = metadata.animation_url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
      }
      if (metadata.audio_url && metadata.audio_url.startsWith('ipfs://')) {
        metadata.audio_url = metadata.audio_url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
      }
      
      // Add token ID and contract address to response
      res.json({
        ...metadata,
        tokenId,
        contractAddress,
      });
    } catch (ipfsError) {
      console.error('Error fetching from IPFS:', ipfsError.message);
      // Return placeholder if IPFS fetch fails
      return res.json({
        name: `Track ${parseInt(tokenId) + 1}`,
        artist: 'Unknown Artist',
        genre: 'Unknown',
        duration: '0:00',
        plays: 0,
        downloadable: false,
        tokenId,
        contractAddress,
      });
    }
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    // Return placeholder instead of error
    res.json({
      name: `Track ${parseInt(req.params.tokenId) + 1}`,
      artist: 'Unknown Artist',
      genre: 'Unknown',
      duration: '0:00',
      plays: 0,
      downloadable: false,
      tokenId: req.params.tokenId,
      contractAddress: req.params.contractAddress,
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
