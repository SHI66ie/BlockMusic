import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'viem/chains';

export function useBlockchain() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Check if connected to Base Sepolia
  const isCorrectChain = chainId === baseSepolia.id;

  // Switch to Base Sepolia
  const switchToBaseSepolia = async () => {
    try {
      await switchChain({ chainId: baseSepolia.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return {
    address,
    isConnected,
    isCorrectChain,
    chainId,
    switchToBaseSepolia,
    formatAddress,
  };
}
