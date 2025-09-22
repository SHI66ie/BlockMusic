import { http, createConfig } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient } from '@tanstack/react-query';

// Base Sepolia testnet configuration
export const baseSepoliaConfig = {
  id: baseSepolia.id,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://sepolia.base.org'] },
    default: { http: ['https://sepolia.base.org'] },
  },
  blockExplorers: {
    etherscan: { name: 'Basescan', url: 'https://sepolia.basescan.org' },
    default: { name: 'Basescan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
};

// WalletConnect project ID - get from environment variables
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

if (!projectId || projectId === 'YOUR_WALLET_CONNECT_PROJECT_ID') {
  console.error('Missing or invalid WalletConnect Project ID. Please create a .env file with VITE_WALLET_CONNECT_PROJECT_ID');
  // Fallback to a dummy ID in development
  if (import.meta.env.DEV) {
    console.warn('Using dummy WalletConnect Project ID for development');
  } else {
    throw new Error('Missing required environment variable: VITE_WALLET_CONNECT_PROJECT_ID');
  }
}

// Configure Wagmi client
export const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  ssr: true,
});

// Setup queryClient
export const queryClient = new QueryClient();

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
