const hre = require("hardhat");

async function main() {
  // Get the contract factory
  const Greeter = await hre.ethers.getContractFactory("Greeter");
  
  // Deploy the contract with the initial greeting
  const greeter = await Greeter.deploy("Hello, BlockMusic!");
  
  // Wait for the deployment to complete
  await greeter.deployed();
  
  console.log("Greeter deployed to:", greeter.address);
  
  // Verify the contract (optional, requires ETHERSCAN_API_KEY in .env)
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await greeter.deployTransaction.wait(6);
    
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: greeter.address,
        constructorArguments: ["Hello, BlockMusic!"],
      });
      console.log("Contract verified on Etherscan!");
    } catch (error) {
      console.error("Verification failed:", error);
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
