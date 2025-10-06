const hre = require("hardhat");

async function main() {
  console.log("Deploying ETH Subscription Contract to Base Sepolia...");

  // Get the contract factory
  const SubscriptionV2 = await hre.ethers.getContractFactory("SubscriptionV2");
  
  // Price feed address (can be zero address for testnet, or use Chainlink)
  const priceFeedAddress = "0x0000000000000000000000000000000000000000";
  
  console.log("Deploying with price feed:", priceFeedAddress);
  
  // Deploy the contract
  const subscription = await SubscriptionV2.deploy(priceFeedAddress);
  
  await subscription.deployed();
  
  console.log("✅ SubscriptionV2 deployed to:", subscription.address);
  console.log("");
  console.log("📋 Contract Details:");
  console.log("- Network: Base Sepolia");
  console.log("- Contract Address:", subscription.address);
  console.log("- Payment Recipient:", "0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B");
  console.log("- USDC Token:", "0x036CbD53842c5426634e7929541eC2318f3dCF7e");
  console.log("");
  console.log("💰 Subscription Prices:");
  console.log("- Monthly: $2.50 (or ETH equivalent)");
  console.log("- Yearly: $25.00 (or ETH equivalent)");
  console.log("");
  console.log("🔧 Next Steps:");
  console.log("1. Verify contract on Basescan:");
  console.log(`   npx hardhat verify --network baseSepolia ${subscription.address} "${priceFeedAddress}"`);
  console.log("");
  console.log("2. Update environment variable:");
  console.log(`   VITE_ETH_SUBSCRIPTION_CONTRACT=${subscription.address}`);
  console.log("");
  console.log("3. Add to Netlify environment variables");
  console.log("");
  
  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    network: "baseSepolia",
    contractAddress: subscription.address,
    priceFeed: priceFeedAddress,
    paymentRecipient: "0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B",
    usdcToken: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    deployedAt: new Date().toISOString(),
    prices: {
      monthly: "$2.50",
      yearly: "$25.00"
    }
  };
  
  fs.writeFileSync(
    'eth-subscription-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("✅ Deployment info saved to eth-subscription-deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
