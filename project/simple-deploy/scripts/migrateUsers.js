// This script helps migrate users from the old contract to the new one
// It should be executed after deploying the new SubscriptionV2 contract

const { ethers } = require("hardhat");

async function main() {
  // Replace these with your actual contract addresses
  const OLD_CONTRACT_ADDRESS = "OLD_CONTRACT_ADDRESS_HERE";
  const NEW_CONTRACT_ADDRESS = "NEW_CONTRACT_ADDRESS_HERE";
  
  // Get the contract factories
  const OldSubscription = await ethers.getContractFactory("Subscription");
  const NewSubscription = await ethers.getContractFactory("SubscriptionV2");
  
  // Connect to the deployed contracts
  const oldContract = await OldSubscription.attach(OLD_CONTRACT_ADDRESS);
  const newContract = await NewSubscription.attach(NEW_CONTRACT_ADDRESS);
  
  console.log("Connected to contracts:");
  console.log(`- Old contract: ${OLD_CONTRACT_ADDRESS}`);
  console.log(`- New contract: ${NEW_CONTRACT_ADDRESS}`);
  
  // Example: Get subscription info for a specific user
  const userAddress = "USER_ADDRESS_HERE"; // Replace with actual user address
  
  try {
    const [isActive, endTime] = await oldContract.getSubscriptionStatus(userAddress);
    console.log(`\nUser ${userAddress} subscription status in old contract:`);
    console.log(`- Active: ${isActive}`);
    console.log(`- End time: ${new Date(endTime * 1000).toISOString()}`);
    
    if (isActive) {
      console.log("\nTo migrate this user to the new contract, you would need to:");
      console.log("1. Calculate remaining time");
      console.log("2. Call a migration function (if implemented in the new contract)");
      console.log("3. Verify the migration was successful");
    }
  } catch (error) {
    console.error("Error fetching subscription status:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
