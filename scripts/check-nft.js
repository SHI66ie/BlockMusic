const hre = require("hardhat");

async function main() {
  const MUSIC_NFT_CONTRACT = "0xbB509d5A144E3E3d240D7CFEdffC568BE35F1348";
  
  console.log("Checking MusicNFT contract:", MUSIC_NFT_CONTRACT);
  console.log("");
  
  // Get contract instance
  const MusicNFT = await hre.ethers.getContractFactory("MusicNFT");
  const musicNFT = await MusicNFT.attach(MUSIC_NFT_CONTRACT);
  
  try {
    // Get total supply
    const totalSupply = await musicNFT.totalSupply();
    console.log("Total NFTs minted:", totalSupply.toString());
    console.log("");
    
    if (totalSupply.toString() === "0") {
      console.log("No NFTs have been minted yet.");
      return;
    }
    
    // Get metadata for each NFT
    for (let i = 0; i < totalSupply; i++) {
      console.log(`NFT #${i}:`);
      
      try {
        const metadata = await musicNFT.getMusicMetadata(i);
        console.log("  Track Title:", metadata.trackTitle);
        console.log("  Artist:", metadata.artistName);
        console.log("  Album:", metadata.albumName);
        console.log("  Genre:", metadata.genre);
        console.log("  Release Type:", metadata.releaseType);
        console.log("  Artist Address:", metadata.artist);
        console.log("  Play Count:", metadata.playCount.toString());
        console.log("  Explicit:", metadata.isExplicit);
        console.log("  Cover Art URI:", metadata.coverArtURI);
        console.log("  Audio URI:", metadata.audioURI);
        console.log("");
      } catch (error) {
        console.log("  Error fetching metadata:", error.message);
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
