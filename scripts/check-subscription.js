const hre = require("hardhat");

async function main() {
  // The OLD contract that received the payment
  const OLD_CONTRACT = "0x88A1c58B702F8B280BBaa16aa52807BdE8357f9b";
  
  // The NEW contract with isSubscribed function
  const NEW_CONTRACT = "0x1d336b8cCA220d596f0e2Fd368fa2424dcbB987A";
  
  // User's wallet address
  const userAddress = process.argv[2];
  
  if (!userAddress) {
    console.log("Usage: npx hardhat run scripts/check-subscription.js --network baseSepolia <USER_ADDRESS>");
    process.exit(1);
  }
  
  console.log("Checking subscription for:", userAddress);
  console.log("");
  
  // Get contract factory
  const SubscriptionV2 = await hre.ethers.getContractFactory("SubscriptionV2");
  
  // Check OLD contract
  console.log("Checking OLD contract:", OLD_CONTRACT);
  try {
    const oldContract = await SubscriptionV2.attach(OLD_CONTRACT);
    
    // Try to call getSubscriptionStatus
    const status = await oldContract.getSubscriptionStatus(userAddress);
    console.log("  Status:", status);
    console.log("  Is Active:", status.isActive);
    console.log("  Remaining Time:", status.remainingTime.toString(), "seconds");
    
    // Try to call isSubscribed if it exists
    try {
      const isSubscribed = await oldContract.isSubscribed(userAddress);
      console.log("  isSubscribed:", isSubscribed);
    } catch (e) {
      console.log("  isSubscribed: Function not available on old contract");
    }
  } catch (error) {
    console.log("  Error:", error.message);
  }
  
  console.log("");
  
  // Check NEW contract
  console.log("Checking NEW contract:", NEW_CONTRACT);
  try {
    const newContract = await SubscriptionV2.attach(NEW_CONTRACT);
    
    const status = await newContract.getSubscriptionStatus(userAddress);
    console.log("  Status:", status);
    console.log("  Is Active:", status.isActive);
    console.log("  Remaining Time:", status.remainingTime.toString(), "seconds");
    
    const isSubscribed = await newContract.isSubscribed(userAddress);
    console.log("  isSubscribed:", isSubscribed);
  } catch (error) {
    console.log("  Error:", error.message);
  }
  
  console.log("");
  console.log("SOLUTION:");
  console.log("Update Netlify environment variable:");
  console.log(`VITE_ETH_SUBSCRIPTION_CONTRACT=${NEW_CONTRACT}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
