# Transaction Troubleshooting Guide

## Common Transaction Failure Issues

### 1. **Wrong Network**
**Problem:** Wallet is on wrong network
**Solution:**
- Open MetaMask
- Switch to **Base Sepolia** network
- Network details:
  - Network Name: Base Sepolia
  - RPC URL: https://sepolia.base.org
  - Chain ID: 84532
  - Currency: ETH
  - Block Explorer: https://sepolia.basescan.org

### 2. **Insufficient Gas**
**Problem:** Not enough ETH for gas fees
**Solution:**
- You need at least 0.001 ETH for gas
- Get more from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- Current balance: 0.000316 ETH (might be too low)

### 3. **Contract Address Issues**
**Problem:** Invalid contract address
**Solution:**
Check these addresses are correct:

**ETH Subscription Contract:**
```
0x54f6f8f14Ecb6f604891e4391caC31Fe4B7D0d37
```

**USDC Subscription Contract:**
```
0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B
```

**USDC Token:**
```
0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### 4. **USDC Balance (for USDC payments)**
**Problem:** Don't have USDC tokens
**Solution:**
- You need USDC tokens on Base Sepolia
- Get testnet USDC from a faucet or bridge

### 5. **Plan ID Mismatch**
**Problem:** Contract expects different plan IDs
**Solution:**
The ETH contract uses plan IDs 1, 2, 3 (not 0, 1, 2)
- Monthly = 1
- 3 Months = 2  
- Yearly = 3

### 6. **Price Calculation Error**
**Problem:** Sending wrong ETH amount
**Solution:**
Check console logs for calculated amounts:
- Monthly: ~0.00125 ETH ($2.50)
- 3 Months: ~0.003375 ETH ($6.75)
- Yearly: ~0.0125 ETH ($25.00)

## Debug Steps

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors when clicking subscribe
4. Share the error message

### Step 2: Check Network
```javascript
// In browser console, run:
window.ethereum.request({ method: 'eth_chainId' })
// Should return: 0x14a34 (84532 in decimal)
```

### Step 3: Check Wallet Connection
```javascript
// In browser console:
window.ethereum.request({ method: 'eth_accounts' })
// Should show your connected wallet address
```

### Step 4: Test Contract Connection
Open browser console and run:
```javascript
// Check if contract is accessible
fetch('https://sepolia.base.org', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_getCode',
    params: ['0x54f6f8f14Ecb6f604891e4391caC31Fe4B7D0d37', 'latest'],
    id: 1
  })
}).then(r => r.json()).then(console.log)
```

### Step 5: Check Transaction Details
When transaction fails, check:
1. **Error message** in MetaMask
2. **Gas estimation** - if it fails, contract call will fail
3. **Transaction hash** - if available, check on Basescan

## Specific Error Messages

### "Insufficient funds"
- Need more ETH for gas
- Get from faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

### "execution reverted"
- Contract rejected the transaction
- Check plan ID is correct
- Check you're not already subscribed
- Check contract has correct price feed

### "user rejected transaction"
- You clicked "Reject" in MetaMask
- Try again and click "Confirm"

### "nonce too low"
- Reset MetaMask: Settings → Advanced → Reset Account

### "Invalid address"
- Contract address is wrong
- Check environment variables in Netlify

## Quick Fixes

### Fix 1: Get More Gas
```bash
# Your current balance is low (0.000316 ETH)
# Get more from faucet - you need at least 0.001 ETH
```

### Fix 2: Reset MetaMask
1. MetaMask → Settings
2. Advanced
3. Reset Account
4. Try transaction again

### Fix 3: Check Contract on Basescan
Visit: https://sepolia.basescan.org/address/0x54f6f8f14Ecb6f604891e4391caC31Fe4B7D0d37

Verify:
- Contract is deployed
- Has code (not empty)
- Recent transactions work

### Fix 4: Test with Lower Amount
Try monthly plan first ($2.50 = 0.00125 ETH)
- Requires less gas
- Easier to debug

## Environment Variables Check

Make sure Netlify has these set:
```bash
VITE_SUBSCRIPTION_CONTRACT=0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B
VITE_ETH_SUBSCRIPTION_CONTRACT=0x54f6f8f14Ecb6f604891e4391caC31Fe4B7D0d37
VITE_USDC_TOKEN=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

## Still Failing?

Share these details:
1. **Full error message** from browser console
2. **Transaction hash** (if available)
3. **Which plan** you're trying to subscribe to
4. **Payment method** (ETH or USDC)
5. **Your wallet address**
6. **Screenshot** of the error

## Contact Info
- Check browser console (F12)
- Check MetaMask activity tab
- Check Basescan for transaction details
