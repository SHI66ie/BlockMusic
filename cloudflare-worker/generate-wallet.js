// Generate a new wallet for backend use
const { ethers } = require('ethers');

const wallet = ethers.Wallet.createRandom();

console.log('\n🔐 NEW BACKEND WALLET GENERATED\n');
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('\n⚠️  IMPORTANT:');
console.log('1. Save the private key securely');
console.log('2. Fund this address with Base Sepolia ETH');
console.log('3. Set as Cloudflare secret: wrangler secret put BACKEND_PRIVATE_KEY');
console.log('\n📍 Get testnet ETH from:');
console.log('   https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
console.log('\n');
