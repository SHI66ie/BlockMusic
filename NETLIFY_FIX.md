# 🚨 CRITICAL: Update Netlify Environment Variables

## Current Status:
- ❌ VITE_MUSIC_NFT_CONTRACT: **NOT SET** (missing from console)
- ❌ VITE_ALCHEMY_API_KEY: **MISSING** (might cause RPC issues)

## What You Need to Do RIGHT NOW:

### 1. Go to Netlify Dashboard
https://app.netlify.com → Your BlockMusic site → Site settings → Environment variables

### 2. Add/Update These Variables:

**Variable Name:** `VITE_MUSIC_NFT_CONTRACT`  
**Value:** `0x47991c5D3bb51972Bef2075cAE9E7bFa08D17817`

**Variable Name:** `VITE_ALCHEMY_API_KEY`  
**Value:** `your_alchemy_api_key_here` (get from https://dashboard.alchemy.com/)

### 3. Redeploy Site
Go to Deploys tab → Trigger deploy → Clear cache and deploy site

## After Updating:

The console should show:
```
VITE_MUSIC_NFT_CONTRACT: 0x47991c5D3bb51972Bef2075cAE9E7bFa08D17817
```

**Then NFT uploads will work with the new contract!** 🎉
