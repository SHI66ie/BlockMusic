import hre from "hardhat";

async function main() {
  console.log("Deploying Subscription contract...");
  
  // The price feed address - using a mock for Base Sepolia
  const MOCK_PRICE_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
  
  const Subscription = await hre.ethers.getContractFactory("Subscription");
  const subscription = await Subscription.deploy(MOCK_PRICE_FEED);
  
  await subscription.deployed();
  
  console.log(`Subscription deployed to: ${subscription.address}`);
  
  // Verify the contract (optional)
  if (process.env.BASESCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await subscription.deployTransaction.wait(6);
    
    console.log("Verifying contract on BaseScan...");
    try {
      await hre.run("verify:verify", {
        address: subscription.address,
        constructorArguments: [MOCK_PRICE_FEED],
      });
      console.log("Contract verified on BaseScan!");
    } catch (error) {
      console.error("Error verifying contract:", error);
    }
  }
  
  console.log("Deployment completed!");
  console.log(`Contract address: ${subscription.address}`);
  
  // Output the environment variable to set
  console.log("\nAdd this to your .env file:");
  console.log(`VITE_SUBSCRIPTION_CONTRACT=${subscription.address}`);
  console.log(`VITE_USDC_TOKEN=0x036CbD53842c5426634e7929541eC2318f3dCF7e`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
