const hre = require("hardhat");

async function main() {
  console.log("========================================");
  console.log("Deploying Complete Revenue System");
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

  // Wait for confirmations
  console.log("Waiting for 3 confirmations...");
  await revenueDistribution.deployTransaction.wait(3);

  // Step 2: Deploy SubscriptionV3
  console.log("\nStep 2: Deploying SubscriptionV3...");
  const SubscriptionV3 = await hre.ethers.getContractFactory("SubscriptionV3");
  const subscription = await SubscriptionV3.deploy(revenueDistribution.address);
  await subscription.deployed();
  console.log("✅ SubscriptionV3 deployed to:", subscription.address);

  // Wait for confirmations
  console.log("Waiting for 3 confirmations...");
  await subscription.deployTransaction.wait(3);

  // Verify deployment
  console.log("\n========================================");
  console.log("Deployment Summary");
  console.log("========================================\n");

  console.log("RevenueDistribution Contract:");
  console.log("- Address:", revenueDistribution.address);
  console.log("- Platform Wallet:", await revenueDistribution.platformWallet());
  console.log("- Music NFT Contract:", await revenueDistribution.musicNFTContract());
  console.log("- USDC Token:", await revenueDistribution.usdcToken());
  console.log("- Platform Fee:", (await revenueDistribution.PLATFORM_FEE_PERCENT()).toString() + "%");
  console.log("- Artist Pool:", (await revenueDistribution.ARTIST_POOL_PERCENT()).toString() + "%");

  console.log("\nSubscriptionV3 Contract:");
  console.log("- Address:", subscription.address);
  console.log("- Revenue Distribution:", await subscription.revenueDistribution());
  console.log("- USDC Token:", await subscription.usdcToken());
  console.log("- Monthly Price:", hre.ethers.utils.formatUnits(await subscription.MONTHLY_PRICE(), 6), "USDC");
  console.log("- 3-Month Price:", hre.ethers.utils.formatUnits(await subscription.THREE_MONTH_PRICE(), 6), "USDC");
  console.log("- Yearly Price:", hre.ethers.utils.formatUnits(await subscription.YEARLY_PRICE(), 6), "USDC");

  console.log("\n========================================");
  console.log("Environment Variables");
  console.log("========================================\n");

  console.log("Add these to your .env file:");
  console.log(`VITE_REVENUE_DISTRIBUTION_CONTRACT=${revenueDistribution.address}`);
  console.log(`VITE_SUBSCRIPTION_CONTRACT=${subscription.address}`);

  console.log("\n========================================");
  console.log("Verification Commands");
  console.log("========================================\n");

  console.log("Verify RevenueDistribution:");
  console.log(`npx hardhat verify --network base-sepolia ${revenueDistribution.address} "${PLATFORM_WALLET}" "${MUSIC_NFT_CONTRACT}" "${USDC_TOKEN}"`);

  console.log("\nVerify SubscriptionV3:");
  console.log(`npx hardhat verify --network base-sepolia ${subscription.address} "${revenueDistribution.address}"`);

  console.log("\n========================================");
  console.log("Next Steps");
  console.log("========================================\n");

  console.log("1. ✅ Update .env with the new contract addresses");
  console.log("2. ✅ Verify contracts on Basescan (optional but recommended)");
  console.log("3. ✅ Test subscription flow on testnet");
  console.log("4. ✅ Test artist revenue claim flow");
  console.log("5. ⏳ Get contracts audited before mainnet");
  console.log("6. ⏳ Deploy to mainnet");

  console.log("\n✅ All contracts deployed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
