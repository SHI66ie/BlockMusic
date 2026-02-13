# 🚨 Netlify Deployment Fix Guide

## Issues Identified

### 1. Environment Variables Missing (Critical)
Go to: https://app.netlify.com/sites/blockmusic/configuration/env

**Required Variables:**
```
VITE_PLAY_TRACKER_API=https://blockmusic-play-tracker.blockmusic.workers.dev
VITE_MUSIC_NFT_CONTRACT=0x019211130714DEF2a46FFeF084D559313181BDFA
VITE_REVENUE_DISTRIBUTION_CONTRACT=0xa61eAfed9c3B7cF6575FB7E35E18ABe425306f02
VITE_SUBSCRIPTION_CONTRACT=0x4371eE0797e2590d2650395FDc8666795DceB92A
VITE_ETH_SUBSCRIPTION_CONTRACT=0x1d336b8cCA220d596f0e2Fd368fa2424dcbB987A
VITE_USDC_TOKEN=0x036CbD53842c5426634e7929541eC2318f3dCF7e
VITE_ALCHEMY_API_KEY=your_alchemy_api_key_here
VITE_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id_here
```

### 2. Configuration Fixed ✅
- Updated root `netlify.toml` with proper build command
- Added `--legacy-peer-deps` flag for dependency resolution
- Increased Node.js memory limit to 4GB

## Steps to Deploy

### 1. Add Environment Variables
1. Go to Netlify dashboard
2. Navigate to Site settings → Environment variables
3. Add all variables listed above
4. Set scope to "All" or "Production"

### 2. Trigger New Deploy
1. Go to Deploys tab
2. Click "Trigger deploy" → "Clear cache and deploy site"
3. Wait for build to complete (2-3 minutes)

### 3. Verify Deployment
1. Visit https://blockmusic.netlify.app
2. Check browser console for errors
3. Test wallet connection
4. Verify contract addresses are loaded correctly

## Common Build Errors & Solutions

### Error: "npm ERR! peer dep missing"
**Solution:** Fixed with `--legacy-peer-deps` flag

### Error: "JavaScript heap out of memory"
**Solution:** Fixed with `NODE_OPTIONS="--max-old-space-size=4096"`

### Error: "Environment variable not found"
**Solution:** Add missing variables in Netlify dashboard

### Error: "Contract address undefined"
**Solution:** Ensure all VITE_*_CONTRACT variables are set

## Debugging Steps

If deployment still fails:

1. **Check Build Logs**
   - Go to Deploys tab → Click on failed deploy
   - Review error messages in build log

2. **Verify Environment Variables**
   - In browser console: `console.log(import.meta.env)`
   - Check if all VITE_* variables are present

3. **Test Locally**
   ```bash
   cd project
   npm install --legacy-peer-deps
   npm run build
   npm run preview
   ```

4. **Check Network Tab**
   - Look for failed API calls
   - Verify contract addresses are correct

## Expected Behavior After Fix

✅ Site loads without errors  
✅ Wallet connects successfully  
✅ Contract addresses are loaded  
✅ Play tracking works with Cloudflare Worker  
✅ NFT minting and marketplace function  

## Support

If issues persist:
1. Check this guide for missed steps
2. Review Netlify build logs
3. Verify all environment variables are set
4. Test functionality in development mode first
