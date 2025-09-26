import { useEffect, useState } from 'react';
import { useBlockNumber, useChainId } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { config } from '../config/web3';

type TransportConfig = {
  value?: {
    url: string;
  };
  toString: () => string;
} | (() => TransportConfig);

export const AlchemyTest = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockNumber, setBlockNumber] = useState<bigint | null>(null);
  const [networkName, setNetworkName] = useState<string>('');
  const [rpcUrl, setRpcUrl] = useState<string>('');
  const chainId = useChainId();
  
  const { data: blockNum } = useBlockNumber({ 
    chainId: baseSepolia.id,
    watch: true 
  });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the current network name
        const network = config.chains.find(c => c.id === chainId) || baseSepolia;
        setNetworkName(network.name);
        
        // Get the RPC URL being used - handle different transport formats
        const transportConfig = (config as { transports?: Record<number, TransportConfig> }).transports?.[chainId];
        if (transportConfig) {
          let url: string | undefined;
          
          // Handle different transport formats
          if (typeof transportConfig === 'function') {
            const transportInstance = transportConfig();
            url = 'value' in transportInstance 
              ? (typeof transportInstance.value === 'string' 
                  ? transportInstance.value 
                  : transportInstance.value?.url)
              : transportInstance.toString();
          } else if ('value' in transportConfig) {
            url = typeof transportConfig.value === 'string' 
              ? transportConfig.value 
              : transportConfig.value?.url;
          } else {
            url = transportConfig.toString();
          }
          
          // Clean up the URL to remove any API key
          if (url) {
            setRpcUrl(url.replace(/[a-fA-F0-9]{32}/, '***API_KEY***'));
          }
        }
        
        if (blockNum) {
          setBlockNumber(blockNum);
        }
        
      } catch (err) {
        console.error('Error checking Alchemy connection:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [chainId, blockNum]);

  if (isLoading) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-700">Connecting to Alchemy...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <h3 className="text-red-700 font-bold mb-2">Connection Error</h3>
        <p className="text-red-600">{error}</p>
        <p className="mt-2 text-sm text-gray-600">
          Make sure your Alchemy API key is correctly set in the .env file
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 rounded-lg">
      <h3 className="text-green-700 font-bold mb-2">Alchemy Connection Successful!</h3>
      <div className="space-y-2 text-sm">
        <p><span className="font-medium">Network:</span> {networkName}</p>
        <p><span className="font-medium">Chain ID:</span> {chainId}</p>
        {blockNumber && (
          <p><span className="font-medium">Latest Block:</span> {blockNumber.toString()}</p>
        )}
        {rpcUrl && (
          <div className="mt-2">
            <p className="font-medium">RPC URL:</p>
            <code className="text-xs bg-gray-100 p-1 rounded break-all">
              {rpcUrl.includes('alchemy') ? (
                <span className="text-green-700">{rpcUrl}</span>
              ) : (
                <span className="text-yellow-700">{rpcUrl} (Using public RPC - add Alchemy key for better performance)</span>
              )}
            </code>
          </div>
        )}
      </div>
    </div>
  );
};
