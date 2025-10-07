import { http } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { QueryClient } from '@tanstack/react-query';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Get Alchemy API key from environment variables
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || '';

// Debug: Log environment variables (without exposing the actual key)
console.group('Environment Variables');
console.log('NODE_ENV:', import.meta.env.MODE);
console.log('VITE_ALCHEMY_API_KEY:', alchemyApiKey ? '*** Key is set ***' : 'Key is missing or empty');
console.log('VITE_WALLET_CONNECT_PROJECT_ID:', import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID ? '*** Set ***' : 'Missing');
console.groupEnd();

// Base Sepolia testnet configuration with Alchemy
export const baseSepoliaConfig = {
  ...baseSepolia,
  id: 84532, // Explicitly set chain ID for Base Sepolia
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
    public: {
      http: ['https://sepolia.base.org']
    },
    alchemy: {
      http: alchemyApiKey ? [`https://base-sepolia.g.alchemy.com/v2/${alchemyApiKey}`] : []
    }
  },
  blockExplorers: {
    default: { 
      name: 'Basescan', 
      url: 'https://sepolia.basescan.org' 
    },
  },
} as const;

// WalletConnect project ID - get from environment variables
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID';

if (!projectId) {
  console.warn('Missing WalletConnect Project ID. Some features may not work correctly.');
}

// Create configuration using RainbowKit's getDefaultConfig
// This automatically includes all popular wallet connectors
export const config = getDefaultConfig({
  appName: 'BlockMusic',
  projectId,
  chains: [baseSepoliaConfig],
  transports: {
    [baseSepoliaConfig.id]: http(
      alchemyApiKey
        ? `https://base-sepolia.g.alchemy.com/v2/${alchemyApiKey}`
        : 'https://sepolia.base.org',
      {
        key: 'alchemy',
        name: 'Alchemy',
        retryCount: 3,
        timeout: 30_000, // 30 seconds
      }
    ),
  },
  ssr: true,
});

// Setup queryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error) => {
        console.error('Query error:', error);
      },
    },
  },
});

// RainbowKit configuration
export const rainbowKitConfig = {
  projectId,
  chains: [baseSepoliaConfig],
  // Add any additional RainbowKit configuration
};

// Wallet connection options
export const walletConnectionOptions = {
  projectId,
  chains: [baseSepoliaConfig],
  showQrModal: true,
  theme: 'light',
  themeVariables: {
    '--w3m-color-mix': '#0052FF',
    '--w3m-color-mix-strength': 40,
  },
};
