const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Web3.Storage API token (get from https://web3.storage)
const WEB3_STORAGE_TOKEN = process.env.WEB3_STORAGE_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDVENjk4MzQzRjg0NjQxMzE5MjQwNjQ2NjQxNjQ2NTY0NjQ2NTY0NjQiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2MzAwMDAwMDAwMDAsIm5hbWUiOiJCbG9ja011c2ljIn0.fake';

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// IPFS Upload endpoint using Web3.Storage
app.post('/api/ipfs/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📤 Upload request received');
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log(`📁 File: ${req.file.originalname}, Size: ${req.file.size} bytes, Type: ${req.file.mimetype}`);
    console.log(`🔑 Web3.Storage Token: ${WEB3_STORAGE_TOKEN ? 'Set' : 'Missing'}`);

    console.log('📡 Uploading to Web3.Storage (IPFS)...');

    // Upload to Web3.Storage
    const response = await axios.post(
      'https://api.web3.storage/upload',
      req.file.buffer,
      {
        headers: {
          'Authorization': `Bearer ${WEB3_STORAGE_TOKEN}`,
          'Content-Type': req.file.mimetype,
          'X-NAME': req.file.originalname,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    const cid = response.data.cid;
    const gatewayUrl = `https://w3s.link/ipfs/${cid}`;

    console.log('✅ File uploaded to IPFS:', gatewayUrl);

    res.json({
      success: true,
      ipfsHash: cid,
      gatewayUrl,
      cid: cid,
    });
  } catch (error) {
    console.error('❌ IPFS upload error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack,
    });
    
    res.status(500).json({
      error: 'Failed to upload to IPFS',
      message: error.response?.data?.message || error.message,
      details: error.response?.data,
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'BlockMusic Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      ipfsUpload: 'POST /api/ipfs/upload',
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
  console.log(`✅ Web3.Storage Token: ${WEB3_STORAGE_TOKEN ? 'Set' : 'Missing'}`);
});
