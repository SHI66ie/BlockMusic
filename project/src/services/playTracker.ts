/**
 * Play Tracker Service
 * Communicates with Cloudflare Worker API to track plays
 */

const PLAY_TRACKER_API = import.meta.env.VITE_PLAY_TRACKER_API || 'http://localhost:8787';

export interface PlayData {
  tokenId: number;
  userAddress: string;
  timestamp?: number;
}

export interface PlayResponse {
  success: boolean;
  tokenId: number;
  totalPlays: number;
  pendingBlockchainUpdate: number;
}

export interface PlayCountResponse {
  tokenId: number;
  plays: number;
}

export interface StatsResponse {
  totalPlays: number;
  totalTracks: number;
  lastUpdate: string;
}

/**
 * Record a play for a track
 */
export async function recordPlay(data: PlayData): Promise<PlayResponse> {
  try {
    const response = await fetch(`${PLAY_TRACKER_API}/api/track-play`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        timestamp: data.timestamp || Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to record play:', error);
    throw error;
  }
}

/**
 * Get play count for a specific track
 */
export async function getPlayCount(tokenId: number): Promise<PlayCountResponse> {
  try {
    const response = await fetch(`${PLAY_TRACKER_API}/api/plays/${tokenId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get play count:', error);
    throw error;
  }
}

/**
 * Get play counts for multiple tracks
 */
export async function getPlayCounts(tokenIds: number[]): Promise<PlayCountResponse[]> {
  try {
    const promises = tokenIds.map(id => getPlayCount(id));
    return await Promise.all(promises);
  } catch (error) {
    console.error('Failed to get play counts:', error);
    throw error;
  }
}

/**
 * Get overall platform stats
 */
export async function getStats(): Promise<StatsResponse> {
  try {
    const response = await fetch(`${PLAY_TRACKER_API}/api/stats`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get stats:', error);
    throw error;
  }
}

/**
 * Get artist-specific stats
 */
export async function getArtistStats(address: string) {
  try {
    const response = await fetch(`${PLAY_TRACKER_API}/api/artist/${address}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get artist stats:', error);
    throw error;
  }
}
