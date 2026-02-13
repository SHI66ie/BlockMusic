const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("🚀 Deploying RevenueDistributor contract...\n");

    const [deployer] = await ethers.getSigners();

    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Deploy RevenueDistributor
    const RevenueDistributor = await ethers.getContractFactory("RevenueDistributor");

    console.log("Deploying RevenueDistributor...");
    const revenueDistributor = await RevenueDistributor.deploy();
    await revenueDistributor.waitForDeployment();

    const distributorAddress = await revenueDistributor.getAddress();
    console.log("✅ RevenueDistributor deployed to:", distributorAddress);

    // Save deployment info
    const deploymentInfo = {
        revenueDistributor: distributorAddress,
        deployer: deployer.address,
        network: network.name,
        deployedAt: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber()
    };

    const fs = require('fs');
    const deploymentPath = './revenue-distributor-deployment.json';
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n📝 Deployment info saved to:", deploymentPath);

    console.log("\n✅ Deployment Complete!");
    console.log("\n📋 Next Steps:");
    console.log("1. Verify contract on Basescan:");
    console.log(`   npx hardhat verify --network baseSepolia ${distributorAddress}`);
    console.log("\n2. Update SubscriptionV2 to send funds to RevenueDistributor");
    console.log("\n3. Update MusicNFT to register tracks with RevenueDistributor");
    console.log("\n4. Update backend to call recordSubscriberPlay()");
    console.log("\n5. Set up monthly cron job for revenue distribution");

    console.log("\n🔗 Contract Addresses:");
    console.log("RevenueDistributor:", distributorAddress);
    console.log("\nView on Basescan:");
    console.log(`https://sepolia.basescan.org/address/${distributorAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
