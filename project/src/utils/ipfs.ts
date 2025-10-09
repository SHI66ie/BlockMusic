// Multiple IPFS gateways for fallback
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/',
];

/**
 * Convert IPFS URL to use alternative gateways
 */
export function convertIPFSUrl(url: string): string {
  if (!url) return '';
  
  // If it's already a gateway URL, extract the hash
  if (url.includes('/ipfs/')) {
    const hash = url.split('/ipfs/')[1];
    // Use cloudflare-ipfs.com as primary (better rate limits)
    return `https://cloudflare-ipfs.com/ipfs/${hash}`;
  }
  
  // If it's an ipfs:// protocol URL
  if (url.startsWith('ipfs://')) {
    const hash = url.replace('ipfs://', '');
    return `https://cloudflare-ipfs.com/ipfs/${hash}`;
  }
  
  return url;
}

/**
 * Get all possible gateway URLs for an IPFS hash
 */
export function getIPFSGatewayUrls(url: string): string[] {
  if (!url) return [];
  
  let hash = '';
  
  if (url.includes('/ipfs/')) {
    hash = url.split('/ipfs/')[1];
  } else if (url.startsWith('ipfs://')) {
    hash = url.replace('ipfs://', '');
  } else {
    return [url];
  }
  
  return IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`);
}
