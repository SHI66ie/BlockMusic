const { ethers } = require("hardhat");

async function main() {
  // Get the provider
  const provider = ethers.provider;
  
  // Get the current network
  const network = await provider.getNetwork();
  console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
  
  // Get the latest block number
  const blockNumber = await provider.getBlockNumber();
  console.log(`Current block number: ${blockNumber}`);
  
  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);
  
  // Get the account's transaction count
  const txCount = await provider.getTransactionCount(signer.address);
  console.log(`Transaction count for ${signer.address}: ${txCount}`);
  
  console.log("\nTo check the contract deployment, please visit:");
  console.log(`https://sepolia.basescan.org/address/${signer.address}#internaltx`);
  console.log("\nLook for the most recent contract creation transaction.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
