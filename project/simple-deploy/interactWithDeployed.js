const { ethers } = require("hardhat");

async function main() {
  // The deployed contract address
  const contractAddress = "0xD71177B26639B3B1bc70Aa72D720f00db5cB6b1A";
  
  // Get the contract instance
  const Subscription = await ethers.getContractFactory("Subscription");
  const subscription = await Subscription.attach(contractAddress);
  
  // Get the current signer
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);
  
  // 1. Get contract owner
  const owner = await subscription.owner();
  console.log(`\nContract Owner: ${owner}`);
  
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
  
  // 5. Check if the current user is subscribed
  console.log("\nChecking subscription status...");
  try {
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
    console.log("Could not check subscription status. The contract might not have a 'userSubscriptions' mapping.");
  }
  
  console.log("\nTo subscribe, you can call:");
  console.log("1. For USDC payments:");
  console.log(`   - First approve the contract to spend USDC: await usdcTokenContract.approve("${contractAddress}", AMOUNT_IN_WEI);`);
  console.log(`   - Then call: await subscription.subscribeWithUSDC(0); // 0 for daily, 1 for monthly`);
  console.log("2. For ETH payments:");
  console.log(`   - Call: await subscription.subscribeWithETH(0, { value: ethers.utils.parseEther("0.01") }); // Adjust value as needed`);
  
  console.log("\nTo verify the contract on BaseScan, run:");
  console.log(`npx hardhat verify --network baseSepolia ${contractAddress} "${priceFeed}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
