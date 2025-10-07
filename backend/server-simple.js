const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 5000;

// Pinata API credentials
const PINATA_API_KEY = process.env.PINATA_API_KEY || '8ebf0ddd93c752935da7';
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || '598dfe4a0f1b31400223a4142f6ad0341fe2bf05a9a5a1dd7771154193f92fc7';

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// IPFS Upload endpoint
app.post('/api/ipfs/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📤 Upload request received');
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log(`📁 File: ${req.file.originalname}, Size: ${req.file.size} bytes, Type: ${req.file.mimetype}`);
    console.log(`🔑 API Key: ${PINATA_API_KEY ? 'Set' : 'Missing'}`);
    console.log(`🔐 Secret Key: ${PINATA_SECRET_KEY ? 'Set' : 'Missing'}`);

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    console.log('📡 Sending to Pinata...');

    // Upload to Pinata
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    const ipfsHash = response.data.IpfsHash;
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    console.log('✅ File uploaded to IPFS:', gatewayUrl);

    res.json({
      success: true,
      ipfsHash,
      gatewayUrl,
      size: response.data.PinSize,
      timestamp: response.data.Timestamp,
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
      message: error.response?.data?.error?.details || error.response?.data?.error || error.message,
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
  console.log(`✅ Pinata API Key: ${PINATA_API_KEY ? 'Set' : 'Missing'}`);
});
