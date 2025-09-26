const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Subscription contract...");
  
  // The price feed address - using a mock for Base Sepolia
  const MOCK_PRICE_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
  
  // Deploy the contract
  const Subscription = await ethers.getContractFactory("Subscription");
  const subscription = await Subscription.deploy(MOCK_PRICE_FEED);
  
  await subscription.deployed();
  
  console.log(`Subscription deployed to: ${subscription.address}`);
  
  // Now interact with the deployed contract
  console.log("\nInteracting with the deployed contract...");
  
  // 1. Get contract owner
  const owner = await subscription.owner();
  console.log(`Contract Owner: ${owner}`);
  
  // 2. Get USDC token address
  const usdcToken = await subscription.usdcToken();
  console.log(`USDC Token Address: ${usdcToken}`);
  
  // 3. Get price feed address
  const priceFeed = await subscription.priceFeed();
  console.log(`Price Feed Address: ${priceFeed}`);
  
  // 4. Get subscription prices
  console.log("\nSubscription Prices:");
  const dailyPrice = await subscription.DAILY_PRICE();
  const monthlyPrice = await subscription.MONTHLY_PRICE();
  console.log(`- Daily Price: ${ethers.utils.formatUnits(dailyPrice, 18)} USDC`);
  console.log(`- Monthly Price: ${ethers.utils.formatUnits(monthlyPrice, 18)} USDC`);
  
  console.log("\nDeployment and interaction complete!");
  console.log(`You can now interact with the contract at: ${subscription.address}`);
  console.log("\nTo verify the contract on BaseScan, run:");
  console.log(`npx hardhat verify --network baseSepolia ${subscription.address} "${MOCK_PRICE_FEED}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
