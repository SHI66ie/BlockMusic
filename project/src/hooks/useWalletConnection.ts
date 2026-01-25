import { useState, useEffect } from 'react';

export interface WalletInfo {
  address: string;
  provider: string;
  connectedAt: string;
}

export interface UseWalletConnectionReturn {
  wallet: WalletInfo | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: (provider: string) => Promise<{ success: boolean; address?: string; error?: string }>;
  disconnectWallet: () => void;
  hasSkipped: boolean;
}

export const useWalletConnection = (): UseWalletConnectionReturn => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasSkipped, setHasSkipped] = useState(false);

  // Check for existing wallet connection on mount
  useEffect(() => {
    const storedWallet = localStorage.getItem('connected_wallet');
    const storedProvider = localStorage.getItem('wallet_provider');
    const connectedAt = localStorage.getItem('wallet_connected_at');
    const skipped = localStorage.getItem('wallet_skipped');

    if (storedWallet && storedProvider) {
      setWallet({
        address: storedWallet,
        provider: storedProvider,
        connectedAt: connectedAt || new Date().toISOString()
      });
    }

    setHasSkipped(skipped === 'true');
  }, []);

  // Connect wallet
  const connectWallet = async (provider: string): Promise<{ success: boolean; address?: string; error?: string }> => {
    setIsConnecting(true);

    try {
      // Simulate wallet connection - in production, this would integrate with actual wallet providers
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock wallet address generation
      const mockAddress = '0x' + Math.random().toString(16).substr(2, 8) + '...' + 
                         Math.random().toString(16).substr(2, 4);

      // Store wallet info
      const walletInfo: WalletInfo = {
        address: mockAddress,
        provider,
        connectedAt: new Date().toISOString()
      };

      localStorage.setItem('connected_wallet', mockAddress);
      localStorage.setItem('wallet_provider', provider);
      localStorage.setItem('wallet_connected_at', walletInfo.connectedAt);
      localStorage.removeItem('wallet_skipped'); // Clear skip flag

      setWallet(walletInfo);
      setHasSkipped(false);

      return { success: true, address: mockAddress };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      return { success: false, error: errorMessage };
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    localStorage.removeItem('connected_wallet');
    localStorage.removeItem('wallet_provider');
    localStorage.removeItem('wallet_connected_at');
    setWallet(null);
  };

  // Listen for wallet connection events
  useEffect(() => {
    const handleWalletConnect = (event: CustomEvent) => {
      const { address, provider } = event.detail;
      const walletInfo: WalletInfo = {
        address,
        provider,
        connectedAt: new Date().toISOString()
      };
      setWallet(walletInfo);
      localStorage.setItem('connected_wallet', address);
      localStorage.setItem('wallet_provider', provider);
      localStorage.setItem('wallet_connected_at', walletInfo.connectedAt);
      localStorage.removeItem('wallet_skipped');
    };

    const handleWalletDisconnect = () => {
      disconnectWallet();
    };

    window.addEventListener('walletConnect', handleWalletConnect as EventListener);
    window.addEventListener('walletDisconnect', handleWalletDisconnect);

    return () => {
      window.removeEventListener('walletConnect', handleWalletConnect as EventListener);
      window.removeEventListener('walletDisconnect', handleWalletDisconnect);
    };
  }, []);

  return {
    wallet,
    isConnected: !!wallet,
    isConnecting,
    connectWallet,
    disconnectWallet,
    hasSkipped
  };
};
