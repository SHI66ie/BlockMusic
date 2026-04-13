import React, { createContext, useContext, useMemo, useCallback, useState, useEffect, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { createGenLayerClient, GENLAYER_CONTRACTS } from '../config/genlayer';

// ============================================================
// GenLayer Context Provider for BlockMusic
// ============================================================

interface GenLayerContextType {
  /** The GenLayer client instance (null if not ready) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any;
  /** Whether GenLayer is properly configured and ready */
  isReady: boolean;
  /** Whether a GenLayer transaction is in progress */
  isLoading: boolean;
  /** Last error from a GenLayer operation */
  error: string | null;
  /** Contract addresses */
  contracts: typeof GENLAYER_CONTRACTS;
  /** Read data from a GenLayer contract */
  readContract: (address: `0x${string}`, functionName: string, args?: unknown[]) => Promise<unknown>;
  /** Write data to a GenLayer contract */
  writeContract: (address: `0x${string}`, functionName: string, args?: unknown[], value?: bigint) => Promise<string>;
  /** Wait for a GenLayer transaction to finalize */
  waitForTransaction: (hash: string) => Promise<unknown>;
  /** Clear error state */
  clearError: () => void;
}

const GenLayerContext = createContext<GenLayerContextType | null>(null);

interface GenLayerProviderProps {
  children: ReactNode;
}

export function GenLayerProvider({ children }: GenLayerProviderProps) {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create GenLayer client - recreate when wallet address changes
  const client = useMemo(() => {
    try {
      return createGenLayerClient(address as `0x${string}` | undefined);
    } catch (err) {
      console.error('Failed to create GenLayer client:', err);
      return null;
    }
  }, [address]);

  // Check if GenLayer is properly configured
  const isReady = useMemo(() => {
    const hasClient = client !== null;
    const hasContracts = Object.values(GENLAYER_CONTRACTS).some(addr => String(addr).length > 0 && String(addr) !== '0x...');
    return hasClient && hasContracts;
  }, [client]);

  // Log readiness state
  useEffect(() => {
    if (isReady) {
      console.log('✅ GenLayer is ready');
    } else {
      console.log('⚠️ GenLayer is not fully configured');
    }
  }, [isReady]);

  // Read from a GenLayer contract
  const readContract = useCallback(
    async (contractAddress: `0x${string}`, functionName: string, args: unknown[] = []) => {
      if (!client) throw new Error('GenLayer client not initialized');

      try {
        const result = await client.readContract({
          address: contractAddress,
          functionName,
          args,
        });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error reading contract';
        setError(message);
        throw err;
      }
    },
    [client]
  );

  // Write to a GenLayer contract  
  const writeContract = useCallback(
    async (
      contractAddress: `0x${string}`,
      functionName: string,
      args: unknown[] = [],
      value?: bigint
    ) => {
      if (!client) throw new Error('GenLayer client not initialized');
      if (!isConnected) throw new Error('Wallet not connected');

      setIsLoading(true);
      setError(null);

      try {
        const txHash = await client.writeContract({
          address: contractAddress,
          functionName,
          args,
          value: value || BigInt(0),
        });

        return txHash;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error writing to contract';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client, isConnected]
  );

  // Wait for transaction finalization
  const waitForTransaction = useCallback(
    async (hash: string) => {
      if (!client) throw new Error('GenLayer client not initialized');

      setIsLoading(true);
      try {
        const receipt = await client.waitForTransactionReceipt({
          hash,
          status: 'FINALIZED',
        });
        return receipt;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transaction failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const clearError = useCallback(() => setError(null), []);

  const contextValue: GenLayerContextType = useMemo(
    () => ({
      client,
      isReady,
      isLoading,
      error,
      contracts: GENLAYER_CONTRACTS,
      readContract,
      writeContract,
      waitForTransaction,
      clearError,
    }),
    [client, isReady, isLoading, error, readContract, writeContract, waitForTransaction, clearError]
  );

  return (
    <GenLayerContext.Provider value={contextValue}>
      {children}
    </GenLayerContext.Provider>
  );
}

/**
 * Hook to access the GenLayer context.
 * Must be used within a GenLayerProvider.
 */
export function useGenLayerContext() {
  const context = useContext(GenLayerContext);
  if (!context) {
    throw new Error('useGenLayerContext must be used within a GenLayerProvider');
  }
  return context;
}
