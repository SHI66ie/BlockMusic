const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔐 Transferring MusicNFT Ownership...\n");

  // Read deployment info
  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-musicnft-upgrade.json', 'utf8'));
  const PROXY_ADDRESS = deploymentInfo.proxyAddress;
  const BACKEND_WALLET = "0xb89A51592Fca543a6879B12507aC64536eb23764";

  const [deployer] = await hre.ethers.getSigners();
  console.log("Current owner:", deployer.address);
  console.log("New owner (backend wallet):", BACKEND_WALLET);
  console.log("Contract:", PROXY_ADDRESS);

  const MusicNFT = await hre.ethers.getContractFactory("MusicNFT");
  const musicNFT = MusicNFT.attach(PROXY_ADDRESS);

  console.log("\n📝 Transferring ownership...");
  const tx = await musicNFT.transferOwnership(BACKEND_WALLET);
  await tx.wait();

  console.log("✅ Ownership transferred!");
  console.log("Transaction:", tx.hash);
  
  console.log("\n🎉 Backend wallet can now call incrementPlayCount()!");
  console.log("Cloudflare Worker is ready to sync play counts to blockchain.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
