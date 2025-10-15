// Check if NFT exists and get total supply
const { ethers } = require('ethers');

const MUSIC_NFT_CONTRACT = '0x8F046B35163A821204B3a42C1E94B0Bc69BFDe37';
const RPC_URL = 'https://sepolia.base.org';

const ABI = [
  'function totalSupply() external view returns (uint256)',
  'function tokenByIndex(uint256 index) external view returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)'
];

async function checkNFTs() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(MUSIC_NFT_CONTRACT, ABI, provider);
    
    console.log('\n🎵 Checking MusicNFT Contract\n');
    console.log('Contract:', MUSIC_NFT_CONTRACT);
    console.log('Network: Base Sepolia\n');
    
    try {
      const totalSupply = await contract.totalSupply();
      console.log('Total NFTs Minted:', totalSupply.toString());
      
      if (totalSupply > 0) {
        console.log('\n✅ NFTs exist! Checking first NFT...\n');
        
        for (let i = 0; i < Math.min(totalSupply, 3); i++) {
          try {
            const tokenId = await contract.tokenByIndex(i);
            const owner = await contract.ownerOf(tokenId);
            console.log(`Token ${i}: ID=${tokenId}, Owner=${owner}`);
          } catch (e) {
            console.log(`Token ${i}: Error - ${e.message}`);
          }
        }
      } else {
        console.log('\n⚠️  No NFTs have been minted yet!');
        console.log('You need to mint an NFT first before play tracking will work.');
        console.log('\nTo mint an NFT:');
        console.log('1. Go to https://blockmusic.netlify.app');
        console.log('2. Connect your wallet');
        console.log('3. Go to Artist Dashboard');
        console.log('4. Upload a track');
      }
    } catch (error) {
      console.log('⚠️  Could not get total supply. Contract might not support ERC721Enumerable.');
      console.log('Trying to check if token 0 exists...\n');
      
      try {
        const owner = await contract.ownerOf(0);
        console.log('✅ Token 0 exists!');
        console.log('Owner:', owner);
      } catch (e) {
        console.log('❌ Token 0 does not exist.');
        console.log('No NFTs have been minted yet.');
      }
    }
    
    console.log('\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkNFTs();
