import { http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient } from '@tanstack/react-query';

// Base Sepolia testnet configuration
export const baseSepoliaConfig = {
  ...baseSepolia,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  rpcUrls: {
    public: { http: ['https://sepolia.base.org'] },
    default: { http: ['https://sepolia.base.org'] },
  },
  blockExplorers: {
    etherscan: { name: 'Basescan', url: 'https://sepolia.basescan.org' },
    default: { name: 'Basescan', url: 'https://sepolia.basescan.org' },
  },
};

// WalletConnect project ID - get from environment variables
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('Missing WalletConnect Project ID. Some features may not work correctly.');
}

// Configure Wagmi client
export const config = getDefaultConfig({
  appName: 'BlockMusic',
  projectId: projectId,
  chains: [baseSepoliaConfig],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(),
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

// Setup RainbowKit
export const rainbowKitConfig = getDefaultConfig({
  appName: import.meta.env.VITE_APP_NAME || 'BlockMusic',
  projectId: projectId || 'dummy-project-id',
  chains: [baseSepolia],
  ssr: true,
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
