# Netlify Environment Variables Setup

## 🚀 Update Your Netlify Environment Variables

Since you deployed new contracts, you **MUST** update your Netlify environment variables for the production site to work correctly.

## Steps to Update Netlify

### 1. Go to Netlify Dashboard
1. Log in to [Netlify](https://app.netlify.com/)
2. Select your **BlockMusic** site
3. Go to **Site settings** → **Environment variables**

### 2. Add/Update These Variables

#### **New Variables (Add These):**

```
VITE_REVENUE_DISTRIBUTION_CONTRACT=0xa61eAfed9c3B7cF6575FB7E35E18ABe425306f02
```

#### **Update This Variable:**

```
VITE_SUBSCRIPTION_CONTRACT=0x4371eE0797e2590d2650395FDc8666795DceB92A
```
*(Replace the old subscription contract address with this new one)*

#### **Keep These Existing Variables:**

```
VITE_MUSIC_NFT_CONTRACT=0x019211130714DEF2a46FFeF084D559313181BDFA
VITE_USDC_TOKEN=0x036CbD53842c5426634e7929541eC2318f3dCF7e
VITE_ETH_SUBSCRIPTION_CONTRACT=0x1d336b8cCA220d596f0e2Fd368fa2424dcbB987A
```

### 3. Redeploy Your Site

After updating environment variables:

**Option A: Trigger Redeploy in Netlify**
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**

**Option B: Push to Git (if auto-deploy is enabled)**
```bash
git add .
git commit -m "Update contract addresses for revenue distribution"
git push
```

## Complete Environment Variables List for Netlify

Here's the complete list of blockchain-related variables you should have:

```bash
# Revenue Distribution System (NEW)
VITE_REVENUE_DISTRIBUTION_CONTRACT=0xa61eAfed9c3B7cF6575FB7E35E18ABe425306f02

# Subscription Contracts
VITE_SUBSCRIPTION_CONTRACT=0x4371eE0797e2590d2650395FDc8666795DceB92A
VITE_ETH_SUBSCRIPTION_CONTRACT=0x1d336b8cCA220d596f0e2Fd368fa2424dcbB987A

# NFT & Token Contracts
VITE_MUSIC_NFT_CONTRACT=0x019211130714DEF2a46FFeF084D559313181BDFA
VITE_USDC_TOKEN=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# IPFS (if you have these)
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_KEY=your_pinata_secret_key

# WalletConnect (if you have this)
VITE_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
```

## ⚠️ Important Notes

### Why This Is Critical:
- ❌ **Without updating:** Your production site will use the OLD subscription contract
- ❌ **Old contract:** Sends 100% to platform wallet (no artist payments)
- ✅ **New contract:** Properly splits 85% to artists, 15% to platform

### What Happens After Update:
- ✅ New subscriptions will use the revenue distribution system
- ✅ Artists can claim their 85% share
- ✅ Platform receives correct 15% fee
- ✅ All revenue is tracked on-chain

### Testing After Deployment:
1. Visit your production site
2. Open browser console (F12)
3. Check that contract addresses match:
   ```javascript
   console.log(import.meta.env.VITE_REVENUE_DISTRIBUTION_CONTRACT);
   console.log(import.meta.env.VITE_SUBSCRIPTION_CONTRACT);
   ```
4. Test a subscription purchase
5. Verify on Basescan that revenue split is correct

## Verification Checklist

- [ ] Added `VITE_REVENUE_DISTRIBUTION_CONTRACT` to Netlify
- [ ] Updated `VITE_SUBSCRIPTION_CONTRACT` to new address
- [ ] Triggered redeploy in Netlify
- [ ] Checked deployment logs for errors
- [ ] Visited production site and verified it loads
- [ ] Tested subscription flow on production
- [ ] Verified artist can see claimable revenue
- [ ] Checked Basescan for correct revenue split

## Troubleshooting

### If production site shows errors:
1. Check Netlify deploy logs for build errors
2. Verify all environment variables are set correctly
3. Make sure no typos in contract addresses
4. Clear browser cache and hard refresh (Ctrl+Shift+R)

### If subscriptions don't work:
1. Check browser console for errors
2. Verify contract addresses in console
3. Check wallet is connected to Base Sepolia
4. Verify you have testnet ETH for gas

### If artist revenue doesn't show:
1. Verify `VITE_REVENUE_DISTRIBUTION_CONTRACT` is set
2. Check that RevenueClaimCard component is deployed
3. Verify MusicNFT contract has play counts
4. Check Basescan for contract interactions

## Quick Copy-Paste for Netlify

**Variable Name:** `VITE_REVENUE_DISTRIBUTION_CONTRACT`  
**Value:** `0xa61eAfed9c3B7cF6575FB7E35E18ABe425306f02`

**Variable Name:** `VITE_SUBSCRIPTION_CONTRACT`  
**Value:** `0x4371eE0797e2590d2650395FDc8666795DceB92A`

---

**Status:** ⚠️ Action Required - Update Netlify before production use
