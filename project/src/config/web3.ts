import { http } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient } from '@tanstack/react-query';

// Get Alchemy API key from environment variables
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || '';

// Debug: Log environment variables (without exposing the actual key)
console.group('Environment Variables');
console.log('NODE_ENV:', import.meta.env.MODE);
console.log('VITE_ALCHEMY_API_KEY:', alchemyApiKey ? '*** Key is set ***' : 'Key is missing or empty');
console.log('VITE_WALLET_CONNECT_PROJECT_ID:', import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID ? '*** Set ***' : 'Missing');
console.groupEnd();

if (!alchemyApiKey) {
  console.warn('Missing Alchemy API Key. Falling back to public RPC endpoints.');
}

// Base Sepolia testnet configuration with Alchemy
export const baseSepoliaConfig = {
  ...baseSepolia,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  rpcUrls: {
    default: { 
      http: [
        alchemyApiKey 
          ? `https://base-sepolia.g.alchemy.com/v2/${alchemyApiKey}`
          : 'https://sepolia.base.org'
      ],
    },
  },
  blockExplorers: {
    default: { name: 'Basescan', url: 'https://sepolia.basescan.org' },
  },
};

// WalletConnect project ID - get from environment variables
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('Missing WalletConnect Project ID. Some features may not work correctly.');
}

// Configure Wagmi client with Alchemy
export const config = getDefaultConfig({
  appName: 'BlockMusic',
  projectId: projectId,
  chains: [baseSepoliaConfig],
  ssr: true,
  // Use Alchemy as the primary RPC provider with fallback to public RPC
  transports: {
    [baseSepolia.id]: http(
      alchemyApiKey 
        ? `https://base-sepolia.g.alchemy.com/v2/${alchemyApiKey}`
        : 'https://sepolia.base.org',
      { 
        key: 'alchemy',
        name: 'Alchemy',
        // Add retry and timeout settings
        retryCount: 3,
        timeout: 30_000, // 30 seconds
      }
    ),
  },
});

// Setup queryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Wallet connection options
export const walletConnectionOptions = {
  chains: [baseSepolia],
  projectId,
  showQrModal: true,
  theme: 'light',
  themeVariables: {
    '--w3m-color-mix': '#0052FF',
    '--w3m-color-mix-strength': 40,
  },
} as const;
