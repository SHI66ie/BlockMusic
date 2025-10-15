// Check backend wallet balance
const { ethers } = require('ethers');

const BACKEND_WALLET = '0xb89A51592Fca543a6879B12507aC64536eb23764';
const RPC_URL = 'https://sepolia.base.org';

async function checkBalance() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const balance = await provider.getBalance(BACKEND_WALLET);
    const balanceInEth = ethers.formatEther(balance);
    
    console.log('\n💰 Backend Wallet Balance Check\n');
    console.log('Address:', BACKEND_WALLET);
    console.log('Network: Base Sepolia');
    console.log('Balance:', balanceInEth, 'ETH');
    console.log('Balance (Wei):', balance.toString());
    
    if (parseFloat(balanceInEth) > 0) {
      console.log('\n✅ Wallet is funded! Ready to process blockchain updates.');
      console.log(`💡 This is enough for approximately ${Math.floor(parseFloat(balanceInEth) / 0.0001)} transactions.`);
    } else {
      console.log('\n⚠️  Wallet has no funds. Please fund it to enable blockchain updates.');
      console.log('Get testnet ETH: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
    }
    
    console.log('\n');
  } catch (error) {
    console.error('Error checking balance:', error.message);
  }
}

checkBalance();
