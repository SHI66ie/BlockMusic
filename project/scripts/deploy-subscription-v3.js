const hre = require("hardhat");

async function main() {
  console.log("Deploying SubscriptionV3 contract...");

  // Configuration - MUST have RevenueDistribution deployed first
  const REVENUE_DISTRIBUTION = process.env.VITE_REVENUE_DISTRIBUTION_CONTRACT;

  if (!REVENUE_DISTRIBUTION || REVENUE_DISTRIBUTION === "0x...") {
    console.error("\n❌ Error: VITE_REVENUE_DISTRIBUTION_CONTRACT not set!");
    console.error("Please deploy RevenueDistribution first and set the address in .env");
    process.exit(1);
  }

  console.log("Configuration:");
  console.log("- Revenue Distribution Contract:", REVENUE_DISTRIBUTION);

  // Get the contract factory
  const SubscriptionV3 = await hre.ethers.getContractFactory("SubscriptionV3");

  // Deploy the contract
  const subscription = await SubscriptionV3.deploy(REVENUE_DISTRIBUTION);

  await subscription.deployed();

  console.log("\n✅ SubscriptionV3 deployed to:", subscription.address);
  console.log("\nUpdate this in your .env file:");
  console.log(`VITE_SUBSCRIPTION_CONTRACT=${subscription.address}`);

  // Verify configuration
  console.log("\nVerifying configuration...");
  const revenueDistribution = await subscription.revenueDistribution();
  const usdcToken = await subscription.usdcToken();
  const monthlyPrice = await subscription.MONTHLY_PRICE();
  const threeMonthPrice = await subscription.THREE_MONTH_PRICE();
  const yearlyPrice = await subscription.YEARLY_PRICE();

  console.log("- Revenue Distribution:", revenueDistribution);
  console.log("- USDC Token:", usdcToken);
  console.log("- Monthly Price:", hre.ethers.utils.formatUnits(monthlyPrice, 6), "USDC");
  console.log("- 3-Month Price:", hre.ethers.utils.formatUnits(threeMonthPrice, 6), "USDC");
  console.log("- Yearly Price:", hre.ethers.utils.formatUnits(yearlyPrice, 6), "USDC");

  // Wait for a few block confirmations
  console.log("\nWaiting for block confirmations...");
  await subscription.deployTransaction.wait(5);

  console.log("\n📝 To verify the contract on Basescan, run:");
  console.log(`npx hardhat verify --network base-sepolia ${subscription.address} "${REVENUE_DISTRIBUTION}"`);

  console.log("\n✅ Deployment complete!");
  console.log("\n⚠️  IMPORTANT: Update your frontend to use the new subscription contract address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
