import { createClient } from 'genlayer-js';
import { localnet } from 'genlayer-js/chains';

// ============================================================
// GenLayer Configuration for BlockMusic
// ============================================================

// GenLayer contract addresses (update after deployment)
export const GENLAYER_CONTRACTS = {
  contentModerator: (import.meta.env.VITE_GENLAYER_CONTENT_MODERATOR || '') as `0x${string}`,
  musicRecommender: (import.meta.env.VITE_GENLAYER_MUSIC_RECOMMENDER || '') as `0x${string}`,
  copyrightVerifier: (import.meta.env.VITE_GENLAYER_COPYRIGHT_VERIFIER || '') as `0x${string}`,
  artistVerifier: (import.meta.env.VITE_GENLAYER_ARTIST_VERIFIER || '') as `0x${string}`,
};

// GenLayer network configuration
const genLayerNetwork = import.meta.env.VITE_GENLAYER_NETWORK || 'localnet';

// Custom chain configuration for testnet/mainnet
const getChainConfig = () => {
  switch (genLayerNetwork) {
    case 'testnet':
      return {
        id: 0,
        name: 'GenLayer Testnet',
        nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
        rpcUrls: {
          default: {
            http: [import.meta.env.VITE_GENLAYER_RPC_URL || 'https://studio.genlayer.com/api'],
          },
        },
      };
    case 'localnet':
    default:
      return localnet;
  }
};

/**
 * Create a GenLayer client instance.
 * 
 * For read-only calls, no account is needed.
 * For write transactions, pass the user's wallet address.
 */
export function createGenLayerClient(account?: `0x${string}`) {
  const chain = getChainConfig();
  
  const clientConfig: Record<string, unknown> = {
    chain,
  };

  if (account) {
    clientConfig.account = account;
  }

  return createClient(clientConfig as Parameters<typeof createClient>[0]);
}

// Type exports for GenLayer transaction status
export { TransactionStatus } from 'genlayer-js/types';

// Debug logging
console.group('GenLayer Configuration');
console.log('Network:', genLayerNetwork);
console.log('Content Moderator:', GENLAYER_CONTRACTS.contentModerator ? '*** Set ***' : 'Not configured');
console.log('Music Recommender:', GENLAYER_CONTRACTS.musicRecommender ? '*** Set ***' : 'Not configured');
console.log('Copyright Verifier:', GENLAYER_CONTRACTS.copyrightVerifier ? '*** Set ***' : 'Not configured');
console.log('Artist Verifier:', GENLAYER_CONTRACTS.artistVerifier ? '*** Set ***' : 'Not configured');
console.groupEnd();
