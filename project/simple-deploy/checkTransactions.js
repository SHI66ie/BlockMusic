const { ethers } = require("hardhat");

async function main() {
  // Get the provider from hardhat
  const provider = ethers.provider;
  
  // Get the signer
  const [signer] = await ethers.getSigners();
  const address = signer.address;
  
  console.log(`Checking transactions for address: ${address}`);
  
  try {
    // Get the transaction count
    const txCount = await provider.getTransactionCount(address);
    console.log(`Total transactions: ${txCount}`);
    
    // Get the latest transactions
    const history = await provider.getHistory(address);
    console.log("\nLatest transactions:");
    
    // Show the 5 most recent transactions
    const recentTxs = history.slice(0, 5);
    for (const tx of recentTxs) {
      console.log(`\nTransaction: ${tx.hash}`);
      console.log(`Block: ${tx.blockNumber}`);
      console.log(`To: ${tx.to || 'Contract Creation'}`);
      console.log(`Value: ${ethers.utils.formatEther(tx.value)} ETH`);
      
      // Check if it's a contract creation
      if (!tx.to) {
        console.log("This is a contract creation transaction");
        // Get the receipt to find the contract address
        const receipt = await provider.getTransactionReceipt(tx.hash);
        if (receipt && receipt.contractAddress) {
          console.log(`Contract created at: ${receipt.contractAddress}`);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching transactions:", error);
  }
  
  console.log("\nTo check the contract deployment, please visit:");
  console.log(`https://sepolia.basescan.org/address/${address}#internaltx`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
