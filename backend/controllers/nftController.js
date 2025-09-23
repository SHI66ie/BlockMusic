const nftService = require('../services/nftService');
const { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  validationError
} = require('../utils/apiResponse');
const { validate, commonRules } = require('../validations');
const logger = require('../utils/logger');

/**
 * @desc    Get all NFTs
 * @route   GET /api/nfts
 * @access  Public
 */
const getAllNFTs = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const result = await nftService.getAllNFTs({
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 100),
      sort
    });
    
    return successResponse(res, result.data, 'NFTs retrieved successfully', 200, {
      pagination: result.pagination
    });
  } catch (error) {
    logger.error(`Error in getAllNFTs: ${error.message}`, { error });
    return errorResponse(res, 'Failed to retrieve NFTs', 500);
  }
};

/**
 * @desc    Get single NFT by ID
 * @route   GET /api/nfts/:id
 * @access  Public
 */
const getNFTById = async (req, res) => {
  try {
    const nft = await nftService.getNFTById(req.params.id);
    if (!nft) {
      return notFoundResponse(res, 'NFT not found');
    }
    return successResponse(res, nft, 'NFT retrieved successfully');
  } catch (error) {
    if (error.message === 'NFT not found') {
      return notFoundResponse(res, error.message);
    }
    logger.error(`Error in getNFTById: ${error.message}`, { error });
    return errorResponse(res, 'Failed to retrieve NFT', 500);
  }
};

/**
 * @desc    Get NFTs by owner address
 * @route   GET /api/nfts/owner/:owner
 * @access  Public
 */
const getNFTsByOwner = async (req, res) => {
  try {
    const { owner } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    
    const result = await nftService.getNFTsByOwner(owner, {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 100),
      sort
    });
    
    return successResponse(res, result.data, 'NFTs retrieved successfully', 200, {
      pagination: result.pagination
    });
  } catch (error) {
    logger.error(`Error in getNFTsByOwner: ${error.message}`, { error });
    return errorResponse(res, 'Failed to retrieve NFTs by owner', 500);
  }
};

/**
 * @desc    Create a new NFT
 * @route   POST /api/nfts
 * @access  Private
 */
const createNFT = async (req, res) => {
  try {
    const { owner, metadata } = req.body;
    const file = req.file;

    // Validate required fields
    if (!owner || !metadata) {
      return validationError(res, [
        { field: 'owner', message: 'Owner address is required' },
        { field: 'metadata', message: 'Metadata is required' }
      ]);
    }

    const nft = await nftService.createNFT({ owner, metadata }, file);
    return successResponse(res, nft, 'NFT created successfully', 201);
  } catch (error) {
    logger.error(`Error in createNFT: ${error.message}`, { error });
    return errorResponse(res, error.message || 'Failed to create NFT', 500);
  }
};

/**
 * @desc    Update NFT
 * @route   PATCH /api/nfts/:id
 * @access  Private
 */
const updateNFT = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const nft = await nftService.updateNFT(id, updates);
    if (!nft) {
      return notFoundResponse(res, 'NFT not found');
    }

    return successResponse(res, nft, 'NFT updated successfully');
  } catch (error) {
    if (error.message === 'NFT not found') {
      return notFoundResponse(res, error.message);
    }
    logger.error(`Error in updateNFT: ${error.message}`, { error });
    return errorResponse(res, 'Failed to update NFT', 500);
  }
};

/**
 * @desc    Delete NFT
 * @route   DELETE /api/nfts/:id
 * @access  Private
 */
const deleteNFT = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await nftService.deleteNFT(id);
    
    if (!deleted) {
      return notFoundResponse(res, 'NFT not found');
    }

    return successResponse(res, null, 'NFT deleted successfully');
  } catch (error) {
    logger.error(`Error in deleteNFT: ${error.message}`, { error });
    return errorResponse(res, 'Failed to delete NFT', 500);
  }
};

// Validation rules
const nftValidationRules = {
  createNFT: [
    commonRules.ethereumAddress('owner'),
    body('metadata')
      .exists()
      .withMessage('Metadata is required')
      .isObject()
      .withMessage('Metadata must be an object')
  ],
  updateNFT: [
    commonRules.id,
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
  ],
  getNFTById: [commonRules.id],
  deleteNFT: [commonRules.id],
  getNFTsByOwner: [
    param('owner')
      .isEthereumAddress()
      .withMessage('Invalid owner address')
      .bail()
      .toLowerCase(),
    ...commonRules.pagination
  ]
};

module.exports = {
  getAllNFTs,
  getNFTById,
  getNFTsByOwner,
  createNFT,
  updateNFT,
  deleteNFT,
  nftValidationRules
};
