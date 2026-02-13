const { ethers } = require("hardhat");
const fs = require('fs');

/**
 * Complete Deployment and Setup Script for Revenue System
 * 
 * This script will:
 * 1. Deploy RevenueDistributor
 * 2. Update MusicNFT proxy to set RevenueDistributor
 * 3. Update SubscriptionV2 to set RevenueDistributor
 * 4. Verify all configurations
 */

async function main() {
    console.log("🚀 Starting Complete Revenue System Setup...\n");
    console.log("=".repeat(60));

    const [deployer] = await ethers.getSigners();

    console.log("\n📋 Deployment Information:");
    console.log("Deployer address:", deployer.address);
    console.log("Network:", network.name);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Load existing contract addresses
    let musicNFTAddress, subscriptionAddress;

    try {
        // Try to load from deployment files
        const musicDeployment = JSON.parse(fs.readFileSync('./music-nft-deployment.json', 'utf8'));
        musicNFTAddress = musicDeployment.proxy || musicDeployment.musicNFT;

        const subDeployment = JSON.parse(fs.readFileSync('./eth-subscription-deployment.json', 'utf8'));
        subscriptionAddress = subDeployment.contract || subDeployment.subscription;

        console.log("✅ Loaded existing contract addresses:");
        console.log("   MusicNFT (proxy):", musicNFTAddress);
        console.log("   SubscriptionV2:", subscriptionAddress);
    } catch (error) {
        console.log("⚠️  Could not load existing deployments. Please enter manually:\n");
        // You would manually set these or prompt for them
        throw new Error("Please set contract addresses manually in the script");
    }

    console.log("\n" + "=".repeat(60));
    console.log("STEP 1: Deploy RevenueDistributor");
    console.log("=".repeat(60));

    const RevenueDistributor = await ethers.getContractFactory("RevenueDistributor");
    console.log("Deploying RevenueDistributor...");

    const revenueDistributor = await RevenueDistributor.deploy();
    await revenueDistributor.waitForDeployment();

    const distributorAddress = await revenueDistributor.getAddress();
    console.log("✅ RevenueDistributor deployed to:", distributorAddress);

    // Wait for block confirmations
    console.log("⏳ Waiting for block confirmations...");
    await revenueDistributor.deploymentTransaction().wait(3);
    console.log("✅ Confirmed!");

    console.log("\n" + "=".repeat(60));
    console.log("STEP 2: Configure MusicNFT");
    console.log("=".repeat(60));

    const MusicNFT = await ethers.getContractFactory("MusicNFT");
    const musicNFT = MusicNFT.attach(musicNFTAddress);

    try {
        console.log("Setting RevenueDistributor on MusicNFT...");
        const tx1 = await musicNFT.setRevenueDistributor(distributorAddress);
        await tx1.wait();
        console.log("✅ MusicNFT configured with RevenueDistributor");

        // Verify
        const setDistributor = await musicNFT.revenueDistributor();
        console.log("   Verified RevenueDistributor:", setDistributor);

        // Check mint fee
        const mintFee = await musicNFT.getMintFee();
        console.log("   Current Mint Fee:", ethers.formatEther(mintFee), "ETH");

    } catch (error) {
        console.error("❌ Error configuring MusicNFT:", error.message);
        console.log("   You may need to configure this manually");
    }

    console.log("\n" + "=".repeat(60));
    console.log("STEP 3: Configure SubscriptionV2");
    console.log("=".repeat(60));

    const SubscriptionV2 = await ethers.getContractFactory("SubscriptionV2");
    const subscription = SubscriptionV2.attach(subscriptionAddress);

    try {
        console.log("Setting RevenueDistributor on SubscriptionV2...");
        const tx2 = await subscription.setRevenueDistributor(distributorAddress);
        await tx2.wait();
        console.log("✅ SubscriptionV2 configured with RevenueDistributor");

        // Verify
        const setDistributor2 = await subscription.getRevenueDistributor();
        console.log("   Verified RevenueDistributor:", setDistributor2);

    } catch (error) {
        console.error("❌ Error configuring SubscriptionV2:", error.message);
        console.log("   You may need to configure this manually");
    }

    console.log("\n" + "=".repeat(60));
    console.log("STEP 4: Verify Configuration");
    console.log("=".repeat(60));

    // Check RevenueDistributor stats
    const stats = await revenueDistributor.getDistributionStats();
    console.log("RevenueDistributor Status:");
    console.log("   Current Revenue Pool:", ethers.formatEther(stats[0]), "ETH");
    console.log("   Total Plays This Period:", stats[1].toString());
    console.log("   Total Distributed:", ethers.formatEther(stats[3]), "ETH");

    // Save deployment info
    const deploymentInfo = {
        network: network.name,
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber(),
        contracts: {
            revenueDistributor: distributorAddress,
            musicNFT: musicNFTAddress,
            subscriptionV2: subscriptionAddress
        },
        configuration: {
            platformFeePercent: 20,
            mintFee: ethers.formatEther(await musicNFT.getMintFee()) + " ETH",
            distributionPeriod: "30 days"
        }
    };

    const deploymentPath = './revenue-system-deployment.json';
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📝 Deployment info saved to:", deploymentPath);

    console.log("\n" + "=".repeat(60));
    console.log("✅ DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));

    console.log("\n📋 Contract Addresses:");
    console.log("   RevenueDistributor:", distributorAddress);
    console.log("   MusicNFT:", musicNFTAddress);
    console.log("   SubscriptionV2:", subscriptionAddress);

    console.log("\n🔗 View on Basescan:");
    console.log(`   RevenueDistributor: https://sepolia.basescan.org/address/${distributorAddress}`);
    console.log(`   MusicNFT: https://sepolia.basescan.org/address/${musicNFTAddress}`);
    console.log(`   SubscriptionV2: https://sepolia.basescan.org/address/${subscriptionAddress}`);

    console.log("\n📋 Next Steps:");
    console.log("1. Verify RevenueDistributor on Basescan:");
    console.log(`   npx hardhat verify --network baseSepolia ${distributorAddress}`);

    console.log("\n2. Update Backend:");
    console.log("   - Add RevenueDistributor address to backend config");
    console.log("   - Implement recordSubscriberPlay() calls");
    console.log("   - Set up monthly distribution cron job");

    console.log("\n3. Update Frontend:");
    console.log("   - Add mint fee display on upload page");
    console.log("   - Show artist revenue dashboard");
    console.log("   - Display subscription revenue split");

    console.log("\n4. Test the System:");
    console.log("   - Upload a track (test mint fee)");
    console.log("   - Subscribe (test revenue split)");
    console.log("   - Play tracks (test play recording)");
    console.log("   - Run distribution (test artist payments)");

    console.log("\n💰 Revenue Model Active:");
    console.log("   - Platform gets 20% of subscriptions");
    console.log("   - Artists get 80% of subscriptions");
    console.log("   - Mint fee: ~$2-3 per upload");
    console.log("   - Per-play: 15% platform, 85% artist");

    console.log("\n🎉 Your app is now self-sustaining!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:", error);
        process.exit(1);
    });
