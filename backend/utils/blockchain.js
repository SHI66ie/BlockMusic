const { ethers } = require('ethers');

// Initialize provider and signer
const provider = new ethers.providers.JsonRpcProvider(process.env.NETWORK_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract ABI (simplified for the BlockMusic contract)
const contractABI = [
  'function mint(address to, string memory tokenURI) public returns (uint256)',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function tokenURI(uint256 tokenId) public view returns (string memory)',
  'function balanceOf(address owner) public view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)',
  'function totalSupply() public view returns (uint256)',n  'function tokenByIndex(uint256 index) public view returns (uint256)'
];

// Contract instance
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  wallet
);

/**
 * Mint a new NFT
 * @param {string} to - Recipient address
 * @param {string} tokenURI - IPFS URI for the token metadata
 * @returns {Promise<Object>} - Transaction receipt
 */
const mintNFT = async (to, tokenURI) => {
  try {
    const tx = await contract.mint(to, tokenURI);
    const receipt = await tx.wait();
    
    // Extract the tokenId from the transaction logs
    const transferEvent = receipt.events?.find(
      (event) => event.event === 'Transfer'
    );
    
    const tokenId = transferEvent?.args?.tokenId?.toString();
    
    return {
      success: true,
      transactionHash: tx.hash,
      tokenId,
      receipt,
    };
  } catch (error) {
    console.error('Error minting NFT:', error);
    throw new Error('Failed to mint NFT');
  }
};

/**
 * Get token URI for a given token ID
 * @param {number} tokenId - Token ID
 * @returns {Promise<string>} - Token URI
 */
const getTokenURI = async (tokenId) => {
  try {
    return await contract.tokenURI(tokenId);
  } catch (error) {
    console.error('Error getting token URI:', error);
    throw new Error('Failed to get token URI');
  }
};

/**
 * Get owner of a token
 * @param {number} tokenId - Token ID
 * @returns {Promise<string>} - Owner address
 */
const getOwnerOf = async (tokenId) => {
  try {
    return await contract.ownerOf(tokenId);
  } catch (error) {
    console.error('Error getting owner:', error);
    throw new Error('Failed to get owner');
  }
};

/**
 * Get all tokens owned by an address
 * @param {string} address - Owner address
 * @returns {Promise<number[]>} - Array of token IDs
 */
const getTokensByOwner = async (address) => {
  try {
    const balance = await contract.balanceOf(address);
    const tokenIds = [];
    
    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(address, i);
      tokenIds.push(tokenId.toString());
    }
    
    return tokenIds;
  } catch (error) {
    console.error('Error getting tokens by owner:', error);
    throw new Error('Failed to get tokens by owner');
  }
};

/**
 * Get total number of tokens minted
 * @returns {Promise<number>} - Total supply
 */
const getTotalSupply = async () => {
  try {
    const totalSupply = await contract.totalSupply();
    return totalSupply.toNumber();
  } catch (error) {
    console.error('Error getting total supply:', error);
    throw new Error('Failed to get total supply');
  }
};

/**
 * Get token by index
 * @param {number} index - Index of the token
 * @returns {Promise<number>} - Token ID
 */
const getTokenByIndex = async (index) => {
  try {
    const tokenId = await contract.tokenByIndex(index);
    return tokenId.toString();
  } catch (error) {
    console.error('Error getting token by index:', error);
    throw new Error('Failed to get token by index');
  }
};

module.exports = {
  provider,
  wallet,
  contract,
  mintNFT,
  getTokenURI,
  getOwnerOf,
  getTokensByOwner,
  getTotalSupply,
  getTokenByIndex,
};
