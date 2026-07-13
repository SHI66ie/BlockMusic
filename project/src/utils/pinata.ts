// IPFS Upload via Pinata (Direct API - no backend required)
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || '';
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || '8ebf0ddd93c752935da7';
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY || '598dfe4a0f1b31400223a4142f6ad0341fe2bf05a9a5a1dd7771154193f92fc7';
const IPFS_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs/';

/**
 * Upload file directly to Pinata IPFS (no backend required)
 * Tries JWT first, falls back to API key auth
 */
export async function uploadToPinata(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};

  if (PINATA_JWT) {
    headers['Authorization'] = `Bearer ${PINATA_JWT}`;
  } else {
    headers['pinata_api_key'] = PINATA_API_KEY;
    headers['pinata_secret_api_key'] = PINATA_SECRET_KEY;
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.details || errorData.error || errorData.message || JSON.stringify(errorData);
    } catch {
      // If response is not JSON, use statusText
    }
    throw new Error(`IPFS upload failed: ${errorMessage}`);
  }

  const result = await response.json();
  const ipfsHash = result.IpfsHash;
  const gatewayUrl = `${IPFS_GATEWAY_URL}${ipfsHash}`;
  console.log('✅ Uploaded to IPFS:', gatewayUrl);
  return gatewayUrl;
}

/**
 * Upload JSON metadata to Pinata (direct API, no backend needed)
 */
export async function uploadMetadataToPinata(metadata: Record<string, unknown>): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (PINATA_JWT) {
    headers['Authorization'] = `Bearer ${PINATA_JWT}`;
  } else {
    headers['pinata_api_key'] = PINATA_API_KEY;
    headers['pinata_secret_api_key'] = PINATA_SECRET_KEY;
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: `BlockMusic - ${metadata.name || 'track'}.json` },
    }),
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.details || errorData.error || errorData.message || JSON.stringify(errorData);
    } catch {
      // ignore
    }
    throw new Error(`IPFS metadata upload failed: ${errorMessage}`);
  }

  const result = await response.json();
  const ipfsHash = result.IpfsHash;
  const gatewayUrl = `${IPFS_GATEWAY_URL}${ipfsHash}`;
  console.log('✅ Metadata uploaded to IPFS:', gatewayUrl);
  return gatewayUrl;
}

/**
 * Convert IPFS hash to gateway URL
 */
export function getIPFSGatewayUrl(ipfsHash: string): string {
  // If already a full URL, return as is
  if (ipfsHash.startsWith('http')) {
    return ipfsHash;
  }
  // Remove ipfs:// prefix if present
  const hash = ipfsHash.replace('ipfs://', '');
  return `${IPFS_GATEWAY_URL}${hash}`;
}