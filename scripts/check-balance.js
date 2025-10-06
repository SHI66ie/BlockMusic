const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Wallet Address:", deployer.address);
  console.log("");
  
  const balance = await deployer.getBalance();
  const balanceInEth = hre.ethers.utils.formatEther(balance);
  
  console.log("Base Sepolia Balance:", balanceInEth, "ETH");
  console.log("Balance in Wei:", balance.toString());
  console.log("");
  
  if (balance.eq(0)) {
    console.log("❌ No ETH found on Base Sepolia!");
    console.log("");
    console.log("Get Base Sepolia ETH from:");
    console.log("1. https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    console.log("2. Bridge from Sepolia: https://bridge.base.org/");
    console.log("");
    console.log("Send ETH to:", deployer.address);
  } else {
    console.log("✅ Wallet has sufficient balance for deployment");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
