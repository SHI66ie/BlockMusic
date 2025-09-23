const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const pinata = pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

/**
 * Upload a file to IPFS via Pinata
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} fileName - Name of the file
 * @param {Object} metadata - Optional metadata to include
 * @returns {Promise<Object>} - IPFS hash and URL
 */
const uploadToIPFS = async (fileBuffer, fileName, metadata = {}) => {
  try {
    const options = {
      pinataMetadata: {
        name: fileName,
        keyvalues: {
          ...metadata,
          app: 'blockmusic',
          timestamp: new Date().toISOString(),
        },
      },
    };

    const result = await pinata.pinFileToIPFS(fileBuffer, options);
    
    return {
      success: true,
      ipfsHash: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload file to IPFS');
  }
};

/**
 * Upload JSON metadata to IPFS
 * @param {Object} metadata - JSON metadata to upload
 * @param {string} name - Name for the metadata
 * @returns {Promise<Object>} - IPFS hash and URL
 */
const uploadMetadataToIPFS = async (metadata, name) => {
  try {
    const options = {
      pinataMetadata: {
        name: `${name}-metadata`,
      },
    };

    const result = await pinata.pinJSONToIPFS(metadata, options);
    
    return {
      success: true,
      ipfsHash: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    };
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }
};

/**
 * Get file from IPFS
 * @param {string} ipfsHash - IPFS hash of the file
 * @returns {Promise<Buffer>} - File buffer
 */
const getFromIPFS = async (ipfsHash) => {
  try {
    const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`, {
      responseType: 'arraybuffer',
    });
    
    return Buffer.from(response.data, 'binary');
  } catch (error) {
    console.error('Error getting file from IPFS:', error);
    throw new Error('Failed to get file from IPFS');
  }
};

/**
 * Pin a file to IPFS by its hash
 * @param {string} hashToPin - IPFS hash to pin
 * @returns {Promise<Object>} - Pin result
 */
const pinHashToIPFS = async (hashToPin) => {
  try {
    const result = await pinata.pinByHash(hashToPin);
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error('Error pinning hash to IPFS:', error);
    throw new Error('Failed to pin hash to IPFS');
  }
};

module.exports = {
  uploadToIPFS,
  uploadMetadataToIPFS,
  getFromIPFS,
  pinHashToIPFS,
  pinata,
};
