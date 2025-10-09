const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Use Pinata (simpler, works with basic API keys)
const PINATA_JWT = process.env.PINATA_JWT || process.env.STORACHA_TOKEN || '';
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// IPFS Upload endpoint using Pinata (simpler than Storacha)
app.post('/api/ipfs/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📤 Upload request received');
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log(`📁 File: ${req.file.originalname}, Size: ${req.file.size} bytes, Type: ${req.file.mimetype}`);

    if (!PINATA_JWT) {
      return res.status(500).json({
        error: 'Pinata JWT not configured',
        message: 'Please set PINATA_JWT environment variable. Get it from https://app.pinata.cloud',
      });
    }

    console.log('📡 Uploading to Pinata (IPFS)...');

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // Upload to Pinata using JWT (simpler than Storacha's DID/UCAN)
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    const ipfsHash = response.data.IpfsHash;
    const gatewayUrl = `${IPFS_GATEWAY}${ipfsHash}`;

    console.log('✅ File uploaded to IPFS:', gatewayUrl);

    res.json({
      success: true,
      ipfsHash,
      gatewayUrl,
      size: response.data.PinSize,
    });
  } catch (error) {
    console.error('❌ IPFS upload error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    res.status(500).json({
      error: 'Failed to upload to IPFS',
      message: error.response?.data?.error || error.message,
      details: error.response?.data,
    });
  }
});

// Mount NFT routes
const nftRoutes = require('./routes/nft');
app.use('/api/nfts', nftRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'BlockMusic Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      ipfsUpload: 'POST /api/ipfs/upload',
      nftMetadata: 'GET /api/nfts/:contractAddress/:tokenId',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Pinata JWT: ${PINATA_JWT ? 'Set' : 'Missing'}`);
});
