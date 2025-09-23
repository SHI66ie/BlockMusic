const NFT = require('../models/NFT');
const { uploadToIPFS, uploadMetadataToIPFS } = require('../utils/ipfs');
const { mintNFT } = require('../utils/blockchain');
const { validationError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Get all NFTs with pagination
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Number of items per page
 * @param {string} options.sort - Sort field and direction
 * @returns {Promise<Object>} - Paginated NFTs
 */
const getAllNFTs = async ({ page = 1, limit = 10, sort = '-createdAt' }) => {
  try {
    const skip = (page - 1) * limit;
    const [nfts, total] = await Promise.all([
      NFT.find()
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      NFT.countDocuments()
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: nfts,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        hasNext,
        hasPrev,
        limit
      }
    };
  } catch (error) {
    logger.error(`Error fetching NFTs: ${error.message}`, { error });
    throw new Error('Failed to fetch NFTs');
  }
};

/**
 * Get NFT by ID
 * @param {string} id - NFT ID
 * @returns {Promise<Object>} - NFT document
 */
const getNFTById = async (id) => {
  try {
    const nft = await NFT.findById(id).lean();
    if (!nft) {
      throw new Error('NFT not found');
    }
    return nft;
  } catch (error) {
    logger.error(`Error fetching NFT ${id}: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Get NFTs by owner address
 * @param {string} owner - Owner's Ethereum address
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of NFTs
 */
const getNFTsByOwner = async (owner, { page = 1, limit = 10, sort = '-createdAt' } = {}) => {
  try {
    const skip = (page - 1) * limit;
    const [nfts, total] = await Promise.all([
      NFT.find({ owner: owner.toLowerCase() })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      NFT.countDocuments({ owner: owner.toLowerCase() })
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: nfts,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        hasNext,
        hasPrev,
        limit
      }
    };
  } catch (error) {
    logger.error(`Error fetching NFTs for owner ${owner}: ${error.message}`, { error });
    throw new Error('Failed to fetch NFTs by owner');
  }
};

/**
 * Create a new NFT
 * @param {Object} nftData - NFT data
 * @param {string} nftData.owner - Owner's Ethereum address
 * @param {Object} nftData.metadata - NFT metadata
 * @param {Object} file - Uploaded file
 * @returns {Promise<Object>} - Created NFT
 */
const createNFT = async ({ owner, metadata }, file) => {
  const session = await NFT.startSession();
  session.startTransaction();

  try {
    // 1. Upload file to IPFS
    let fileIpfsHash, fileUrl;
    if (file) {
      const fileResult = await uploadToIPFS(
        file.buffer,
        file.originalname,
        { type: 'nft_media' }
      );
      fileIpfsHash = fileResult.ipfsHash;
      fileUrl = fileResult.url;
    }

    // 2. Prepare metadata with IPFS URL if file was uploaded
    const nftMetadata = {
      ...metadata,
      ...(fileUrl && { image: fileUrl })
    };

    // 3. Upload metadata to IPFS
    const metadataResult = await uploadMetadataToIPFS(
      nftMetadata,
      `nft-metadata-${Date.now()}`
    );

    // 4. Mint NFT on the blockchain
    const tokenId = await mintNFT(owner, metadataResult.url);

    // 5. Save NFT to database
    const nft = new NFT({
      tokenId,
      owner: owner.toLowerCase(),
      tokenURI: metadataResult.url,
      metadata: nftMetadata,
      ipfsHash: metadataResult.ipfsHash,
      fileIpfsHash
    });

    await nft.save({ session });
    await session.commitTransaction();
    session.endSession();

    return nft.toObject();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error(`Error creating NFT: ${error.message}`, { error });
    throw new Error('Failed to create NFT');
  }
};

/**
 * Update NFT metadata
 * @param {string} id - NFT ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} - Updated NFT
 */
const updateNFT = async (id, updates) => {
  try {
    const nft = await NFT.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!nft) {
      throw new Error('NFT not found');
    }

    return nft;
  } catch (error) {
    logger.error(`Error updating NFT ${id}: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Delete an NFT
 * @param {string} id - NFT ID
 * @returns {Promise<boolean>} - True if deleted
 */
const deleteNFT = async (id) => {
  try {
    const result = await NFT.findByIdAndDelete(id);
    return !!result;
  } catch (error) {
    logger.error(`Error deleting NFT ${id}: ${error.message}`, { error });
    throw new Error('Failed to delete NFT');
  }
};

module.exports = {
  getAllNFTs,
  getNFTById,
  getNFTsByOwner,
  createNFT,
  updateNFT,
  deleteNFT
};
