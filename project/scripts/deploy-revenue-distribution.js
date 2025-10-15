const hre = require("hardhat");

async function main() {
  console.log("Deploying RevenueDistribution contract...");

  // Configuration
  const PLATFORM_WALLET = process.env.PLATFORM_WALLET || "0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B";
  const MUSIC_NFT_CONTRACT = process.env.VITE_MUSIC_NFT_CONTRACT || "0x019211130714DEF2a46FFeF084D559313181BDFA";
  const USDC_TOKEN = process.env.VITE_USDC_TOKEN || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  console.log("Configuration:");
  console.log("- Platform Wallet:", PLATFORM_WALLET);
  console.log("- Music NFT Contract:", MUSIC_NFT_CONTRACT);
  console.log("- USDC Token:", USDC_TOKEN);

  // Get the contract factory
  const RevenueDistribution = await hre.ethers.getContractFactory("RevenueDistribution");

  // Deploy the contract
  const revenueDistribution = await RevenueDistribution.deploy(
    PLATFORM_WALLET,
    MUSIC_NFT_CONTRACT,
    USDC_TOKEN
  );

  await revenueDistribution.deployed();

  console.log("\n✅ RevenueDistribution deployed to:", revenueDistribution.address);
  console.log("\nAdd this to your .env file:");
  console.log(`VITE_REVENUE_DISTRIBUTION_CONTRACT=${revenueDistribution.address}`);

  // Verify configuration
  console.log("\nVerifying configuration...");
  const platformWallet = await revenueDistribution.platformWallet();
  const musicNFTContract = await revenueDistribution.musicNFTContract();
  const usdcToken = await revenueDistribution.usdcToken();
  const platformFeePercent = await revenueDistribution.PLATFORM_FEE_PERCENT();
  const artistPoolPercent = await revenueDistribution.ARTIST_POOL_PERCENT();

  console.log("- Platform Wallet:", platformWallet);
  console.log("- Music NFT Contract:", musicNFTContract);
  console.log("- USDC Token:", usdcToken);
  console.log("- Platform Fee:", platformFeePercent.toString() + "%");
  console.log("- Artist Pool:", artistPoolPercent.toString() + "%");

  // Wait for a few block confirmations
  console.log("\nWaiting for block confirmations...");
  await revenueDistribution.deployTransaction.wait(5);

  console.log("\n📝 To verify the contract on Basescan, run:");
  console.log(`npx hardhat verify --network base-sepolia ${revenueDistribution.address} "${PLATFORM_WALLET}" "${MUSIC_NFT_CONTRACT}" "${USDC_TOKEN}"`);

  console.log("\n✅ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
