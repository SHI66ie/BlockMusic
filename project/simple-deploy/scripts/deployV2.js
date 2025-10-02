const hre = require("hardhat");

async function main() {
  console.log("Deploying SubscriptionV2 contract...");
  
  // Get the contract factory
  const SubscriptionV2 = await hre.ethers.getContractFactory("SubscriptionV2");
  
  // Deploy the contract with a mock price feed (0x0 for now)
  const subscriptionV2 = await SubscriptionV2.deploy("0x0000000000000000000000000000000000000000");
  
  // Wait for deployment to complete
  await subscriptionV2.deployed();
  
  console.log(`SubscriptionV2 deployed to: ${subscriptionV2.address}`);
  console.log(`Payment recipient set to: ${await subscriptionV2.PAYMENT_RECIPIENT()}`);
  
  // Verify the contract on Etherscan if needed
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await subscriptionV2.deployTransaction.wait(6);
    
    console.log("Verifying contract on Etherscan...");
    await hre.run("verify:verify", {
      address: subscriptionV2.address,
      constructorArguments: ["0x0000000000000000000000000000000000000000"],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
