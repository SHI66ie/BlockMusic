const hre = require("hardhat");

async function main() {
  // Chainlink ETH/USD Price Feed on Base Sepolia
  const CHAINLINK_ETH_USD_BASE_SEPOLIA = "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1";
  
  // Your deployed SubscriptionV2 contract
  const SUBSCRIPTION_CONTRACT = "0x1d336b8cCA220d596f0e2Fd368fa2424dcbB987A";
  
  console.log("Updating price feed for SubscriptionV2 contract...");
  console.log("Contract:", SUBSCRIPTION_CONTRACT);
  console.log("Price Feed:", CHAINLINK_ETH_USD_BASE_SEPOLIA);
  console.log("");
  
  // Get contract instance
  const SubscriptionV2 = await hre.ethers.getContractFactory("SubscriptionV2");
  const subscription = await SubscriptionV2.attach(SUBSCRIPTION_CONTRACT);
  
  // Update price feed
  console.log("Sending transaction to update price feed...");
  const tx = await subscription.setPriceFeed(CHAINLINK_ETH_USD_BASE_SEPOLIA);
  
  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for confirmation...");
  
  await tx.wait();
  
  console.log("");
  console.log("✅ Price feed updated successfully!");
  console.log("");
  console.log("The contract will now use real-time ETH/USD prices from Chainlink");
  console.log("Price Feed Address:", CHAINLINK_ETH_USD_BASE_SEPOLIA);
  console.log("");
  
  // Test the price
  const currentPrice = await subscription.getETHPrice();
  const priceInUSD = currentPrice / 10**8;
  
  console.log("Current ETH Price:", `$${priceInUSD.toFixed(2)}`);
  console.log("");
  console.log("Subscription will now charge exact USD equivalent in ETH:");
  console.log("- Monthly ($2.50):", (2.5 / priceInUSD).toFixed(6), "ETH");
  console.log("- 3 Months ($6.75):", (6.75 / priceInUSD).toFixed(6), "ETH");
  console.log("- Yearly ($25.00):", (25 / priceInUSD).toFixed(6), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
