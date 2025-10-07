// Pinata IPFS Upload Configuration
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || '8ebf0ddd93c752935da7';
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY || '598dfe4a0f1b31400223a4142f6ad0341fe2bf05a9a5a1dd7771154193f92fc7';
const PINATA_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs/';

/**
 * Upload file to Pinata IPFS
 */
export async function uploadToPinata(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinata upload failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Uploaded to Pinata:', result.IpfsHash);
  return `${PINATA_GATEWAY_URL}${result.IpfsHash}`;
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
  // Remove gateway prefix if already present
  const hash = ipfsHash.replace(PINATA_GATEWAY_URL, '').replace('ipfs://', '');
  return `${PINATA_GATEWAY_URL}${hash}`;
}