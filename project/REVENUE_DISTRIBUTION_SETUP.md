# Revenue Distribution System - Setup Guide

## Overview

This guide explains how to deploy and configure the new revenue distribution system that ensures artists receive their promised 85% share of subscription revenue.

## Problem Fixed

**Before:** 
- ❌ All subscription payments went directly to platform wallet (100%)
- ❌ Artists received 0% (no payment mechanism existed)
- ❌ Revenue calculations were UI-only (fake)

**After:**
- ✅ Subscription payments automatically split: 85% to artist pool, 15% to platform
- ✅ Artists can claim their share based on play counts
- ✅ All transactions are on-chain and transparent

## New Smart Contracts

### 1. RevenueDistribution.sol
**Location:** `contracts/RevenueDistribution.sol`

**Purpose:** Manages the 85/15 revenue split and artist payouts

**Key Functions:**
- `receiveSubscriptionPayment()` - Receives payments and splits them automatically
- `claimETHRevenue()` - Artists claim their ETH share
- `claimUSDCRevenue()` - Artists claim their USDC share
- `claimAllRevenue()` - Claim both ETH and USDC in one transaction
- `getArtistRevenueSummary()` - View claimable and claimed amounts

**Revenue Calculation:**
```solidity
artistShare = (artistPlays / totalPlays) × artistPool × 85%
```

### 2. SubscriptionV3.sol
**Location:** `contracts/SubscriptionV3.sol`

**Purpose:** Updated subscription contract that integrates with RevenueDistribution

**Changes from V2:**
- Sends payments to RevenueDistribution contract instead of direct to platform wallet
- RevenueDistribution handles the 85/15 split automatically
- Maintains all subscription management features

## Deployment Steps

### Step 1: Deploy RevenueDistribution Contract

```bash
# Navigate to project directory
cd project

# Deploy RevenueDistribution
npx hardhat run scripts/deploy-revenue-distribution.js --network base-sepolia
```

