# 🔐 Backend Wallet Setup for Blockchain Updates

## Overview

The Cloudflare Worker needs a backend wallet to pay gas fees when updating play counts on the blockchain every hour.

## ⚠️ IMPORTANT SECURITY NOTES

1. **Create a NEW wallet** - Don't use your personal wallet
2. **Only fund with small amounts** - Just enough for gas fees
3. **Never share the private key** - It's stored as a Cloudflare secret

---

## 🚀 Setup Steps

### Step 1: Create a New Wallet

You can use MetaMask or any wallet to generate a new address:

1. **Option A: MetaMask**
   - Open MetaMask
   - Click account icon → "Add account or hardware wallet" → "Add a new account"
   - Name it "BlockMusic Backend"
   - Copy the address

2. **Option B: Command Line (ethers.js)**
   ```bash
   node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey);"
   ```

**Save the private key securely!** You'll need it in Step 3.

### Step 2: Fund the Wallet

The backend wallet needs ETH on **Base Sepolia** to pay for gas fees.

**Estimated Costs:**
- Gas per update: ~0.0001 ETH
- Updates per hour: 1-10 tracks
- Monthly cost: ~0.01-0.1 ETH (~$20-200 at current prices)

**Get Test ETH:**

1. **Base Sepolia Faucet:**
   - Go to: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
   - Enter your backend wallet address
   - Request testnet ETH

2. **Alternative Faucets:**
   - https://faucet.quicknode.com/base/sepolia
   - https://www.alchemy.com/faucets/base-sepolia

**Recommended:** Start with 0.1 ETH (testnet) to cover ~1000 updates.

### Step 3: Set the Private Key as a Cloudflare Secret

**NEVER put the private key in `wrangler.toml` or commit it to git!**

Use Cloudflare's secret management:

```bash
cd cloudflare-worker

# Set the secret (you'll be prompted to paste the private key)
wrangler secret put BACKEND_PRIVATE_KEY
```

**When prompted, paste your private key** (starts with `0x...`)

**Verify it's set:**
```bash
wrangler secret list
```

You should see:
```
BACKEND_PRIVATE_KEY (set)
```

### Step 4: Deploy the Worker

```bash
wrangler deploy
```

The worker will now be able to update the blockchain!

---

## 🧪 Testing the Blockchain Updates

### Test 1: Manual Cron Trigger

You can manually trigger the cron job to test it:

```bash
# Watch the logs
wrangler tail

# In another terminal, trigger the cron
curl -X POST "https://blockmusic-play-tracker.blockmusic.workers.dev/__scheduled?cron=0+*+*+*+*"
```

**Expected Output:**
```
Starting batch blockchain update...
Processing 1 track updates: [{tokenId: 0, plays: 1}]
Updating blockchain with backend wallet: 0x...
Updating token 0 with 1 plays...
Transaction sent: 0x...
Transaction confirmed in block 12345
✅ All blockchain updates successful!
Pending counts cleared
Batch update complete
```

### Test 2: Wait for Hourly Cron

The cron runs every hour at minute 0 (e.g., 1:00, 2:00, 3:00).

**To monitor:**
```bash
wrangler tail
```

**Wait for the next hour**, and you should see the batch update logs.

### Test 3: Verify Blockchain Update

After a successful update, check the blockchain:

1. **Via Contract:**
   - Go to Base Sepolia Explorer
   - Search for your MusicNFT contract: `0x8F046B35163A821204B3a42C1E94B0Bc69BFDe37`
   - Look for recent `incrementPlayCount` transactions

2. **Via Frontend:**
   - Go to Artist Dashboard
   - Refresh the page
   - Play counts should now show the confirmed plays (no longer pending)

---

## 🔍 Monitoring & Maintenance

### Check Backend Wallet Balance

```bash
# Using cast (from Foundry)
cast balance 0xYOUR_BACKEND_WALLET_ADDRESS --rpc-url https://sepolia.base.org

# Or check on Base Sepolia Explorer
# https://sepolia.basescan.org/address/0xYOUR_BACKEND_WALLET_ADDRESS
```

### Refill When Low

When balance drops below 0.01 ETH, refill from faucet or send more ETH.

### View Logs

```bash
# Real-time logs
wrangler tail

# Or view in Cloudflare Dashboard
# https://dash.cloudflare.com → Workers & Pages → blockmusic-play-tracker → Logs
```

---

## 🚨 Troubleshooting

### Error: "BACKEND_PRIVATE_KEY not set"

**Solution:**
```bash
wrangler secret put BACKEND_PRIVATE_KEY
# Paste your private key when prompted
wrangler deploy
```

### Error: "Insufficient funds for gas"

**Solution:**
- Check wallet balance
- Fund with more ETH from faucet
- Verify you're on Base Sepolia network

### Error: "Transaction reverted"

**Possible causes:**
1. Contract doesn't have `incrementPlayCount` function
2. Backend wallet doesn't have permission
3. Token ID doesn't exist

**Solution:**
- Check contract ABI matches
- Verify backend wallet has correct permissions
- Check logs for specific error message

### Updates Not Happening

**Check:**
1. Cron is configured: `wrangler.toml` has `crons = ["0 * * * *"]`
2. Secret is set: `wrangler secret list`
3. Wallet has funds: Check balance
4. Logs show activity: `wrangler tail`

---

## 📊 Cost Estimation

### Testnet (Base Sepolia)
- **Cost:** FREE (testnet ETH from faucets)
- **Frequency:** Hourly
- **Gas per update:** ~21,000 gas × tracks
- **Monthly:** 0 cost (using testnet)

### Mainnet (Base)
- **Gas Price:** ~0.001 Gwei (Base is very cheap)
- **Cost per update:** ~$0.001-0.01
- **Hourly updates:** ~$0.01-0.10/hour
- **Monthly:** ~$7-72/month

**Optimization:** Batch multiple tracks in one transaction to save gas.

---

## 🔐 Security Best Practices

1. ✅ **Use a dedicated backend wallet** - Not your personal wallet
2. ✅ **Store private key as Cloudflare secret** - Never in code
3. ✅ **Fund with minimal amounts** - Only what's needed
4. ✅ **Monitor balance regularly** - Set up alerts
5. ✅ **Rotate keys periodically** - Every 3-6 months
6. ✅ **Limit contract permissions** - Only allow incrementPlayCount

---

## 📝 Summary

**What you did:**
1. ✅ Created backend wallet
2. ✅ Funded with testnet ETH
3. ✅ Set private key as Cloudflare secret
4. ✅ Deployed worker with blockchain update capability

**What happens now:**
1. Users play tracks → Recorded in Cloudflare
2. Every hour → Cron job runs
3. Backend wallet → Updates blockchain with play counts
4. Artists → See updated play counts and revenue
5. Artists → Can claim their earnings!

**Next steps:**
- Test the cron job manually
- Monitor the first few hourly updates
- Verify artists see revenue
- Set up balance monitoring

---

**Your backend wallet is now set up and ready to process blockchain updates!** 🎉
