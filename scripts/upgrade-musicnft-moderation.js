const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting MusicNFT upgrade to add GenLayer moderation toggle...");

  // Get the proxy address from the deployment file
  const upgradeDeployPath = path.join(__dirname, "..", "deployment-musicnft-upgrade.json");
  let proxyAddress;

  if (fs.existsSync(upgradeDeployPath)) {
    const upgradeDeployment = JSON.parse(fs.readFileSync(upgradeDeployPath, "utf-8"));
    proxyAddress = upgradeDeployment.proxyAddress;
    console.log(`Found proxy address from upgrade deployment file: ${proxyAddress}`);
  } else {
    const deployPath = path.join(__dirname, "..", "music-nft-deployment.json");
    if (fs.existsSync(deployPath)) {
        const deployment = JSON.parse(fs.readFileSync(deployPath, "utf-8"));
        proxyAddress = deployment.contractAddress;
        console.log(`Found proxy address from deployment file: ${proxyAddress}`);
    } else {
        proxyAddress = process.env.VITE_MUSIC_NFT_CONTRACT;
        if (!proxyAddress) {
            throw new Error("Could not find MusicNFT proxy address to upgrade. Please set VITE_MUSIC_NFT_CONTRACT in .env or run a fresh deploy.");
        }
        console.log(`Using proxy address from VITE_MUSIC_NFT_CONTRACT env var: ${proxyAddress}`);
    }
  }

  const MusicNFT = await ethers.getContractFactory("MusicNFT");
  
  console.log(`Upgrading MusicNFT at proxy address: ${proxyAddress}`);
  const musicNFT = await upgrades.upgradeProxy(proxyAddress, MusicNFT);
  
  await musicNFT.waitForDeployment();
  console.log("MusicNFT upgraded successfully!");
  
  // No need to initialize again, but we should make sure the flag is false (default)
  const isEnforced = await musicNFT.isModerationEnforced();
  console.log(`isModerationEnforced is currently: ${isEnforced}`);
  
  console.log("\nUpgrade complete! The minting process can now safely bypass the strict GenLayer moderation check if needed.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
