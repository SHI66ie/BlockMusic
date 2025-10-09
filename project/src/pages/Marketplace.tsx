import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaPlay, FaPause, FaDownload, FaMusic, FaHeart, FaRegHeart, FaLock } from 'react-icons/fa';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { useAccount, useReadContract } from 'wagmi';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const MUSIC_NFT_CONTRACT = import.meta.env.VITE_MUSIC_NFT_CONTRACT || '0xbB509d5A144E3E3d240D7CFEdffC568BE35F1348';

interface Track {
  id: number;
  title: string;
  artist: string;
  artistAddress: string;
  duration: string;
  plays: number;
  coverArt?: string;
  audioUrl?: string;
  downloadable: boolean;
  genre: string;
}

export default function Marketplace() {
  const location = useLocation();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { isSubscribed, subscriptionData, isLoading: subscriptionLoading, checkSubscription } = useSubscription();
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();
  
  const [likedTracks, setLikedTracks] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [accessChecked, setAccessChecked] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);
  
  // Get total supply of NFTs
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

  // Fetch all NFTs with real metadata from IPFS
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!totalSupply) {
        setIsLoadingTracks(false);
        return;
      }

      try {
        setIsLoadingTracks(true);
        const supply = Number(totalSupply);
        const fetchedTracks: Track[] = [];

        // Fetch metadata for each NFT from backend API
        for (let i = 0; i < supply; i++) {
          try {
            const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${backendUrl}/nfts/${MUSIC_NFT_CONTRACT}/${i}`);
            
            if (response.ok) {
              const metadata = await response.json();
              fetchedTracks.push({
                id: i,
                title: metadata.name || `Track ${i + 1}`,
                artist: metadata.artist || 'Unknown Artist',
                artistAddress: metadata.artistAddress || '0x0000...0000',
                duration: metadata.duration || '0:00',
                plays: metadata.plays || 0,
                downloadable: metadata.downloadable !== false,
                genre: metadata.genre || 'Unknown',
                coverArt: metadata.image,
                audioUrl: metadata.animation_url || metadata.audio_url, // Real IPFS URL
              });
            } else {
              // Fallback for tracks without metadata
              fetchedTracks.push({
                id: i,
                title: `Track ${i + 1}`,
                artist: 'Unknown',
                artistAddress: '0x0000...0000',
                duration: '0:00',
                plays: 0,
                downloadable: false,
                genre: 'Unknown',
              });
            }
          } catch (err) {
            console.error(`Error fetching metadata for token ${i}:`, err);
            // Add track with minimal info on error
            fetchedTracks.push({
              id: i,
              title: `Track ${i + 1}`,
              artist: 'Unknown',
              artistAddress: '0x0000...0000',
              duration: '0:00',
              plays: 0,
              downloadable: false,
              genre: 'Unknown',
            });
          }
        }

        setTracks(fetchedTracks);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        toast.error('Failed to load tracks');
      } finally {
        setIsLoadingTracks(false);
      }
    };

    fetchNFTs();
  }, [totalSupply]);
  
  // Check subscription access on mount and when wallet connects
  useEffect(() => {
    const checkAccess = async () => {
      if (!isConnected) {
        // Not connected - redirect to home
        toast.error('Please connect your wallet to access the Music Explorer');
        navigate('/');
        return;
      }

      if (address) {
        // Check subscription status
        const status = await checkSubscription();
        setAccessChecked(true);
        
        if (!status.isActive) {
          // No active subscription - redirect to subscribe page
          toast.warning('You need an active subscription to access the Music Explorer');
          navigate('/subscribe');
        }
      }
    };

    checkAccess();
  }, [address, isConnected, navigate, checkSubscription]);
  
  // Show welcome message if redirected from subscription
  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      toast.success(state.message, {
        autoClose: 5000,
      });
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handlePlay = (track: Track) => {
    // Use global music player - no transactions, just play!
    playTrack(track);
    console.log(`Playing track: ${track.title} by ${track.artist}`);
  };

  const handleDownload = (track: Track) => {
    if (!track.downloadable) {
      toast.warning('This track is not available for download');
      return;
    }
    // TODO: Implement actual download functionality
    toast.success(`Downloading "${track.title}" by ${track.artist}`);
    console.log(`Download initiated for track: ${track.id}`);
  };

  const toggleLike = (trackId: number) => {
    const newLiked = new Set(likedTracks);
    if (newLiked.has(trackId)) {
      newLiked.delete(trackId);
      toast.info('Removed from favorites');
    } else {
      newLiked.add(trackId);
      toast.success('Added to favorites');
    }
    setLikedTracks(newLiked);
  };

  const genres = ['All', ...Array.from(new Set(tracks.map(t => t.genre)))];

  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         track.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || track.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  // Show loading while checking access
  if (subscriptionLoading || !accessChecked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-400">Verifying your subscription access...</p>
      </div>
    );
  }

  // If not subscribed (shouldn't reach here due to redirect, but just in case)
  if (!isSubscribed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <FaLock className="text-6xl text-gray-600" />
        <h2 className="text-2xl font-bold">Subscription Required</h2>
        <p className="text-gray-400 text-center max-w-md">
          You need an active subscription to access the Music Explorer and stream unlimited music.
        </p>
        <button
          onClick={() => navigate('/subscribe')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          View Subscription Plans
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Music Explorer</h1>
          <p className="text-gray-400 text-sm mt-1">Stream unlimited music • Artists earn per play</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 bg-purple-600/20 border border-purple-500/50 rounded-lg px-4 py-2">
            <span className="text-purple-400 text-sm font-semibold">🎯 Explorer Access Active</span>
          </div>
          {subscriptionData && (
            <div className="text-xs text-gray-400">
              {subscriptionData.formattedMonthlyPrice && `Subscription: Active`}
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tracks or artists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedGenre === genre
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-2">
        {isLoadingTracks ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <p className="text-gray-400 mt-4">Loading tracks from blockchain...</p>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FaMusic className="mx-auto text-4xl mb-4 opacity-50" />
            <p>No tracks found</p>
          </div>
        ) : (
          filteredTracks.map((track) => (
            <div
              key={track.id}
              className={`bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-all ${
                currentTrack?.id === track.id && isPlaying ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Play Button */}
                <button
                  onClick={() => handlePlay(track)}
                  className="flex-shrink-0 w-12 h-12 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors"
                >
                  {currentTrack?.id === track.id && isPlaying ? (
                    <FaPause className="text-white" />
                  ) : (
                    <FaPlay className="text-white ml-1" />
                  )}
                </button>

                {/* Cover Art Placeholder */}
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded flex items-center justify-center">
                  <FaMusic className="text-white text-xl" />
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{track.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="truncate">{track.artist}</span>
                    <span>•</span>
                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">{track.genre}</span>
                  </div>
                </div>

                {/* Stats and Actions */}
                <div className="flex items-center gap-4">
                  <div className="hidden md:block text-sm text-gray-400">
                    <div>{track.duration}</div>
                    <div className="text-xs">{track.plays.toLocaleString()} plays</div>
                  </div>

                  {/* Like Button */}
                  <button
                    onClick={() => toggleLike(track.id)}
                    className="text-gray-400 hover:text-pink-500 transition-colors"
                  >
                    {likedTracks.has(track.id) ? (
                      <FaHeart className="text-pink-500" />
                    ) : (
                      <FaRegHeart />
                    )}
                  </button>

                  {/* Download Button */}
                  {track.downloadable && (
                    <button
                      onClick={() => handleDownload(track)}
                      className="text-gray-400 hover:text-green-500 transition-colors"
                      title="Download track"
                    >
                      <FaDownload />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Footer */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-sm text-gray-400 mb-24">
        <div className="flex items-start gap-3">
          <FaMusic className="text-purple-500 mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold text-white mb-1">How it works:</p>
            <ul className="space-y-1">
              <li>• Stream unlimited music with your Explorer Access subscription</li>
              <li>• Artists receive payment automatically for every play</li>
              <li>• Download tracks when available (marked with download icon)</li>
              <li>• Support your favorite artists by playing their music</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
