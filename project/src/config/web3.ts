import { http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { createConfig } from 'wagmi';

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

// WalletConnect project ID - replace with your own from https://cloud.walletconnect.com/
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'YOUR_WALLET_CONNECT_PROJECT_ID';

// Configure Wagmi client
export const config = createConfig(
  getDefaultConfig({
    appName: 'BlockMusic',
    projectId,
    chains: [baseSepolia],
    transports: {
      [baseSepolia.id]: http(),
    },
  })
);

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
