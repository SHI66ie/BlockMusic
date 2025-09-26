const { ethers } = require("hardhat");

async function main() {
  // Contract address from the deployment
  const contractAddress = "0x3109FB7f8F8584faE94Be1aB5B2707522fF3CBB14";
  
  // Get the contract factory and attach to the deployed address
  const Subscription = await ethers.getContractFactory("Subscription");
  const subscription = await Subscription.attach(contractAddress);
  
  // Get the current signer (account)
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);
  
  // 1. Check the current subscription status
  console.log("\n1. Checking subscription status...");
  const userSubscription = await subscription.userSubscriptions(signer.address);
  const isSubscribed = userSubscription.isActive && userSubscription.endTime > Math.floor(Date.now() / 1000);
  console.log(`Is ${signer.address} subscribed? ${isSubscribed}`);
  
  // 2. Get subscription details if subscribed
  if (isSubscribed) {
    console.log("\nSubscription Details:");
    console.log(`- Plan ID: ${userSubscription.planId}`);
    console.log(`- Start Time: ${new Date(userSubscription.startTime * 1000)}`);
    console.log(`- End Time: ${new Date(userSubscription.endTime * 1000)}`);
    console.log(`- Active: ${userSubscription.isActive}`);
    console.log(`- Total Paid: ${ethers.utils.formatUnits(userSubscription.totalPaid, 18)} USDC`);
  }
  
  // 3. Get contract owner
  const owner = await subscription.owner();
  console.log(`\nContract Owner: ${owner}`);
  
  // 4. Get subscription prices
  console.log("\nSubscription Prices:");
  const dailyPrice = await subscription.DAILY_PRICE();
  const monthlyPrice = await subscription.MONTHLY_PRICE();
  console.log(`- Daily Price: ${ethers.utils.formatUnits(dailyPrice, 18)} USDC`);
  console.log(`- Monthly Price: ${ethers.utils.formatUnits(monthlyPrice, 18)} USDC`);
  
  // 5. Get USDC token address
  const usdcToken = await subscription.usdcToken();
  console.log(`\nUSDC Token Address: ${usdcToken}`);
  
  // Note: To actually subscribe, you would need to:
  // 1. Approve the contract to spend your USDC
  // 2. Call subscribeWithUSDC(planId) or send ETH to subscribeWithETH(planId)
  
  console.log("\nTo subscribe, you would need to:");
  console.log("1. Approve the contract to spend your USDC");
  console.log("2. Call subscribeWithUSDC(planId) or send ETH to subscribeWithETH(planId)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
