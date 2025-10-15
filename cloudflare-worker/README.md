# BlockMusic Play Tracker - Cloudflare Worker

Serverless API for tracking music plays using Cloudflare Workers + KV storage.

## Features

- ✅ **Instant play tracking** - No gas fees for users
- ✅ **Global CDN** - Fast response times worldwide
- ✅ **Automatic batching** - Updates blockchain every hour
- ✅ **Free tier** - 100k requests/day free
- ✅ **Analytics** - Track plays per song, artist, user

## Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create KV Namespace

```bash
# Production
wrangler kv:namespace create "PLAY_COUNTS"

# Preview (for development)
wrangler kv:namespace create "PLAY_COUNTS" --preview
```

Copy the IDs and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "PLAY_COUNTS"
id = "your_kv_namespace_id_here"
preview_id = "your_preview_kv_namespace_id_here"
```

### 4. Deploy

```bash
# Deploy to production
wrangler deploy

# Or run locally for testing
wrangler dev
```

## API Endpoints

### POST /api/track-play

Record a play for a track.

**Request:**
```json
{
  "tokenId": 1,
  "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "timestamp": 1697385600000
}
```

**Response:**
```json
{
  "success": true,
  "tokenId": 1,
  "totalPlays": 42,
  "pendingBlockchainUpdate": 5
}
```

### GET /api/plays/:tokenId

Get play count for a specific track.

**Response:**
```json
{
  "tokenId": 1,
  "plays": 42
}
```

### GET /api/stats

Get overall platform stats.

**Response:**
```json
{
  "totalPlays": 1234,
  "totalTracks": 56,
  "lastUpdate": "2025-10-15T10:00:00.000Z"
}
```

### GET /api/artist/:address

Get stats for a specific artist.

**Response:**
```json
{
  "address": "0x...",
  "totalPlays": 567,
  "tracks": [...]
}
```

## Frontend Integration

### Install Axios (or use fetch)

```bash
npm install axios
```

### Update MusicPlayerContext.tsx

```typescript
import axios from 'axios';

const PLAY_TRACKER_API = 'https://blockmusic-play-tracker.your-subdomain.workers.dev';

const recordPlay = async (tokenId: number, userAddress: string) => {
  try {
    await axios.post(`${PLAY_TRACKER_API}/api/track-play`, {
      tokenId,
      userAddress,
      timestamp: Date.now(),
    });
    console.log(`✅ Play recorded for track ${tokenId}`);
  } catch (error) {
    console.error('Failed to record play:', error);
  }
};

// In playTrack function:
const playTrack = (track: Track) => {
  // ... existing code ...
  
  // Record play (non-blocking)
  if (track.id && address) {
    recordPlay(track.id, address);
  }
};
```

### Update Artist Dashboard

```typescript
import axios from 'axios';

const PLAY_TRACKER_API = 'https://blockmusic-play-tracker.your-subdomain.workers.dev';

// Fetch real-time play counts
const fetchPlayCounts = async (tokenIds: number[]) => {
  const promises = tokenIds.map(id => 
    axios.get(`${PLAY_TRACKER_API}/api/plays/${id}`)
  );
  
  const results = await Promise.all(promises);
  return results.map(r => r.data);
};
```

## Cron Job (Automatic Batch Updates)

The worker automatically runs every hour to batch update the blockchain:

```javascript
// Runs at minute 0 of every hour
[triggers]
crons = ["0 * * * *"]
```

To manually trigger:

```bash
wrangler tail
```

## Cost Estimate

### Cloudflare Workers Free Tier:
- ✅ **100,000 requests/day** - FREE
- ✅ **Unlimited KV reads** - FREE
- ✅ **1,000 KV writes/day** - FREE
- ✅ **1 GB KV storage** - FREE

### Paid Tier ($5/month):
- ✅ **10 million requests/month**
- ✅ **Unlimited KV operations**
- ✅ **More storage**

**For most apps, free tier is enough!**

## Environment Variables

Set secrets for sensitive data:

```bash
# Private key for blockchain updates (keep secret!)
wrangler secret put PRIVATE_KEY

# Alchemy/Infura RPC URL
wrangler secret put RPC_URL
```

## Monitoring

View logs in real-time:

```bash
wrangler tail
```

View analytics in Cloudflare Dashboard:
- Requests per second
- Error rates
- Response times
- KV operations

## Testing Locally

```bash
# Start local dev server
wrangler dev

# Test endpoints
curl -X POST http://localhost:8787/api/track-play \
  -H "Content-Type: application/json" \
  -d '{"tokenId": 1, "userAddress": "0x123..."}'

curl http://localhost:8787/api/plays/1
curl http://localhost:8787/api/stats
```

## Production Deployment

1. **Deploy worker:**
   ```bash
   wrangler deploy
   ```

2. **Get your worker URL:**
   ```
   https://blockmusic-play-tracker.your-subdomain.workers.dev
   ```

3. **Update frontend .env:**
   ```bash
   VITE_PLAY_TRACKER_API=https://blockmusic-play-tracker.your-subdomain.workers.dev
   ```

4. **Test it:**
   - Play a track
   - Check console for "✅ Play recorded"
   - Wait 1 hour for batch update
   - Refresh Artist Dashboard

## Advantages of Cloudflare Workers

1. **No Server Management** - Fully serverless
2. **Global Performance** - Runs on 300+ data centers
3. **Auto-scaling** - Handles traffic spikes automatically
4. **Cost-effective** - Free tier is generous
5. **Built-in DDoS Protection** - Cloudflare security
6. **Easy Deployment** - One command to deploy
7. **Real-time Logs** - Built-in monitoring

## Next Steps

1. ✅ Deploy this worker
2. ✅ Update frontend to call API
3. ✅ Test play tracking
4. ⏳ Implement blockchain batch updates
5. ⏳ Add analytics dashboard
6. ⏳ Set up monitoring alerts

## Support

- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/
- KV Storage: https://developers.cloudflare.com/workers/runtime-apis/kv/

---

**Status:** Ready to deploy! 🚀
