import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { readContract } from '@wagmi/core';
import { config } from '../config/web3';
import { formatEther, formatUnits } from 'viem';
import { FaMusic, FaEthereum, FaChartLine, FaTshirt, FaCalendar, FaPlay, FaDollarSign, FaTrophy, FaUsers, FaPlus, FaSync, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import RevenueClaimCard from '../components/artist/RevenueClaimCard';
import { getPlayCount } from '../services/playTracker';
import { RevenueDistribution } from '../abis/RevenueDistribution';

const MUSIC_NFT_CONTRACT = import.meta.env.VITE_MUSIC_NFT_CONTRACT || '0xbB509d5A144E3E3d240D7CFEdffC568BE35F1348';
const REVENUE_DISTRIBUTION_CONTRACT = import.meta.env.VITE_REVENUE_DISTRIBUTION_CONTRACT || '0xa61eAfed9c3B7cF6575FB7E35E18ABe425306f02';

// Helper function to format duration from seconds to MM:SS
const formatDuration = (seconds: number | bigint): string => {
  const totalSeconds = Number(seconds);
  if (!totalSeconds || totalSeconds <= 0) return '0:00';
  
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface Track {
  id: number;
  title: string;
  duration: string;
  plays: number;
  pendingPlays: number;
  revenue: string;
  releaseDate: string;
}

interface MerchItem {
  id: number;
  name: string;
  price: string;
  stock: number;
  sold: number;
}

interface Event {
  id: number;
  title: string;
  date: string;
  venue: string;
  ticketsSold: number;
  totalTickets: number;
  revenue: string;
}

export default function Artist() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'music' | 'merch' | 'events'>('overview');
  const [myTracks, setMyTracks] = useState<Track[]>([]);
  const [merchItems, setMerchItems] = useState<MerchItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Get total supply to fetch artist's tracks
  const { data: totalSupply } = useReadContract({
    address: MUSIC_NFT_CONTRACT as `0x${string}`,
    abi: [
      {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ],
    functionName: 'totalSupply',
  });

  // Load artist's tracks
  useEffect(() => {
    const loadTracks = async () => {
      if (!address || !totalSupply) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      try {
        const supply = Number(totalSupply);
        const artistTracks: Track[] = [];

        // Fetch all tracks and filter by artist address
        for (let i = 0; i < supply; i++) {
          try {
            // Get metadata from contract
            const metadata = await readContract(config, {
              address: MUSIC_NFT_CONTRACT as `0x${string}`,
              abi: [
                {
                  name: 'getMusicMetadata',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [{ name: 'tokenId', type: 'uint256' }],
                  outputs: [{
                    type: 'tuple',
                    components: [
                      { name: 'trackTitle', type: 'string' },
                      { name: 'artistName', type: 'string' },
                      { name: 'albumName', type: 'string' },
                      { name: 'releaseType', type: 'string' },
                      { name: 'genre', type: 'string' },
                      { name: 'samples', type: 'string[]' },
                      { name: 'coverArtURI', type: 'string' },
                      { name: 'audioURI', type: 'string' },
                      { name: 'duration', type: 'uint256' },
                      { name: 'releaseDate', type: 'uint256' },
                      { name: 'artist', type: 'address' },
                      { name: 'playCount', type: 'uint256' },
                      { name: 'isExplicit', type: 'bool' }
                    ]
                  }]
                }
              ] as const,
              functionName: 'getMusicMetadata',
              args: [BigInt(i)],
            });

            // Only include tracks where artist matches connected address
            if (metadata && metadata.artist.toLowerCase() === address.toLowerCase()) {
              const releaseDate = new Date(Number(metadata.releaseDate) * 1000);
              const confirmedPlays = Number(metadata.playCount) || 0;
              
              // Fetch pending plays from Cloudflare
              let pendingPlays = 0;
              try {
                const cloudflareData = await getPlayCount(i);
                pendingPlays = cloudflareData.totalPlays - confirmedPlays;
                if (pendingPlays < 0) pendingPlays = 0; // Safety check
              } catch (err) {
                console.log(`No pending plays for track ${i}`);
              }
              
              const totalPlays = confirmedPlays + pendingPlays;
              // Calculate revenue: 0.0001 ETH per play * 85% artist share
              const revenue = (totalPlays * 0.000085).toFixed(6);
              
              artistTracks.push({
                id: i,
                title: metadata.trackTitle || `Track ${i + 1}`,
                duration: formatDuration(metadata.duration),
                plays: confirmedPlays,
                pendingPlays: pendingPlays,
                revenue: revenue,
                releaseDate: releaseDate.toISOString().split('T')[0]
              });
            }
          } catch (err) {
            console.error(`Error fetching track ${i}:`, err);
          }
        }

        setMyTracks(artistTracks);
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Error loading tracks:', error);
        toast.error('Failed to load your tracks');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    loadTracks();
  }, [address, totalSupply]);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info('Refreshing data from blockchain...');
    
    // Trigger reload by updating a dependency
    // This will re-run the useEffect above
    window.location.reload();
  };

  // Fetch real blockchain earnings data
  const { data: revenueSummary } = useReadContract({
    address: REVENUE_DISTRIBUTION_CONTRACT as `0x${string}`,
    abi: RevenueDistribution,
    functionName: 'getArtistRevenueSummary',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  const claimableETH = revenueSummary ? revenueSummary[0] : BigInt(0);
  const claimableUSDC = revenueSummary ? revenueSummary[1] : BigInt(0);
  const totalClaimedETH = revenueSummary ? revenueSummary[2] : BigInt(0);
  const totalClaimedUSDC = revenueSummary ? revenueSummary[3] : BigInt(0);
  const artistPlays = revenueSummary ? Number(revenueSummary[4]) : 0;
  const totalPlays = revenueSummary ? Number(revenueSummary[5]) : 0;

  // Calculate total earnings from blockchain data
  const totalEarnings = Number(formatEther(claimableETH)) + Number(formatEther(totalClaimedETH));
  const totalUSDC = Number(formatUnits(claimableUSDC, 6)) + Number(formatUnits(totalClaimedUSDC, 6));

  // Load events (mock data for now)
  useEffect(() => {
    setEvents([
      {
        id: 1,
        title: 'BlockMusic Live 2025',
        date: '2025-12-15',
        venue: 'Crypto Arena',
        ticketsSold: 450,
        totalTickets: 500,
        revenue: '4.5'
      },
      {
        id: 2,
        title: 'Summer Festival',
        date: '2025-08-20',
        venue: 'Digital Park',
        ticketsSold: 1200,
        totalTickets: 1500,
        revenue: '12.0'
      },
    ]);
  }, []);

  // Calculate total earnings from blockchain data only
  const totalEarnings = Number(formatEther(claimableETH)) + Number(formatEther(totalClaimedETH));
  const totalUSDC = Number(formatUnits(claimableUSDC, 6)) + Number(formatUnits(totalClaimedUSDC, 6));
  const grandTotalEarnings = totalEarnings + totalUSDC;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <FaMusic className="text-6xl text-gray-600" />
        <h2 className="text-2xl font-bold">Connect Wallet</h2>
        <p className="text-gray-400 text-center max-w-md">
          Connect your wallet to access your artist dashboard
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Artist Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}</p>
          {lastRefresh && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            title="Refresh data from blockchain"
          >
            <FaSync className={isRefreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <FaPlus /> Upload New Track
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Earnings</p>
              <p className="text-2xl font-bold mt-1">{grandTotalEarnings.toFixed(4)} ETH</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatEther(claimableETH)} ETH claimable • {formatUnits(claimableUSDC, 6)} USDC claimable
              </p>
            </div>
            <FaDollarSign className="text-3xl text-green-500" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Plays</p>
              <p className="text-2xl font-bold mt-1">{totalPlays.toLocaleString()}</p>
            </div>
            <FaPlay className="text-3xl text-purple-500" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Tracks</p>
              <p className="text-2xl font-bold mt-1">{myTracks.length}</p>
            </div>
            <FaMusic className="text-3xl text-blue-500" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Fans</p>
              <p className="text-2xl font-bold mt-1">1.2K</p>
            </div>
            <FaUsers className="text-3xl text-pink-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-purple-500 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaChartLine className="inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('music')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'music'
                ? 'text-purple-500 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaMusic className="inline mr-2" />
            Music
          </button>
          <button
            onClick={() => setActiveTab('merch')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'merch'
                ? 'text-purple-500 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaTshirt className="inline mr-2" />
            Merch
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'events'
                ? 'text-purple-500 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaCalendar className="inline mr-2" />
            Events
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Revenue Claim Card */}
          <RevenueClaimCard />

          {/* Recent Performance */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Streaming Revenue</p>
                <p className="text-2xl font-bold mt-2">{totalEarnings.toFixed(4)} ETH</p>
                <p className="text-green-400 text-sm mt-1">
                  {formatEther(claimableETH)} ETH claimable • {formatUnits(claimableUSDC, 6)} USDC claimable
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total Plays</p>
                <p className="text-2xl font-bold mt-2">{totalPlays.toLocaleString()}</p>
                <p className="text-blue-400 text-sm mt-1">Your share: {artistPlays.toLocaleString()} plays</p>
              </div>
            </div>
          </div>

          {/* Top Tracks */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Top Performing Tracks</h2>
            <div className="space-y-3">
              {myTracks.slice(0, 5).map((track, index) => (
                <div key={track.id} className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400 font-bold">#{index + 1}</span>
                    <FaTrophy className={index === 0 ? 'text-yellow-400' : 'text-gray-600'} />
                    <div>
                      <p className="font-medium">{track.title}</p>
                      <p className="text-sm text-gray-400">
                        {(track.plays + track.pendingPlays).toLocaleString()} plays
                        {track.pendingPlays > 0 && (
                          <span className="ml-2 text-yellow-400" title="Pending blockchain confirmation">
                            (+{track.pendingPlays} <FaClock className="inline" size={10} />)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{track.revenue} ETH</p>
                    <p className="text-sm text-gray-400">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'music' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Music</h2>
              <button
                onClick={() => navigate('/upload')}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium"
              >
                <FaPlus /> Upload New
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-left text-gray-400 text-sm border-b border-gray-700">
                  <tr>
                    <th className="pb-3">Track</th>
                    <th className="pb-3">Duration</th>
                    <th className="pb-3">Plays</th>
                    <th className="pb-3">Revenue</th>
                    <th className="pb-3">Release Date</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myTracks.map((track) => (
                    <tr key={track.id} className="border-b border-gray-700">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-600 rounded flex items-center justify-center">
                            <FaMusic className="text-white" />
                          </div>
                          <span className="font-medium">{track.title}</span>
                        </div>
                      </td>
                      <td className="py-4 text-gray-400">{track.duration}</td>
                      <td className="py-4">
                        <div>
                          <div className="font-medium">{(track.plays + track.pendingPlays).toLocaleString()}</div>
                          {track.pendingPlays > 0 && (
                            <div className="text-xs text-yellow-400 flex items-center gap-1" title="Pending blockchain confirmation">
                              <FaClock size={10} /> +{track.pendingPlays} pending
                            </div>
                          )}
                          {track.plays > 0 && track.pendingPlays === 0 && (
                            <div className="text-xs text-green-400">✓ Confirmed</div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="flex items-center gap-1">
                          <FaEthereum className="text-blue-400" />
                          {track.revenue}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400">{new Date(track.releaseDate).toLocaleDateString()}</td>
                      <td className="py-4">
                        <button className="text-purple-400 hover:text-purple-300 text-sm">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {myTracks.length === 0 && (
              <div className="text-center py-12">
                <FaMusic className="text-4xl text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No tracks uploaded yet</p>
                <button
                  onClick={() => navigate('/upload')}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-medium"
                >
                  Upload Your First Track
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'merch' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Merchandise</h2>
              <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium">
                <FaPlus /> Add Merch Item
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {merchItems.map((item) => (
                <div key={item.id} className="bg-gray-750 rounded-lg p-4">
                  <div className="aspect-square bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                    <FaTshirt className="text-4xl text-gray-500" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.name}</h3>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-400">Price:</span>
                    <span className="font-medium">{item.price} ETH</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-400">Stock:</span>
                    <span>{item.stock} units</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-3">
                    <span className="text-gray-400">Sold:</span>
                    <span className="text-green-400">{item.sold} units</span>
                  </div>
                  <button className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm">
                    Manage
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Upcoming Events</h2>
              <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium">
                <FaPlus /> Add Event
              </button>
            </div>

            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="bg-gray-750 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{event.venue}</p>
                      <p className="text-gray-400 text-sm">{new Date(event.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">{event.revenue} ETH</p>
                      <p className="text-sm text-gray-400">Revenue</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Tickets Sold:</span>
                        <span className="font-semibold">{event.ticketsSold} / {event.totalTickets}</span>
                      </div>
                      <div className="w-64 bg-gray-700 rounded-full h-2 mt-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${(event.ticketsSold / event.totalTickets) * 100}%` }}
                        />
                      </div>
                    </div>
                    <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">
                      Manage Event
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
