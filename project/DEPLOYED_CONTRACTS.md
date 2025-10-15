# Deployed Contracts - Base Sepolia Testnet

**Deployment Date:** October 15, 2025  
**Network:** Base Sepolia (Chain ID: 84532)

## Contract Addresses

### RevenueDistribution Contract
```
0xa61eAfed9c3B7cF6575FB7E35E18ABe425306f02
```
**Purpose:** Manages 85/15 revenue split and artist payouts

**View on Basescan:**  
https://sepolia.basescan.org/address/0xa61eAfed9c3B7cF6575FB7E35E18ABe425306f02

### SubscriptionV3 Contract
```
0x4371eE0797e2590d2650395FDc8666795DceB92A
```
**Purpose:** Handles subscriptions and sends payments to RevenueDistribution

**View on Basescan:**  
https://sepolia.basescan.org/address/0x4371eE0797e2590d2650395FDc8666795DceB92A

## Environment Variables

Add these to your `.env` file:

```bash
# Revenue Distribution System
VITE_REVENUE_DISTRIBUTION_CONTRACT=0xa61eAfed9c3B7cF6575FB7E35E18ABe425306f02
VITE_SUBSCRIPTION_CONTRACT=0x4371eE0797e2590d2650395FDc8666795DceB92A

# Existing contracts (keep these)
VITE_MUSIC_NFT_CONTRACT=0x019211130714DEF2a46FFeF084D559313181BDFA
VITE_USDC_TOKEN=0x036CbD53842c5426634e7929541eC2318f3dCF7e
VITE_ETH_SUBSCRIPTION_CONTRACT=0x1d336b8cCA220d596f0e2Fd368fa2424dcbB987A
```

## Configuration Details

### RevenueDistribution
- **Platform Wallet:** 0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B (receives 15%)
- **Music NFT Contract:** 0x019211130714DEF2a46FFeF084D559313181BDFA
- **USDC Token:** 0x036CbD53842c5426634e7929541eC2318f3dCF7e
- **Platform Fee:** 15%
- **Artist Pool:** 85%

### SubscriptionV3
- **Revenue Distribution:** 0xa61eAfed9c3B7cF6575FB7E35E18ABe425306f02
- **Monthly Price:** $2.50 USDC
- **3-Month Price:** $6.75 USDC
- **Yearly Price:** $25.00 USDC

## Next Steps

1. ✅ **Update .env file** with the new contract addresses above
2. ✅ **Restart your dev server:** `npm run dev`
3. ⏳ **Test subscription flow:**
   - Connect wallet
   - Navigate to Subscribe page
   - Purchase a subscription
   - Verify 85% goes to artist pool, 15% to platform
4. ⏳ **Test artist claim flow:**
   - Navigate to Artist Dashboard
   - Check "Revenue Dashboard" card
   - Verify claimable amounts show correctly
   - Click "Claim All Revenue"
   - Verify funds received in wallet
5. ⏳ **Verify on Basescan:**
   - Check transactions on block explorer
   - Verify revenue split is correct
   - Monitor contract interactions

## Verification Commands (Optional)

To verify contracts on Basescan:

```bash
# Verify RevenueDistribution
npx hardhat verify --network baseSepolia \
  0xa61eAfed9c3B7cF6575FB7E35E18ABe425306f02 \
  "0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B" \
  "0x019211130714DEF2a46FFeF084D559313181BDFA" \
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e"

# Verify SubscriptionV3
npx hardhat verify --network baseSepolia \
  0x4371eE0797e2590d2650395FDc8666795DceB92A \
  "0xa61eAfed9c3B7cF6575FB7E35E18ABe425306f02"
```

## Testing Checklist

- [ ] Environment variables updated
- [ ] Dev server restarted
- [ ] Subscription purchase works
- [ ] Revenue split verified (85/15)
- [ ] Artist can see claimable revenue
- [ ] Artist can claim revenue successfully
- [ ] Transactions visible on Basescan
- [ ] UI shows correct amounts

## Support

If you encounter issues:
1. Check contract addresses are correct in `.env`
2. Verify wallet has testnet ETH for gas
3. Check transactions on Basescan for errors
4. Review `REVENUE_DISTRIBUTION_SETUP.md` for troubleshooting

---

**Status:** ✅ Deployed and ready for testing
