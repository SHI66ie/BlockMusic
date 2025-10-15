// Check transaction details
const { ethers } = require('ethers');

const TX_HASH = '0x927ea80972b5ab9e2a944bab3f68ed988b188847c72a77d96d16d0331f55ce7b';
const RPC_URL = 'https://sepolia.base.org';
const CORRECT_CONTRACT = '0x019211130714DEF2a46FFeF084D559313181BDFA';

async function checkTransaction() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    console.log('\n🔍 Checking Transaction\n');
    console.log('TX Hash:', TX_HASH);
    console.log('Network: Base Sepolia\n');
    
    const tx = await provider.getTransaction(TX_HASH);
    
    if (!tx) {
      console.log('❌ Transaction not found. It may not have been mined yet.');
      return;
    }
    
    console.log('From:', tx.from);
    console.log('To:', tx.to);
    console.log('Block Number:', tx.blockNumber);
    console.log('Status: Pending...');
    
    // Wait for transaction receipt
    console.log('\nWaiting for confirmation...');
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    
    if (receipt) {
      console.log('\n✅ Transaction Confirmed!');
      console.log('Block:', receipt.blockNumber);
      console.log('Gas Used:', receipt.gasUsed.toString());
      console.log('Status:', receipt.status === 1 ? '✅ Success' : '❌ Failed');
      
      if (receipt.logs.length > 0) {
        console.log('\nEvents emitted:', receipt.logs.length);
        
        // Check for Transfer event (NFT minted)
        const transferTopic = ethers.id('Transfer(address,address,uint256)');
        const transferLog = receipt.logs.find(log => log.topics[0] === transferTopic);
        
        if (transferLog) {
          const tokenId = ethers.toBigInt(transferLog.topics[3]);
          console.log('\n🎉 NFT Minted!');
          console.log('Token ID:', tokenId.toString());
          console.log('Contract:', transferLog.address);
        }
      }
    } else {
      console.log('\n⏳ Transaction is still pending...');
    }
    
    console.log('\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTransaction();
