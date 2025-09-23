const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Deploy MockUSDC for testing
  console.log("Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy(
    "Mock USDC",
    "mUSDC",
    6, // 6 decimals like real USDC
    hre.ethers.parseUnits("1000000", 6), // 1M tokens
    deployer.address
  );
  
  await mockUSDC.waitForDeployment();
  console.log(`MockUSDC deployed to: ${await mockUSDC.getAddress()}`);
  
  // Deploy SubscriptionManager
  console.log("Deploying SubscriptionManager...");
  const SubscriptionManager = await hre.ethers.getContractFactory("SubscriptionManager");
  const subscriptionManager = await SubscriptionManager.deploy(await mockUSDC.getAddress());
  
  await subscriptionManager.waitForDeployment();
  
  console.log(`SubscriptionManager deployed to: ${await subscriptionManager.getAddress()}`);
  
  // Print deployment info
  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log("MockUSDC:", await mockUSDC.getAddress());
  console.log("SubscriptionManager:", await subscriptionManager.getAddress());
  
  // Verify contracts on Etherscan if API key is available
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\nWaiting for block confirmations...");
    await subscriptionManager.deploymentTransaction().wait(6);
    
    console.log("Verifying contracts on Etherscan...");
    
    // Verify MockUSDC
    try {
      await hre.run("verify:verify", {
        address: await mockUSDC.getAddress(),
        constructorArguments: [
          "Mock USDC",
          "mUSDC",
          6,
          hre.ethers.parseUnits("1000000", 6),
          deployer.address
        ],
      });
    } catch (error) {
      console.log("Error verifying MockUSDC:", error.message);
    }
    
    // Verify SubscriptionManager
    try {
      await hre.run("verify:verify", {
        address: await subscriptionManager.getAddress(),
        constructorArguments: [await mockUSDC.getAddress()],
      });
    } catch (error) {
      console.log("Error verifying SubscriptionManager:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
