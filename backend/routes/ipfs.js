const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

// Configure multer for file uploads (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Pinata API credentials (from environment variables)
const PINATA_API_KEY = process.env.PINATA_API_KEY || '8ebf0ddd93c752935da7';
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || '598dfe4a0f1b31400223a4142f6ad0341fe2bf05a9a5a1dd7771154193f92fc7';

/**
 * POST /api/ipfs/upload
 * Upload file to Pinata IPFS
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

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
    console.error('❌ IPFS upload error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to upload to IPFS',
      message: error.response?.data?.error || error.message,
    });
  }
});

/**
 * POST /api/ipfs/upload-json
 * Upload JSON metadata to Pinata IPFS
 */
router.post('/upload-json', express.json(), async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'No JSON data provided' });
    }

    const formData = new FormData();
    const jsonBuffer = Buffer.from(JSON.stringify(req.body));
    formData.append('file', jsonBuffer, {
      filename: 'metadata.json',
      contentType: 'application/json',
    });

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
      }
    );

    const ipfsHash = response.data.IpfsHash;
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    console.log('✅ JSON metadata uploaded to IPFS:', gatewayUrl);

    res.json({
      success: true,
      ipfsHash,
      gatewayUrl,
      size: response.data.PinSize,
      timestamp: response.data.Timestamp,
    });
  } catch (error) {
    console.error('❌ JSON upload error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to upload JSON to IPFS',
      message: error.response?.data?.error || error.message,
    });
  }
});

module.exports = router;
