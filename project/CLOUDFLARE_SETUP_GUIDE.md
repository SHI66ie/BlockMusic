# Cloudflare Workers Setup Guide

Complete guide to deploy the play tracking API using Cloudflare Workers.

## 🚀 Quick Start

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Navigate to Worker Directory

```bash
cd cloudflare-worker
```

### 3. Login to Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate.

### 4. Create KV Namespace

```bash
# Production namespace
wrangler kv:namespace create "PLAY_COUNTS"

# Development namespace
wrangler kv:namespace create "PLAY_COUNTS" --preview
```

You'll get output like:
```
✨ Success!
Add the following to your wrangler.toml:
[[kv_namespaces]]
binding = "PLAY_COUNTS"
id = "abc123def456"
preview_id = "xyz789uvw012"
```

### 5. Update wrangler.toml

Copy the IDs from step 4 and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "PLAY_COUNTS"
id = "abc123def456"  # ← Your production ID
preview_id = "xyz789uvw012"  # ← Your preview ID
```

### 6. Deploy

```bash
wrangler deploy
```

You'll get a URL like:
```
https://blockmusic-play-tracker.your-subdomain.workers.dev
```

### 7. Update Frontend .env

Add to your `.env` file:

```bash
VITE_PLAY_TRACKER_API=https://blockmusic-play-tracker.your-subdomain.workers.dev
```

### 8. Test It!

```bash
# Test the API
curl https://blockmusic-play-tracker.your-subdomain.workers.dev/api/stats

# Play a track in your app
# Check console for: ✅ Play recorded
```

## 📊 How It Works

### Architecture

```
User plays track
    ↓
Frontend calls Cloudflare Worker API
    ↓
Worker stores play in KV storage (instant)
    ↓
Every hour: Cron job batches updates
    ↓
Worker updates blockchain with batch
    ↓
Artist Dashboard shows updated plays
```

### Data Flow

1. **User plays track** → Frontend calls `/api/track-play`
2. **Worker receives request** → Stores in KV (< 50ms)
3. **Returns success** → Frontend continues playing
4. **Hourly cron** → Batches all pending plays
5. **Blockchain update** → One transaction for all plays
6. **Dashboard refresh** → Shows latest data

## 🔧 Configuration

### Environment Variables

The worker uses these from `wrangler.toml`:

```toml
[vars]
MUSIC_NFT_CONTRACT = "0x019211130714DEF2a46FFeF084D559313181BDFA"
REVENUE_DISTRIBUTION_CONTRACT = "0xa61eAfed9c3B7cF6575FB7E35E18ABe425306f02"
BASE_SEPOLIA_RPC = "https://sepolia.base.org"
```

### Secrets (for blockchain updates)

```bash
# Add private key (keep secret!)
wrangler secret put PRIVATE_KEY

# Add RPC URL if using Alchemy/Infura
wrangler secret put RPC_URL
```

### Cron Schedule

Edit `wrangler.toml` to change batch update frequency:

```toml
[triggers]
crons = ["0 * * * *"]  # Every hour
# crons = ["*/30 * * * *"]  # Every 30 minutes
# crons = ["0 */6 * * *"]  # Every 6 hours
```

## 📈 Monitoring

### View Logs

```bash
# Real-time logs
wrangler tail

# Filter by status
wrangler tail --status error
```

### Cloudflare Dashboard

1. Go to https://dash.cloudflare.com/
2. Select **Workers & Pages**
3. Click your worker
4. View:
   - Request volume
   - Error rates
   - Response times
   - KV operations

### Analytics

Check your worker's performance:
- Requests per second
- Success rate
- P50/P95/P99 latency
- Errors by type

## 🧪 Testing Locally

### Start Dev Server

```bash
cd cloudflare-worker
wrangler dev
```

Worker runs at `http://localhost:8787`

### Test Endpoints

```bash
# Record a play
curl -X POST http://localhost:8787/api/track-play \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": 1,
    "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "timestamp": 1697385600000
  }'

# Get play count
curl http://localhost:8787/api/plays/1

# Get stats
curl http://localhost:8787/api/stats
```

### Update Frontend for Local Testing

```bash
# .env.local
VITE_PLAY_TRACKER_API=http://localhost:8787
```

## 💰 Cost Analysis

### Free Tier (Generous!)

- ✅ **100,000 requests/day** = 3 million/month
- ✅ **Unlimited KV reads**
- ✅ **1,000 KV writes/day** = 30,000/month
- ✅ **1 GB KV storage**
- ✅ **No credit card required**

### Paid Tier ($5/month)

- ✅ **10 million requests/month**
- ✅ **Unlimited KV operations**
- ✅ **More storage**

### Example Usage

**100 users playing 10 tracks/day:**
- 1,000 plays/day
- 30,000 plays/month
- **Cost: $0 (free tier)**

**10,000 users playing 10 tracks/day:**
- 100,000 plays/day
- 3 million plays/month
- **Cost: $5/month (paid tier)**

## 🔒 Security

### CORS Configuration

Worker allows all origins by default. To restrict:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-domain.com',
  // ...
};
```

### Rate Limiting

Add rate limiting to prevent abuse:

```javascript
// In worker
const rateLimitKey = `ratelimit:${userAddress}`;
const requests = await env.PLAY_COUNTS.get(rateLimitKey);

if (requests && parseInt(requests) > 100) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

### API Keys (Optional)

For production, add API key authentication:

```javascript
const apiKey = request.headers.get('X-API-Key');
if (apiKey !== env.API_KEY) {
  return new Response('Unauthorized', { status: 401 });
}
```

## 🐛 Troubleshooting

### "KV namespace not found"

Make sure you created the namespace and updated `wrangler.toml` with the correct IDs.

### "Failed to record play"

Check:
1. Worker is deployed: `wrangler deployments list`
2. CORS is configured correctly
3. Network tab in browser for errors

### "Cron not running"

Cron triggers only work in production, not local dev. Deploy to test:

```bash
wrangler deploy
```

### "High latency"

KV reads are fast (<50ms globally). If slow:
1. Check Cloudflare status
2. Verify KV namespace is correct
3. Check worker logs for errors

## 📚 Resources

- **Cloudflare Workers Docs:** https://developers.cloudflare.com/workers/
- **Wrangler CLI:** https://developers.cloudflare.com/workers/wrangler/
- **KV Storage:** https://developers.cloudflare.com/workers/runtime-apis/kv/
- **Cron Triggers:** https://developers.cloudflare.com/workers/configuration/cron-triggers/

## ✅ Checklist

- [ ] Install Wrangler CLI
- [ ] Login to Cloudflare
- [ ] Create KV namespaces
- [ ] Update wrangler.toml with IDs
- [ ] Deploy worker
- [ ] Get worker URL
- [ ] Update frontend .env
- [ ] Test play tracking
- [ ] Monitor in dashboard
- [ ] Set up cron for batch updates

## 🎉 You're Done!

Your play tracking API is now:
- ✅ Deployed globally
- ✅ Auto-scaling
- ✅ Cost-effective
- ✅ Fast (<50ms response time)
- ✅ Reliable (99.99% uptime)

**Now go play some tracks and watch the plays count up!** 🎵

---

**Need help?** Check the README.md in the cloudflare-worker directory.
