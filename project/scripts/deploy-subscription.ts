import { ethers, network, run } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

dotenvConfig({ path: resolve(__dirname, "../.env") });

// Chainlink Price Feed for ETH/USD on Base Sepolia
// This is a mock address - replace with actual Chainlink price feed address for Base Sepolia
const MOCK_PRICE_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

async function main() {
  console.log(`Deploying to ${network.name}...`);
  
  // Get the contract factory
  const Subscription = await ethers.getContractFactory("Subscription");
  
  console.log("Deploying Subscription contract...");
  
  // Deploy the contract with the price feed address
  const subscription = await Subscription.deploy(MOCK_PRICE_FEED);
  await subscription.deployed();
  
  console.log(`Subscription deployed to: ${subscription.address}`);
  
  // Wait for a few blocks to be mined
  console.log("Waiting for block confirmations...");
  await subscription.deployTransaction.wait(6);
  
  // Verify the contract on BaseScan
  console.log("Verifying contract on BaseScan...");
  try {
    await run("verify:verify", {
      address: subscription.address,
      constructorArguments: [MOCK_PRICE_FEED],
    });
    console.log("Contract verified on BaseScan!");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }
  
  console.log("Deployment completed!");
  console.log(`Contract address: ${subscription.address}`);
  
  return subscription.address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