**Constructor Parameters:**
- `_platformWallet`: Address that receives 15% platform fee (e.g., `0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B`)
- `_musicNFTContract`: Address of MusicNFT contract (from VITE_MUSIC_NFT_CONTRACT)
- `_usdcToken`: USDC token address (Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`)

**Example:**
```javascript
const RevenueDistribution = await ethers.getContractFactory("RevenueDistribution");
const revenueDistribution = await RevenueDistribution.deploy(
  "0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B", // platform wallet
  "0x019211130714DEF2a46FFeF084D559313181BDFA", // music NFT contract
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e"  // USDC token
);
```

### Step 2: Deploy SubscriptionV3 Contract

```bash
npx hardhat run scripts/deploy-subscription-v3.js --network base-sepolia
```

**Constructor Parameters:**
- `_revenueDistribution`: Address of RevenueDistribution contract (from Step 1)

**Example:**
```javascript
const SubscriptionV3 = await ethers.getContractFactory("SubscriptionV3");
const subscription = await SubscriptionV3.deploy(
  revenueDistribution.address
);
```

### Step 3: Update Environment Variables

Add to `.env`:
```bash
# Revenue Distribution Contract
VITE_REVENUE_DISTRIBUTION_CONTRACT=0x... # from Step 1

# Updated Subscription Contract (V3)
VITE_SUBSCRIPTION_CONTRACT=0x... # from Step 2

# Keep existing
VITE_MUSIC_NFT_CONTRACT=0x019211130714DEF2a46FFeF084D559313181BDFA
VITE_USDC_TOKEN=0x036CbD53842c5426634e7929541eC2318f3dCF7e
VITE_ETH_SUBSCRIPTION_CONTRACT=0x1d336b8cCA220d596f0e2Fd368fa2424dcbB987A
```

### Step 4: Verify Contracts (Optional but Recommended)

```bash
# Verify RevenueDistribution
npx hardhat verify --network base-sepolia <REVENUE_DISTRIBUTION_ADDRESS> \
  "0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B" \
  "0x019211130714DEF2a46FFeF084D559313181BDFA" \
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e"

# Verify SubscriptionV3
npx hardhat verify --network base-sepolia <SUBSCRIPTION_V3_ADDRESS> \
  "<REVENUE_DISTRIBUTION_ADDRESS>"
```

## Frontend Integration

### New Component: RevenueClaimCard

**Location:** `src/components/artist/RevenueClaimCard.tsx`

**Features:**
- Shows claimable ETH and USDC amounts
- Displays artist's play share percentage
- Claim buttons for ETH, USDC, or both
- Shows lifetime earnings history

**Already Integrated:** The component is automatically shown on the Artist Dashboard (Overview tab)

### Updated Pages

1. **Artist.tsx** - Now includes RevenueClaimCard at the top of Overview tab
2. **Marketplace.tsx** - Updated messaging to reflect actual 85/15 split

## Testing the System

### 1. Test Subscription Payment

```javascript
// User subscribes with USDC
await subscriptionContract.subscribeWithUSDC(1); // Monthly plan

// Or with ETH
await subscriptionContract.subscribeWithETH(1, { value: ethAmount });
```

**Expected Result:**
- 85% goes to RevenueDistribution artist pool
- 15% goes to platform wallet immediately
- User's subscription is activated

### 2. Test Artist Revenue Claim

```javascript
// Check claimable amount
const summary = await revenueDistribution.getArtistRevenueSummary(artistAddress);
console.log("Claimable ETH:", summary.claimableETH);
console.log("Claimable USDC:", summary.claimableUSDC);

// Claim revenue
await revenueDistribution.claimAllRevenue();
```

**Expected Result:**
- Artist receives their proportional share based on play counts
- Claimed amounts are recorded on-chain
- Balance updates in wallet

### 3. Verify Revenue Split

```javascript
// Check platform wallet balance (should receive 15%)
const platformBalance = await usdcToken.balanceOf(platformWallet);

// Check artist pool (should have 85%)
const artistPool = await revenueDistribution.totalUSDCPool();

// Verify split
const totalRevenue = platformBalance + artistPool;
const platformPercent = (platformBalance / totalRevenue) * 100; // Should be ~15%
const artistPercent = (artistPool / totalRevenue) * 100; // Should be ~85%
```

## Migration from Old System

### For Existing Subscriptions

**Option 1: Gradual Migration**
- Keep old subscription contracts active
- Direct new subscriptions to V3
- Old subscriptions expire naturally

**Option 2: Force Migration**
- Pause old subscription contracts
- Migrate active subscriptions to V3
- Requires admin transaction for each user

### For Accumulated Revenue

If there's revenue in the old SubscriptionV2 contract:

```javascript
// Owner withdraws from old contract
await oldSubscription.withdraw(usdcToken, amount);

// Manually distribute to artists or seed new RevenueDistribution
await revenueDistribution.receiveSubscriptionPayment(amount);
```

## Revenue Distribution Logic

### How Artist Share is Calculated

```
1. Total plays across all tracks: 10,000
2. Artist A's plays: 2,500
3. Artist B's plays: 1,500
4. Artist C's plays: 6,000

Revenue Pool: $100 USDC (85% of $117.65 total subscriptions)

Artist A share: (2,500 / 10,000) × $100 = $25 USDC
Artist B share: (1,500 / 10,000) × $100 = $15 USDC
Artist C share: (6,000 / 10,000) × $100 = $60 USDC
```

### When to Claim

- **No minimum threshold** - Artists can claim anytime
- **Gas costs** - Consider claiming when amount > gas fees
- **Automatic** - Revenue accumulates automatically as users subscribe
- **Real-time** - Play counts update on-chain, revenue is always current

## Security Considerations

### Access Control
- ✅ ReentrancyGuard on all payment functions
- ✅ Only owner can update contract addresses
- ✅ Artists can only claim their own revenue
- ✅ Platform fee sent immediately (no accumulation risk)

### Audit Recommendations
1. Get smart contracts audited before mainnet deployment
2. Test extensively on testnet with real user scenarios
3. Consider timelock for admin functions
4. Implement emergency pause mechanism

## Monitoring & Analytics

### Key Metrics to Track

```javascript
// Total revenue collected
const totalETH = await revenueDistribution.totalETHPool();
const totalUSDC = await revenueDistribution.totalUSDCPool();

// Artist claims
const claimed = await revenueDistribution.claimedUSDC(artistAddress);

// Play counts
const [artistPlays, totalPlays] = await revenueDistribution.getPlayCounts(artistAddress);
```

### Events to Monitor

```javascript
// Listen for revenue received
revenueDistribution.on("RevenueReceived", (from, ethAmount, usdcAmount) => {
  console.log(`Revenue received: ${ethAmount} ETH, ${usdcAmount} USDC`);
});

// Listen for claims
revenueDistribution.on("RevenueClaimedUSDC", (artist, amount) => {
  console.log(`${artist} claimed ${amount} USDC`);
});
```

## Troubleshooting

### Artists Can't Claim Revenue

**Check:**
1. Do they have any plays? `getPlayCounts(artistAddress)`
2. Is there revenue in the pool? `totalUSDCPool()`
3. Have they already claimed? `claimedUSDC(artistAddress)`
4. Is the MusicNFT contract address correct?

### Revenue Split Not Working

**Check:**
1. Is SubscriptionV3 pointing to correct RevenueDistribution address?
2. Did subscription payment transaction succeed?
3. Check platform wallet balance (should receive 15%)
4. Check RevenueDistribution balance (should have 85%)

### Play Counts Not Updating

**Check:**
1. Is MusicNFT contract address correct in RevenueDistribution?
2. Are plays being recorded on-chain in MusicNFT contract?
3. Call `getMusicMetadata(tokenId)` to verify playCount field

## Support

For issues or questions:
1. Check contract events on block explorer
2. Verify all environment variables are set correctly
3. Test on Base Sepolia testnet first
4. Review transaction logs for error messages

## Next Steps

1. ✅ Deploy contracts to testnet
2. ✅ Update environment variables
3. ✅ Test subscription flow
4. ✅ Test artist claim flow
5. ⏳ Get contracts audited
6. ⏳ Deploy to mainnet
7. ⏳ Migrate existing users
8. ⏳ Monitor and optimize

---

**Created:** 2025-10-15  
**Version:** 1.0  
**Status:** Ready for testnet deployment
