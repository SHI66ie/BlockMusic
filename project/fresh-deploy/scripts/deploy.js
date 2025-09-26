const hre = require("hardhat");

async function main() {
  console.log("Deploying Subscription contract...");
  
  // Mock price feed address (using Chainlink ETH/USD price feed on Ethereum mainnet for example)
  const MOCK_PRICE_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
  
  const Subscription = await hre.ethers.getContractFactory("Subscription");
  const subscription = await Subscription.deploy(MOCK_PRICE_FEED);
  
  await subscription.deployed();
  
  console.log(`Subscription deployed to: ${subscription.address}`);
  
  // If you want to verify the contract, uncomment the following lines
  /*
  console.log("Waiting for block confirmations...");
  await subscription.deployTransaction.wait(6);
  
  console.log("Verifying contract...");
  try {
    await hre.run("verify:verify", {
      address: subscription.address,
      constructorArguments: [MOCK_PRICE_FEED],
    });
  } catch (error) {
    console.log("Verification failed:", error);
  }
  */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
