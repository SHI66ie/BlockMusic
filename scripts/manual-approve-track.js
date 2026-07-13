const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting manual approval of track...");

  // Parse arguments
  const args = process.argv.slice(2);
  const trackId = args[0];

  if (!trackId) {
    console.error("Please provide a track ID.");
    console.error("Usage: npx hardhat run scripts/manual-approve-track.js <track_id>");
    process.exit(1);
  }

  // Get the proxy address from the deployment file
  let proxyAddress = process.env.VITE_MUSIC_NFT_CONTRACT;

  if (!proxyAddress) {
    const deployPath = path.join(__dirname, "..", "music-nft-deployment.json");
    if (fs.existsSync(deployPath)) {
      const deployment = JSON.parse(fs.readFileSync(deployPath, "utf-8"));
      proxyAddress = deployment.musicNFT;
    }
  }

  if (!proxyAddress) {
    throw new Error("Could not find MusicNFT proxy address. Please set VITE_MUSIC_NFT_CONTRACT in .env.");
  }

  console.log(`Using MusicNFT contract at: ${proxyAddress}`);
  console.log(`Approving track ID: ${trackId}`);

  // Get contract instance
  const MusicNFT = await ethers.getContractFactory("MusicNFT");
  const musicNFT = MusicNFT.attach(proxyAddress);
  
  // Set moderation status
  const tx = await musicNFT.setModerationStatus(trackId, true);
  console.log(`Transaction sent. Hash: ${tx.hash}`);
  
  await tx.wait();
  console.log("✅ Track successfully approved!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
