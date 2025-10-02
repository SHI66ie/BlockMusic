import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

dotenv.config();

// Get the current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the contract ABI and bytecode
const contractPath = path.join(__dirname, 'artifacts', 'contracts', 'Subscription.sol', 'Subscription.json');

async function main() {
  try {
    console.log("Starting deployment...");
    
    // Check environment variables
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY is not set in .env file");
    }
    
    if (!process.env.ALCHEMY_BASE_SEPOLIA_RPC_URL) {
      throw new Error("ALCHEMY_BASE_SEPOLIA_RPC_URL is not set in .env file");
    }

    // Connect to the network
    console.log("Connecting to network...");
    const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_BASE_SEPOLIA_RPC_URL);
    
    // Check connection
    const network = await provider.getNetwork();
    console.log("Connected to network:", network.name, "Chain ID:", network.chainId);
    
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log("Deployer address:", signer.address);
    
    // Check balance
    const balance = await provider.getBalance(signer.address);
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    if (balance.isZero()) {
      throw new Error("Account has no ETH for gas");
    }

    // Read contract data
    console.log("Reading contract data...");
    const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const abi = contractData.abi;
    const bytecode = contractData.bytecode;
    
    console.log("Creating contract factory...");
    const Subscription = new ethers.ContractFactory(abi, bytecode, signer);
    const MOCK_PRICE_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

    console.log("Deploying Subscription contract...");
    const deploymentTx = await Subscription.getDeployTransaction(MOCK_PRICE_FEED);
    console.log("Deployment transaction data:", deploymentTx.data.substring(0, 100) + "...");
    
    const gasEstimate = await provider.estimateGas(deploymentTx);
    console.log("Gas estimate:", gasEstimate.toString());
    
    const gasPrice = await provider.getGasPrice();
    console.log("Current gas price:", ethers.utils.formatUnits(gasPrice, 'gwei'), "gwei");
    
    console.log("Sending deployment transaction...");
    const txResponse = await signer.sendTransaction({
      ...deploymentTx,
      gasLimit: gasEstimate.mul(12).div(10), // Add 20% buffer
      gasPrice: gasPrice.mul(12).div(10)     // Add 20% to gas price
    });
    
    console.log("Transaction hash:", txResponse.hash);
    console.log("Waiting for transaction to be mined...");
    
    const receipt = await txResponse.wait();
    console.log("Transaction mined in block:", receipt.blockNumber);
    
    if (!receipt.contractAddress) {
      throw new Error("No contract address in receipt");
    }
    
    console.log("\n✅ Deployment successful!");
    console.log("Contract address:", receipt.contractAddress);
    console.log("\nAdd these to your .env file:");
    console.log(`VITE_SUBSCRIPTION_CONTRACT=${receipt.contractAddress}`);
    console.log("VITE_USDC_TOKEN=0x036CbD53842c5426634e7929541eC2318f3dCF7e");
    
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    
    if (error.reason) {
      console.error("\nReason:", error.reason);
    }
    
    if (error.transaction) {
      console.error("\nTransaction:", error.transaction);
    }
    
    process.exit(1);
  }
}

main();
