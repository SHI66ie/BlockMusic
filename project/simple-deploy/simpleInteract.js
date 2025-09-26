const { ethers } = require("hardhat");

async function main() {
  // Contract address from the deployment
  const contractAddress = "0x8bf5B4D3223A1771aBde0658B7EB575Ae557fAAe3";
  
  // Get the contract factory and attach to the deployed address
  const Subscription = await ethers.getContractFactory("Subscription");
  const subscription = await Subscription.attach(contractAddress);
  
  // Get the current signer (account)
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);
  
  // 1. Get contract owner
  const owner = await subscription.owner();
  console.log(`\nContract Owner: ${owner}`);
  
  // 2. Get USDC token address
  const usdcToken = await subscription.usdcToken();
  console.log(`\nUSDC Token Address: ${usdcToken}`);
  
  // 3. Get price feed address
  const priceFeed = await subscription.priceFeed();
  console.log(`\nPrice Feed Address: ${priceFeed}`);
  
  // 4. Get subscription prices
  console.log("\nSubscription Prices:");
  const dailyPrice = await subscription.DAILY_PRICE();
  const monthlyPrice = await subscription.MONTHLY_PRICE();
  console.log(`- Daily Price: ${ethers.utils.formatUnits(dailyPrice, 18)} USDC`);
  console.log(`- Monthly Price: ${ethers.utils.formatUnits(monthlyPrice, 18)} USDC`);
  
  // 5. Check if the current user is subscribed
  console.log("\nChecking subscription status...");
  try {
    // Try to get the user's subscription details
    const userSubscription = await subscription.userSubscriptions(signer.address);
    const currentTime = Math.floor(Date.now() / 1000);
    const isSubscribed = userSubscription.isActive && userSubscription.endTime > currentTime;
    
    console.log(`Is ${signer.address} subscribed? ${isSubscribed}`);
    
    if (isSubscribed) {
      console.log("\nSubscription Details:");
      console.log(`- Plan ID: ${userSubscription.planId}`);
      console.log(`- Start Time: ${new Date(userSubscription.startTime * 1000)}`);
      console.log(`- End Time: ${new Date(userSubscription.endTime * 1000)}`);
      console.log(`- Active: ${userSubscription.isActive}`);
      console.log(`- Total Paid: ${ethers.utils.formatUnits(userSubscription.totalPaid, 18)} USDC`);
    }
  } catch (error) {
    console.log("\nCould not check subscription status. The contract might not have a 'userSubscriptions' mapping.");
  }
  
  console.log("\nTo subscribe, you would need to:");
  console.log("1. Approve the contract to spend your USDC");
  console.log("2. Call subscribeWithUSDC(planId) or send ETH to subscribeWithETH(planId)");
  console.log("   - planId: 0 for daily, 1 for monthly");
  console.log("\nExample (for testing only - don't run with real funds):");
  console.log(`const tx = await subscription.subscribeWithUSDC(0); // 0 for daily, 1 for monthly`);
  console.log(`await tx.wait();`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
