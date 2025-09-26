const hre = require("hardhat");

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
    
    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: subscription.address,
        constructorArguments: [MOCK_PRICE_FEED],
      });
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("Contract is already verified");
      } else {
        console.log("Verification failed:", error);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
