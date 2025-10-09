const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0x11Afd68F00230dfaC3970496F4185fd8643e7e0C";
  const TOKEN_ID = 3;

  console.log("Testing tokenURI for contract:", CONTRACT_ADDRESS);
  console.log("Token ID:", TOKEN_ID);
  console.log("");

  const MusicNFT = await hre.ethers.getContractFactory("MusicNFT");
  const contract = MusicNFT.attach(CONTRACT_ADDRESS);

  try {
    const tokenURI = await contract.tokenURI(TOKEN_ID);
    console.log("✅ Token URI:", tokenURI);
    
    if (tokenURI === "") {
      console.log("❌ Token URI is EMPTY - metadata was not saved!");
    } else {
      console.log("✅ Token URI is set correctly!");
    }
  } catch (error) {
    console.log("❌ Error reading tokenURI:", error.message);
  }

  // Also check the musicMetadata
  try {
    const metadata = await contract.getMusicMetadata(TOKEN_ID);
    console.log("");
    console.log("Music Metadata from contract:");
    console.log("- Track Title:", metadata.trackTitle);
    console.log("- Artist:", metadata.artistName);
    console.log("- Audio URI:", metadata.audioURI);
    console.log("- Cover Art URI:", metadata.coverArtURI);
  } catch (error) {
    console.log("❌ Error reading metadata:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
