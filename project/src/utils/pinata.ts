// IPFS Upload via Backend API (Bypasses CORS)
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';
const IPFS_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs/';

/**
 * Upload file to IPFS via backend API (uses Pinata)
 */
export async function uploadToPinata(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BACKEND_API_URL}/ipfs/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
    } catch (e) {
      // If response is not JSON, use statusText
    }
    console.error('Backend error:', errorMessage);
    throw new Error(`IPFS upload failed: ${errorMessage}`);
  }

  const result = await response.json();
  console.log('✅ Uploaded to IPFS via backend:', result.gatewayUrl);
  return result.gatewayUrl;
}

/**
 * Upload JSON metadata to Pinata
 */
export async function uploadMetadataToPinata(metadata: Record<string, unknown>): Promise<string> {
  const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
  const file = new File([blob], 'metadata.json');
  return uploadToPinata(file);
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