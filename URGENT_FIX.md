# URGENT: Update Netlify Environment Variable

## Problem
Users are subscribing to the OLD contract instead of the NEW contract because Netlify is using an outdated environment variable.

**Transaction that succeeded:** `0x2788f360fe1b57d9a8edb91a529bd900f092403614cf86babb4c2c70000695cb`

**Current (WRONG) contract in Netlify:**
```
VITE_ETH_SUBSCRIPTION_CONTRACT=0x88A1c58B702F8B280BBaa16aa52807BdE8357f9b
```

**Should be (CORRECT) contract:**
```
VITE_ETH_SUBSCRIPTION_CONTRACT=0x1d336b8cCA220d596f0e2Fd368fa2424dcbB987A
```

## Why This Matters
The OLD contract (`0x88A1c58B...`) does NOT have the `isSubscribed()` function, so even though users pay successfully, the frontend can't verify their subscription and won't grant access.

The NEW contract (`0x1d336b8c...`) has:
- ✅ `isSubscribed()` function
- ✅ Chainlink real-time pricing
- ✅ Correct price decimals

## How to Fix

### Step 1: Update Netlify Environment Variable
1. Go to: https://app.netlify.com/
2. Select your site: **BlockMusic**
3. Go to: **Site Settings** → **Environment Variables**
4. Find: `VITE_ETH_SUBSCRIPTION_CONTRACT`
5. Update value to: `0x1d336b8cCA220d596f0e2Fd368fa2424dcbB987A`
6. Click **Save**

### Step 2: Trigger Redeploy
1. Go to: **Deploys** tab
2. Click: **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete

### Step 3: Verify
After deployment, check the browser console should show:
```
ETH Subscription Contract: 0x1d336b8cCA220d596f0e2Fd368fa2424dcbB987A
```

## For Users Who Already Paid to Old Contract

If users already paid to the old contract, they have two options:

### Option A: Subscribe Again (Recommended)
- Wait for Netlify update
- Subscribe again with the new contract
- Payment will go to correct contract
- Access will be granted immediately

### Option B: Manually Grant Access (Advanced)
We could deploy a migration script that reads subscriptions from the old contract and writes them to the new contract, but this requires:
1. Owner access to both contracts
2. Gas fees for migration
3. Custom migration script

## Contract Addresses Reference

### USDC Subscription (Working)
```
0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B
```

### ETH Subscription (OLD - Don't Use)
```
0x88A1c58B702F8B280BBaa16aa52807BdE8357f9b
```
- ❌ Missing `isSubscribed()` function
- ❌ Wrong price decimals
- ❌ No Chainlink pricing

### ETH Subscription (NEW - Correct)
```
0x1d336b8cCA220d596f0e2Fd368fa2424dcbB987A
```
- ✅ Has `isSubscribed()` function
- ✅ Correct price decimals
- ✅ Chainlink real-time pricing enabled
- ✅ Current ETH price: $4,676.34

## Verification Commands

Check if user has subscription on old contract:
```bash
npx hardhat run scripts/check-subscription.js --network baseSepolia <USER_WALLET_ADDRESS>
```

View transaction on Basescan:
```
https://sepolia.basescan.org/tx/0x2788f360fe1b57d9a8edb91a529bd900f092403614cf86babb4c2c70000695cb
```

## Timeline
1. ✅ Contract fixed and redeployed (10:06 AM)
2. ✅ Code updated and pushed to GitHub (10:11 AM)
3. ⏳ **WAITING:** Netlify environment variable update
4. ⏳ **WAITING:** Netlify redeploy

## Status
🔴 **URGENT:** Netlify still using old contract address
🟡 **ACTION REQUIRED:** Update environment variable NOW
