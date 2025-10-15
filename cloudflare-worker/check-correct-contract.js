// Check the correct contract for NFTs
const { ethers } = require('ethers');

const MUSIC_NFT_CONTRACT = '0x019211130714DEF2a46FFeF084D559313181BDFA';
const RPC_URL = 'https://sepolia.base.org';

const ABI = [
  'function totalSupply() external view returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function getMusicMetadata(uint256 tokenId) external view returns (string memory title, string memory artist, address artistAddress, string memory audioUrl, string memory coverUrl, uint256 price, uint256 playCount)'
];

async function checkNFTs() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(MUSIC_NFT_CONTRACT, ABI, provider);
    
    console.log('\n🎵 Checking MusicNFT Contract\n');
    console.log('Contract:', MUSIC_NFT_CONTRACT);
    console.log('Network: Base Sepolia\n');
    
    try {
      // Check if token 0 exists
      const owner = await contract.ownerOf(0);
      console.log('✅ Token 0 exists!');
      console.log('Owner:', owner);
      
      // Get metadata
      const metadata = await contract.getMusicMetadata(0);
      console.log('\n📀 NFT Metadata:');
      console.log('Title:', metadata[0]);
      console.log('Artist:', metadata[1]);
      console.log('Artist Address:', metadata[2]);
      console.log('Audio URL:', metadata[3]);
      console.log('Cover URL:', metadata[4]);
      console.log('Price:', ethers.formatEther(metadata[5]), 'ETH');
      console.log('Play Count:', metadata[6].toString());
      
      if (metadata[6] > 0) {
        console.log('\n🎉 Play count is synced to blockchain!');
      } else {
        console.log('\n⚠️  Play count is 0. Waiting for cron job to sync plays.');
      }
      
    } catch (error) {
      console.log('❌ Token 0 does not exist yet.');
      console.log('Error:', error.message);
    }
    
    console.log('\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkNFTs();
