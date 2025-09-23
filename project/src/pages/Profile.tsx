import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { shortenAddress } from '../utils/address';

type NFT = {
  id: string;
  title: string;
  description: string;
  price: string;
  image: string;
  isListed: boolean;
};

export default function Profile() {
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) return;
    
    // Simulate loading NFTs
    const loadNfts = async () => {
      setIsLoading(true);
      try {
        // TODO: Fetch user's NFTs from the blockchain
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        setNfts([
          {
            id: '1',
            title: 'Summer Vibes',
            description: 'Chill summer beats',
            price: '0.05',
            image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            isListed: true,
          },
          {
            id: '2',
            title: 'Midnight Groove',
            description: 'Late night jazz session',
            price: '0.03',
            image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            isListed: false,
          },
        ]);
      } catch (error) {
        console.error('Failed to load NFTs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNfts();
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Connect your wallet</h2>
        <p className="text-gray-400">Please connect your wallet to view your profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="h-20 w-20 rounded-full bg-purple-600 flex items-center justify-center text-2xl font-bold">
            {address?.substring(2, 4).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Your Collection</h1>
            <p className="text-gray-400 font-mono">{shortenAddress(address || '')}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your NFTs ({nfts.length})</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                <div className="aspect-square bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : nfts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nfts.map((nft) => (
              <div key={nft.id} className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors">
                <img 
                  src={nft.image} 
                  alt={nft.title} 
                  className="w-full aspect-square object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{nft.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{nft.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-400 font-medium">{nft.price} ETH</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      nft.isListed 
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {nft.isListed ? 'Listed' : 'Not Listed'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
            <p className="text-gray-400">You don't have any NFTs yet</p>
            <a 
              href="/create" 
              className="mt-2 inline-block text-purple-400 hover:text-purple-300"
            >
              Create your first NFT
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
