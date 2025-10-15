import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { readContract } from '@wagmi/core';
import { config } from '../config/web3';
import { FaMusic, FaEthereum, FaChartLine, FaTshirt, FaCalendar, FaPlay, FaDollarSign, FaTrophy, FaUsers, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import RevenueClaimCard from '../components/artist/RevenueClaimCard';

const MUSIC_NFT_CONTRACT = import.meta.env.VITE_MUSIC_NFT_CONTRACT || '0xbB509d5A144E3E3d240D7CFEdffC568BE35F1348';

interface Track {
  id: number;
  title: string;
  plays: number;
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
              const plays = Number(metadata.playCount) || 0;
              // Calculate revenue: 0.0001 ETH per play * 85% artist share
              const revenue = (plays * 0.000085).toFixed(6);
              
              artistTracks.push({
                id: i,
                title: metadata.trackTitle || `Track ${i + 1}`,
                plays: plays,
                revenue: revenue,
                releaseDate: releaseDate.toISOString().split('T')[0]
              });
            }
          } catch (err) {
            console.error(`Error fetching track ${i}:`, err);
          }
        }

        setMyTracks(artistTracks);
      } catch (error) {
        console.error('Error loading tracks:', error);
        toast.error('Failed to load your tracks');
      } finally {
        setIsLoading(false);
      }
    };

    loadTracks();
  }, [address, totalSupply]);

  // Load merch items (mock data for now)
  useEffect(() => {
    setMerchItems([
      { id: 1, name: 'Limited Edition T-Shirt', price: '0.05', stock: 50, sold: 23 },
      { id: 2, name: 'Signed Poster', price: '0.03', stock: 100, sold: 67 },
      { id: 3, name: 'Hoodie', price: '0.08', stock: 30, sold: 12 },
    ]);
  }, []);

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

  // Calculate total earnings
  const totalEarnings = myTracks.reduce((sum, track) => sum + parseFloat(track.revenue), 0);
  const totalPlays = myTracks.reduce((sum, track) => sum + track.plays, 0);
  const merchRevenue = merchItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.sold), 0);
  const eventRevenue = events.reduce((sum, event) => sum + parseFloat(event.revenue), 0);
  const grandTotalEarnings = totalEarnings + merchRevenue + eventRevenue;

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
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <FaPlus /> Upload New Track
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Earnings</p>
              <p className="text-2xl font-bold mt-1">{grandTotalEarnings.toFixed(4)} ETH</p>
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
              <div className="bg-gray-750 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Streaming Revenue</p>
                <p className="text-2xl font-bold mt-2">{totalEarnings.toFixed(4)} ETH</p>
                <p className="text-green-400 text-sm mt-1">+12% from last month</p>
              </div>
              <div className="bg-gray-750 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Merch Sales</p>
                <p className="text-2xl font-bold mt-2">{merchRevenue.toFixed(2)} ETH</p>
                <p className="text-green-400 text-sm mt-1">+8% from last month</p>
              </div>
              <div className="bg-gray-750 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Event Revenue</p>
                <p className="text-2xl font-bold mt-2">{eventRevenue.toFixed(2)} ETH</p>
                <p className="text-blue-400 text-sm mt-1">2 upcoming events</p>
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
                      <p className="text-sm text-gray-400">{track.plays} plays</p>
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
                      <td className="py-4">{track.plays.toLocaleString()}</td>
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
