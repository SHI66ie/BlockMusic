const hre = require("hardhat");
const { upgrades } = require("hardhat");

async function main() {
  console.log("🎵 Deploying Upgradeable MusicNFT Contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

  const EXISTING_CONTRACT = "0x019211130714DEF2a46FFeF084D559313181BDFA";
  const platformWallet = deployer.address;
  const BACKEND_WALLET = "0xb89A51592Fca543a6879B12507aC64536eb23764";

  console.log("\n📝 Deploying upgradeable MusicNFT with incrementPlayCount function...");
  console.log("Old contract:", EXISTING_CONTRACT);
  
  const MusicNFT = await hre.ethers.getContractFactory("MusicNFT");
  
  console.log("\n⚠️  Note: Deploying NEW upgradeable proxy contract.");
  console.log("This will be a fresh contract - NFTs from old contract won't transfer automatically.\n");
  
  // Deploy new upgradeable proxy
  const musicNFT = await upgrades.deployProxy(
    MusicNFT,
    [platformWallet],
    { 
      initializer: 'initialize',
      kind: 'uups'
    }
  );
  
  await musicNFT.waitForDeployment();
  const proxyAddress = await musicNFT.getAddress();

  console.log("✅ Upgradeable MusicNFT deployed!");
  console.log("Proxy Address:", proxyAddress);
  console.log("Implementation:", await upgrades.erc1967.getImplementationAddress(proxyAddress));
  console.log("Admin:", await upgrades.erc1967.getAdminAddress(proxyAddress));
  
  console.log("\n🔧 Contract Details:");
  console.log("- Platform Wallet:", platformWallet);
  console.log("- Network:", hre.network.name);
  console.log("- Version:", await musicNFT.version());
  
  console.log("\n⚠️  IMPORTANT NEXT STEPS:");
  console.log("\n1. Transfer ownership to backend wallet:");
  console.log(`   Backend Wallet: ${BACKEND_WALLET}`);
  console.log(`   Run: npx hardhat run scripts/transfer-musicnft-ownership.js --network baseSepolia`);
  
  console.log("\n2. Update Cloudflare Worker wrangler.toml:");
  console.log(`   MUSIC_NFT_CONTRACT = "${proxyAddress}"`);
  
  console.log("\n3. Update Frontend .env:");
  console.log(`   VITE_MUSIC_NFT_CONTRACT=${proxyAddress}`);
  
  console.log("\n4. Redeploy Cloudflare Worker:");
  console.log("   cd cloudflare-worker && wrangler deploy");
  
  console.log("\n5. Update Frontend and redeploy to Netlify");

  console.log("\n✅ Deployment complete!");
  
  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    proxyAddress: proxyAddress,
    implementationAddress: await upgrades.erc1967.getImplementationAddress(proxyAddress),
    adminAddress: await upgrades.erc1967.getAdminAddress(proxyAddress),
    platformWallet: platformWallet,
    backendWallet: BACKEND_WALLET,
    deployer: deployer.address,
    oldContract: EXISTING_CONTRACT,
    timestamp: new Date().toISOString(),
    version: "2.0.0-upgradeable"
  };
  
  fs.writeFileSync(
    'deployment-musicnft-upgrade.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n💾 Deployment info saved to deployment-musicnft-upgrade.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
