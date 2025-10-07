const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Deploying MusicNFT Contract to Base Sepolia...");
  console.log("");
  
  // Platform wallet (receives fees)
  const PLATFORM_WALLET = "0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B";
  
  console.log("Platform Wallet:", PLATFORM_WALLET);
  console.log("");
  
  // Deploy contract
  const MusicNFT = await hre.ethers.getContractFactory("MusicNFT");
  const musicNFT = await MusicNFT.deploy(PLATFORM_WALLET);
  
  await musicNFT.deployed();
  const contractAddress = musicNFT.address;
  
  console.log("✅ MusicNFT deployed to:", contractAddress);
  console.log("");
  
  console.log("📋 Contract Details:");
  console.log("- Network: Base Sepolia");
  console.log("- Contract Address:", contractAddress);
  console.log("- Platform Wallet:", PLATFORM_WALLET);
  console.log("- Platform Fee: 2.5%");
  console.log("");
  
  // Save deployment info
  const deploymentInfo = {
    network: "baseSepolia",
    contractAddress: contractAddress,
    platformWallet: PLATFORM_WALLET,
    platformFee: "2.5%",
    deployedAt: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    "music-nft-deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("🔧 Next Steps:");
  console.log("1. Verify contract on Basescan:");
  console.log(`   npx hardhat verify --network baseSepolia ${contractAddress} "${PLATFORM_WALLET}"`);
  console.log("");
  console.log("2. Update environment variable:");
  console.log(`   VITE_MUSIC_NFT_CONTRACT=${contractAddress}`);
  console.log("");
  console.log("3. Add to Netlify environment variables");
  console.log("");
  console.log("✅ Deployment info saved to music-nft-deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
