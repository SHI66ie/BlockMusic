const hre = require("hardhat");

async function main() {
  console.log("\n========================================");
  console.log("Deploying Revenue Distribution System");
  console.log("========================================\n");

  // Configuration
  const PLATFORM_WALLET = process.env.PLATFORM_WALLET || "0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B";
  const MUSIC_NFT_CONTRACT = process.env.VITE_MUSIC_NFT_CONTRACT || "0x019211130714DEF2a46FFeF084D559313181BDFA";
  const USDC_TOKEN = process.env.VITE_USDC_TOKEN || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  console.log("Configuration:");
  console.log("- Platform Wallet:", PLATFORM_WALLET);
  console.log("- Music NFT Contract:", MUSIC_NFT_CONTRACT);
  console.log("- USDC Token:", USDC_TOKEN);
  console.log("");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  console.log("");

  // Step 1: Deploy RevenueDistribution
  console.log("Step 1: Deploying RevenueDistribution...");
  const RevenueDistribution = await hre.ethers.getContractFactory("RevenueDistribution");
  const revenueDistribution = await RevenueDistribution.deploy(
    PLATFORM_WALLET,
    MUSIC_NFT_CONTRACT,
    USDC_TOKEN
  );
  await revenueDistribution.deployed();
  console.log("✅ RevenueDistribution deployed to:", revenueDistribution.address);

  // Step 2: Deploy SubscriptionV3
  console.log("\nStep 2: Deploying SubscriptionV3...");
  const SubscriptionV3 = await hre.ethers.getContractFactory("SubscriptionV3");
  const subscription = await SubscriptionV3.deploy(revenueDistribution.address);
  await subscription.deployed();
  console.log("✅ SubscriptionV3 deployed to:", subscription.address);

  // Summary
  console.log("\n========================================");
  console.log("Deployment Complete!");
  console.log("========================================\n");

  console.log("Contract Addresses:");
  console.log("- RevenueDistribution:", revenueDistribution.address);
  console.log("- SubscriptionV3:", subscription.address);

  console.log("\n📝 Add these to your .env file:");
  console.log(`VITE_REVENUE_DISTRIBUTION_CONTRACT=${revenueDistribution.address}`);
  console.log(`VITE_SUBSCRIPTION_CONTRACT=${subscription.address}`);

  console.log("\n✅ Deployment successful!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
