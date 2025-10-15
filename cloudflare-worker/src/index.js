/**
 * BlockMusic Play Tracker - Cloudflare Worker
 * Tracks music plays and batches updates to blockchain
 */

export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      // Route: POST /api/track-play
      if (url.pathname === '/api/track-play' && request.method === 'POST') {
        return await handleTrackPlay(request, env, corsHeaders);
      }

      // Route: GET /api/plays/:tokenId
      if (url.pathname.startsWith('/api/plays/') && request.method === 'GET') {
        const tokenId = url.pathname.split('/')[3];
        return await getPlayCount(tokenId, env, corsHeaders);
      }

      // Route: GET /api/stats
      if (url.pathname === '/api/stats' && request.method === 'GET') {
        return await getStats(env, corsHeaders);
      }

      // Route: GET /api/artist/:address
      if (url.pathname.startsWith('/api/artist/') && request.method === 'GET') {
        const address = url.pathname.split('/')[3];
        return await getArtistStats(address, env, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },

  // Cron trigger - runs every hour
  async scheduled(event, env, ctx) {
    console.log('Running scheduled batch update...');
    await batchUpdateBlockchain(env);
  },
};

/**
 * Handle track play recording
 */
async function handleTrackPlay(request, env, corsHeaders) {
  const data = await request.json();
  const { tokenId, userAddress, timestamp } = data;

  // Validate input
  if (!tokenId || !userAddress) {
    return new Response(
      JSON.stringify({ error: 'Missing tokenId or userAddress' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Store play in KV
  const playKey = `play:${tokenId}`;
  const currentCount = await env.PLAY_COUNTS.get(playKey);
  const newCount = currentCount ? parseInt(currentCount) + 1 : 1;
  await env.PLAY_COUNTS.put(playKey, newCount.toString());

  // Store play details for analytics
  const playDetailsKey = `play:${tokenId}:${Date.now()}`;
  await env.PLAY_COUNTS.put(
    playDetailsKey,
    JSON.stringify({ userAddress, timestamp: timestamp || Date.now() }),
    { expirationTtl: 86400 * 30 } // Keep for 30 days
  );

  // Track pending updates
  const pendingKey = `pending:${tokenId}`;
  const pending = await env.PLAY_COUNTS.get(pendingKey);
  const pendingCount = pending ? parseInt(pending) + 1 : 1;
  await env.PLAY_COUNTS.put(pendingKey, pendingCount.toString());

  return new Response(
    JSON.stringify({
      success: true,
      tokenId,
      totalPlays: newCount,
      pendingBlockchainUpdate: pendingCount,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Get play count for a specific track
 */
async function getPlayCount(tokenId, env, corsHeaders) {
  const playKey = `play:${tokenId}`;
  const count = await env.PLAY_COUNTS.get(playKey);

  return new Response(
    JSON.stringify({
      tokenId,
      plays: count ? parseInt(count) : 0,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Get overall stats
 */
async function getStats(env, corsHeaders) {
  // Get all play counts
  const list = await env.PLAY_COUNTS.list({ prefix: 'play:' });
  
  let totalPlays = 0;
  let totalTracks = 0;

  for (const key of list.keys) {
    if (!key.name.includes(':') || key.name.split(':').length === 2) {
      const count = await env.PLAY_COUNTS.get(key.name);
      if (count) {
        totalPlays += parseInt(count);
        totalTracks++;
      }
    }
  }

  return new Response(
    JSON.stringify({
      totalPlays,
      totalTracks,
      lastUpdate: new Date().toISOString(),
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Get artist-specific stats
 */
async function getArtistStats(address, env, corsHeaders) {
  // This would require querying the blockchain to get artist's tracks
  // Then summing up plays for those tracks
  // For now, return placeholder
  
  return new Response(
    JSON.stringify({
      address,
      totalPlays: 0,
      tracks: [],
      message: 'Artist stats coming soon',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Batch update blockchain with accumulated plays
 * Runs every hour via cron trigger
 */
async function batchUpdateBlockchain(env) {
  console.log('Starting batch blockchain update...');

  try {
    // Get all pending updates
    const pendingList = await env.PLAY_COUNTS.list({ prefix: 'pending:' });
    
    if (pendingList.keys.length === 0) {
      console.log('No pending updates');
      return;
    }

    const updates = [];
    
    for (const key of pendingList.keys) {
      const tokenId = key.name.split(':')[1];
      const pendingCount = await env.PLAY_COUNTS.get(key.name);
      
      if (pendingCount && parseInt(pendingCount) > 0) {
        updates.push({
          tokenId: parseInt(tokenId),
          plays: parseInt(pendingCount),
        });
      }
    }

    if (updates.length === 0) {
      console.log('No updates to process');
      return;
    }

    console.log(`Processing ${updates.length} track updates`);

    // TODO: Call smart contract to batch update
    // This requires a backend wallet with gas funds
    // For now, just log the updates
    console.log('Updates to process:', updates);

    // Clear pending counts after successful update
    for (const key of pendingList.keys) {
      await env.PLAY_COUNTS.delete(key.name);
    }

    console.log('Batch update complete');
  } catch (error) {
    console.error('Batch update failed:', error);
  }
}
