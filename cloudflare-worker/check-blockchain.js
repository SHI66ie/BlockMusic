// Check if play count was updated on blockchain
const { ethers } = require('ethers');

const MUSIC_NFT_CONTRACT = '0x8F046B35163A821204B3a42C1E94B0Bc69BFDe37';
const RPC_URL = 'https://sepolia.base.org';

const ABI = [
  'function getMusicMetadata(uint256 tokenId) external view returns (string memory title, string memory artist, address artistAddress, string memory audioUrl, string memory coverUrl, uint256 price, uint256 playCount)'
];

async function checkPlayCount() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(MUSIC_NFT_CONTRACT, ABI, provider);
    
    console.log('\n🔍 Checking Blockchain Play Count\n');
    console.log('Contract:', MUSIC_NFT_CONTRACT);
    console.log('Network: Base Sepolia\n');
    
    const metadata = await contract.getMusicMetadata(0);
    
    console.log('Token ID: 0');
    console.log('Title:', metadata[0]);
    console.log('Artist:', metadata[1]);
    console.log('Play Count:', metadata[6].toString());
    
    if (metadata[6] > 0) {
      console.log('\n✅ Play count successfully synced to blockchain!');
    } else {
      console.log('\n⚠️  Play count is still 0 on blockchain.');
      console.log('This means the cron job hasn\'t run yet or there was an error.');
    }
    
    console.log('\n');
  } catch (error) {
    console.error('Error checking blockchain:', error.message);
  }
}

checkPlayCount();
