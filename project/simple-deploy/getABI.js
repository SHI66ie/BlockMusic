const { ethers } = require("hardhat");

async function main() {
  // Get the contract factory
  const Subscription = await ethers.getContractFactory("Subscription");
  
  // Get the ABI
  const abi = Subscription.interface.fragments;
  
  // Log all available functions and state variables
  console.log("\nContract ABI:");
  abi.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.type}: ${item.name || '(unnamed)'}`);
    if (item.inputs) {
      console.log(`   Inputs: ${JSON.stringify(item.inputs.map(i => ({name: i.name, type: i.type})))}`);
    }
    if (item.outputs) {
      console.log(`   Outputs: ${JSON.stringify(item.outputs.map(o => ({name: o.name, type: o.type})))}`);
    }
  });
  
  // Also log the deployed contract's public variables and functions
  console.log("\nTo interact with the contract, you can use the following:");
  console.log("1. subscription.DAILY_PRICE() - Get daily price");
  console.log("2. subscription.MONTHLY_PRICE() - Get monthly price");
  console.log("3. subscription.usdcToken() - Get USDC token address");
  console.log("4. subscription.owner() - Get contract owner");
  console.log("5. subscription.priceFeed() - Get price feed address");
  console.log("\nTo subscribe, you would need to call:");
  console.log("- subscribeWithUSDC(planId) - For USDC payments");
  console.log("- subscribeWithETH(planId) - For ETH payments (send value with the transaction)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
