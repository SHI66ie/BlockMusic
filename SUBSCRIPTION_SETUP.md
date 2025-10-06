# Subscription Contract Setup - Base Sepolia

## Contract Addresses

### USDC Subscription Contract (Current)
- **Address**: `0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B`
- **Payment Method**: USDC tokens
- **Prices**:
  - Monthly: 2.5 USDC
  - 3 Months: 6.75 USDC
  - Yearly: 25 USDC

### ETH Subscription Contract (To Be Deployed)
- **Address**: `0x0000000000000000000000000000000000000000` (Placeholder)
- **Payment Method**: Base Sepolia ETH
- **Prices** (USD equivalent in ETH):
  - Monthly: ~$2.5 in ETH
  - 3 Months: ~$6.75 in ETH
  - Yearly: ~$25 in ETH

### USDC Token (Base Sepolia)
- **Address**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Decimals**: 6

## Environment Variables

Add these to your `.env` file or Netlify environment variables:

```bash
# USDC Subscription Contract
VITE_SUBSCRIPTION_CONTRACT=0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B

# ETH Subscription Contract (update after deployment)
VITE_ETH_SUBSCRIPTION_CONTRACT=0x0000000000000000000000000000000000000000

# USDC Token on Base Sepolia
VITE_USDC_TOKEN=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

## Deploying ETH Subscription Contract

To deploy a contract that accepts ETH payments:

### Option 1: Deploy New Contract with ETH Support

1. **Use the Subscription.sol contract** from `/contracts/Subscription.sol` or `/simple-deploy/contracts/SubscriptionV2.sol`
2. **Deploy to Base Sepolia**:
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.js --network baseSepolia
   ```
3. **Copy the deployed contract address**
4. **Update environment variable**:
   ```bash
   VITE_ETH_SUBSCRIPTION_CONTRACT=<deployed_address>
   ```

### Option 2: Modify Existing Contract

Add a `subscribeWithETH` function to the SubscriptionManager contract:

```solidity
// Subscribe with ETH (converts to USD equivalent)
function subscribeWithETH(Plan plan) external payable nonReentrant {
    require(!isSubscribed(msg.sender), "Already subscribed");
    
    uint256 usdPrice = getPlanPrice(plan);
    uint256 duration = getPlanDuration(plan);
    
    // Get ETH price from oracle or use fixed rate
    // For testnet, assume 1 ETH = $2000
    uint256 ethPrice = 2000 * 10**6; // $2000 with 6 decimals
    uint256 requiredETH = (usdPrice * 10**18) / ethPrice;
    
    require(msg.value >= requiredETH, "Insufficient ETH sent");
    
    // Refund excess ETH
    if (msg.value > requiredETH) {
        payable(msg.sender).transfer(msg.value - requiredETH);
    }
    
    // Create subscription
    uint256 startTime = block.timestamp;
    uint256 endTime = startTime + duration;
    
    subscriptions[msg.sender] = Subscription({
        startTime: startTime,
        endTime: endTime,
        isActive: true,
        plan: plan
    });
    
    emit Subscribed(msg.sender, plan, startTime, endTime);
}

// Receive function to accept ETH
receive() external payable {}
```

## Frontend Integration

The frontend is already configured to support both payment methods:

1. **USDC Payment** (Currently Active):
   - Two-step process: Approve USDC → Subscribe
   - Uses `VITE_SUBSCRIPTION_CONTRACT`

2. **ETH Payment** (Ready for Integration):
   - Single-step process: Send ETH with subscribe call
   - Uses `VITE_ETH_SUBSCRIPTION_CONTRACT`
   - Will be enabled once contract is deployed

## Testing

### Get Test USDC on Base Sepolia

1. **Bridge from Sepolia to Base Sepolia**:
   - Use [Base Bridge](https://bridge.base.org/)
   - Or use [Superbridge](https://superbridge.app/)

2. **Faucet** (if available):
   - Check [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)

### Get Test ETH on Base Sepolia

1. **Base Sepolia Faucet**:
   - [Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
   - [Alchemy Faucet](https://sepoliafaucet.com/)

2. **Bridge from Sepolia**:
   - Use [Base Bridge](https://bridge.base.org/)

## Deployment Checklist

- [ ] Deploy ETH subscription contract to Base Sepolia
- [ ] Verify contract on Basescan
- [ ] Update `VITE_ETH_SUBSCRIPTION_CONTRACT` in Netlify
- [ ] Test USDC subscription flow
- [ ] Test ETH subscription flow
- [ ] Update frontend to show both payment options
- [ ] Add payment method selector in UI

## Current Status

✅ **USDC Subscription**: Fully functional  
⏳ **ETH Subscription**: Contract address needed (placeholder set)  
✅ **Explorer Access**: Granted after successful subscription  
✅ **Auto-redirect**: To marketplace after subscription

## Next Steps

1. Deploy ETH subscription contract
2. Update `VITE_ETH_SUBSCRIPTION_CONTRACT` with actual address
3. Add payment method toggle in subscription UI
4. Test both payment flows
