import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaPlay, FaPause, FaDownload, FaMusic, FaHeart, FaRegHeart, FaLock, FaPlus, FaListUl } from 'react-icons/fa';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useAccount, useReadContract } from 'wagmi';
import { readContract } from '@wagmi/core';
import { config } from '../config/web3';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { convertIPFSUrl } from '../utils/ipfs';
import { getPlayCount } from '../services/playTracker';
import { AIRecommendations } from '../components/genlayer/AIRecommendations';

const MUSIC_NFT_CONTRACT = import.meta.env.VITE_MUSIC_NFT_CONTRACT || '0xF29A2DCC8877fac176C36F30d6245C4320e90841';

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
  artist: string;
  artistAddress: string;
  duration: string;
  plays: number;
  livePlayCount?: number;
  coverArt?: string;
  audioUrl?: string;
  downloadable: boolean;
  genre: string;
  mood?: string;
  bpm?: number;
  releaseDate?: string;
  albumName?: string;
}

interface Album {
  name: string;
  artist: string;
  tracks: Track[];
  coverArt?: string;
  totalPlays: number;
}

export default function Marketplace() {
  const location = useLocation();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { isSubscribed, subscriptionData, isLoading: subscriptionLoading, checkSubscription } = useSubscription();
  const { playTrack, currentTrack, isPlaying, setPlaylist, addToQueue, queue, removeFromQueue, clearQueue, mostPlayed, totalListeningStats, isOffline, offlineCache } = useMusicPlayer();
  const { playlists, addTrackToPlaylist } = usePlaylist();
  
  const [selectedPlaylistForAdd, setSelectedPlaylistForAdd] = useState<string>('');
  
  const [likedTracks, setLikedTracks] = useState<Set<number>>(new Set());
  const [followedArtists, setFollowedArtists] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') {
      return new Set();
    }

    const savedArtists = window.localStorage.getItem('blockmusic_followed_artists');
    return new Set(savedArtists ? JSON.parse(savedArtists) as string[] : []);
  });
  const [commentsByTrack, setCommentsByTrack] = useState<Record<number, string[]>>(() => {
    if (typeof window === 'undefined') {
      return {};
    }

    const savedComments = window.localStorage.getItem('blockmusic_track_comments');
    return savedComments ? JSON.parse(savedComments) as Record<number, string[]> : {};
  });
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedMood, setSelectedMood] = useState<string>('All');
  const [selectedBpm, setSelectedBpm] = useState<string>('All');
  const [releaseFilter, setReleaseFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'tracks' | 'albums'>('tracks');
  const [accessChecked, setAccessChecked] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('blockmusic_followed_artists', JSON.stringify(Array.from(followedArtists)));
      window.localStorage.setItem('blockmusic_track_comments', JSON.stringify(commentsByTrack));
    }
  }, [followedArtists, commentsByTrack]);

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
            // Try backend first (with short timeout)
            const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
            
            try {
              const response = await fetch(`${backendUrl}/nfts/${MUSIC_NFT_CONTRACT}/${i}`, {
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              
              if (response.ok) {
                const metadata = await response.json();
                if (metadata.animation_url || metadata.audio_url) {
                  // Backend returned real data
                  fetchedTracks.push({
                    id: i,
                    title: metadata.name || `Track ${i + 1}`,
                    artist: metadata.artist || 'Unknown Artist',
                    artistAddress: metadata.artistAddress || '0x0000...0000',
                    duration: metadata.duration || '0:00',
                    plays: metadata.plays || 0,
                    downloadable: metadata.downloadable !== false,
                    genre: metadata.genre || 'Unknown',
                    mood: metadata.mood || (i % 3 === 0 ? 'Chill' : i % 2 === 0 ? 'Energetic' : 'Midnight'),
                    bpm: metadata.bpm || (120 + (i % 30)),
                    releaseDate: metadata.releaseDate || `${2023 + (i % 3)}-0${(i % 9) + 1}-15`,
                    coverArt: metadata.image,
                    audioUrl: metadata.animation_url || metadata.audio_url,
                  });
                  continue;
                }
              }
            } catch {
              console.log(`Backend timeout for token ${i}, fetching from contract...`);
            }
            
            // Fallback: Fetch directly from contract
            const contractMetadata = await readContract(config, {
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
            
            if (contractMetadata) {
              fetchedTracks.push({
                id: i,
                title: contractMetadata.trackTitle || `Track ${i + 1}`,
                artist: contractMetadata.artistName || 'Unknown Artist',
                artistAddress: contractMetadata.artist || '0x0000...0000',
                duration: formatDuration(contractMetadata.duration),
                plays: Number(contractMetadata.playCount) || 0,
                downloadable: true,
                genre: contractMetadata.genre || 'Unknown',
                mood: i % 3 === 0 ? 'Chill' : i % 2 === 0 ? 'Energetic' : 'Midnight',
                bpm: 110 + (i % 35),
                releaseDate: `${2024 + (i % 2)}-0${(i % 8) + 1}-10`,
                coverArt: convertIPFSUrl(contractMetadata.coverArtURI),
                audioUrl: convertIPFSUrl(contractMetadata.audioURI),
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
              mood: 'Chill',
              bpm: 120,
              releaseDate: '2024-01-10',
            });
          }
        }

        setTracks(fetchedTracks);
        setPlaylist(fetchedTracks); // Set playlist for next/previous functionality
        
        // Fetch live play counts from Cloudflare
        fetchLivePlayCounts(fetchedTracks);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        toast.error('Failed to load tracks');
      } finally {
        setIsLoadingTracks(false);
      }
    };

    fetchNFTs();
  }, [totalSupply]);
  
  // Fetch live play counts from Cloudflare
  const fetchLivePlayCounts = async (trackList: Track[]) => {
    const updatedTracks = await Promise.all(
      trackList.map(async (track) => {
        try {
          const cloudflareData = await getPlayCount(track.id);
          return {
            ...track,
            livePlayCount: cloudflareData.totalPlays,
          };
        } catch {
          return track; // Keep original if fetch fails
        }
      })
    );
    setTracks(updatedTracks);
  };
  
  // Refresh live play counts every 10 seconds
  useEffect(() => {
    if (tracks.length === 0) return;
    
    const interval = setInterval(() => {
      fetchLivePlayCounts(tracks);
    }, 10000); // 10 seconds
    
    return () => clearInterval(interval);
  }, [tracks.length]);
  
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

  const handleAddToPlaylist = (track: Track) => {
    if (!selectedPlaylistForAdd) {
      toast.error('Please select a playlist first');
      return;
    }
    addTrackToPlaylist(selectedPlaylistForAdd, track);
    toast.success(`Added "${track.title}" to playlist`);
  };

  const toggleFollowArtist = (artist: string) => {
    const nextFollowed = new Set(followedArtists);
    if (nextFollowed.has(artist)) {
      nextFollowed.delete(artist);
      toast.info(`Stopped following ${artist}`);
    } else {
      nextFollowed.add(artist);
      toast.success(`Following ${artist}`);
    }
    setFollowedArtists(nextFollowed);
  };

  const submitComment = (trackId: number) => {
    const comment = commentDrafts[trackId]?.trim();
    if (!comment) {
      return;
    }

    setCommentsByTrack((prev) => ({
      ...prev,
      [trackId]: [...(prev[trackId] ?? []), comment],
    }));
    setCommentDrafts((prev) => ({ ...prev, [trackId]: '' }));
  };

  const genres = ['All', ...Array.from(new Set(tracks.map(t => t.genre).filter(Boolean)))];
  const moods = ['All', ...Array.from(new Set(tracks.map(t => t.mood).filter(Boolean)))];
  const bpmOptions = ['All', 'Slow', 'Mid', 'Fast'];
  const releaseOptions = ['All', 'Newest', 'Oldest'];

  const querySummary = useMemo(() => {
    const totalTracks = tracks.length;
    const clearableQueue = queue.length > 0;
    return {
      totalTracks,
      totalQueue: queue.length,
      clearableQueue,
    };
  }, [queue.length, tracks.length]);

  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         track.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (track.genre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (track.mood || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || track.genre === selectedGenre;
    const matchesMood = selectedMood === 'All' || track.mood === selectedMood;
    const matchesBpm = selectedBpm === 'All' || (
      selectedBpm === 'Slow' ? (track.bpm ?? 0) < 110 :
      selectedBpm === 'Mid' ? (track.bpm ?? 0) >= 110 && (track.bpm ?? 0) <= 140 :
      (track.bpm ?? 0) > 140
    );
    const matchesRelease = releaseFilter === 'All' || (
      releaseFilter === 'Newest' ? Number(track.releaseDate || 0) >= new Date('2024-01-01').getTime() : Number(track.releaseDate || 0) < new Date('2024-01-01').getTime()
    );
    return matchesSearch && matchesGenre && matchesMood && matchesBpm && matchesRelease;
  });

  // Group tracks by albums
  const albums = useMemo(() => {
    const albumMap = new Map<string, Album>();
    
    filteredTracks.forEach(track => {
      const albumName = track.albumName || 'Singles';
      if (!albumMap.has(albumName)) {
        albumMap.set(albumName, {
          name: albumName,
          artist: track.artist,
          tracks: [],
          coverArt: track.coverArt,
          totalPlays: 0
        });
      }
      const album = albumMap.get(albumName)!;
      album.tracks.push(track);
      album.totalPlays += track.plays;
    });

    return Array.from(albumMap.values()).sort((a, b) => b.totalPlays - a.totalPlays);
  }, [filteredTracks]);

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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search tracks, artists, genre, mood..."
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
          {playlists.length > 0 && (
            <select
              value={selectedPlaylistForAdd}
              onChange={(e) => setSelectedPlaylistForAdd(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-purple-500 min-w-[200px]"
            >
              <option value="">Select playlist to add...</option>
              {playlists.map(playlist => (
                <option key={playlist.id} value={playlist.id}>{playlist.name}</option>
              ))}
            </select>
          )}
          <div className="flex gap-2 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('tracks')}
              className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'tracks' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Tracks
            </button>
            <button
              onClick={() => setViewMode('albums')}
              className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'albums' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Albums
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={selectedMood} onChange={(e) => setSelectedMood(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-purple-500">
            {moods.map((mood) => (
              <option key={mood} value={mood}>{mood === 'All' ? 'Mood: All' : `Mood: ${mood}`}</option>
            ))}
          </select>
          <select value={selectedBpm} onChange={(e) => setSelectedBpm(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-purple-500">
            {bpmOptions.map((option) => (
              <option key={option} value={option}>{option === 'All' ? 'BPM: All' : `BPM: ${option}`}</option>
            ))}
          </select>
          <select value={releaseFilter} onChange={(e) => setReleaseFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-purple-500">
            {releaseOptions.map((option) => (
              <option key={option} value={option}>{option === 'All' ? 'Release date: All' : `Release date: ${option}`}</option>
            ))}
          </select>
          <div className="rounded-lg border border-purple-700/60 bg-purple-900/20 px-4 py-2 text-sm text-purple-200">
            {querySummary.totalTracks} tracks • {querySummary.totalQueue} in queue
          </div>
        </div>
      </div>

      {/* GenLayer AI Recommendations */}
      {isConnected && tracks.length > 0 && (
        <AIRecommendations
          genresListened={Array.from(new Set(tracks.filter(t => likedTracks.has(t.id)).map(t => t.genre))).join(', ')}
          favoriteArtists={Array.from(new Set(tracks.filter(t => likedTracks.has(t.id)).map(t => t.artist))).join(', ')}
          recentTracks={tracks.slice(0, 5).map(t => t.id).join(', ')}
          availableTrackIds={tracks.map(t => t.id).slice(0, 20).join(', ')}
          onTrackSelect={(trackId) => {
            const track = tracks.find(t => t.id === Number(trackId));
            if (track) handlePlay(track);
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-sm text-gray-400">Offline listening</div>
          <div className="mt-2 text-lg font-semibold text-white">{isOffline ? 'Offline mode active' : 'Online session'}</div>
          <div className="text-sm text-gray-400 mt-1">Cached {offlineCache.length} recent tracks</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-sm text-gray-400">Recent listening stats</div>
          <div className="mt-2 text-lg font-semibold text-white">{totalListeningStats} plays tracked</div>
          <div className="text-sm text-gray-400 mt-1">Most played: {mostPlayed[0]?.title ?? 'No plays yet'}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-sm text-gray-400">Queue</div>
          <div className="mt-2 text-lg font-semibold text-white">{queue.length} tracks queued</div>
          <button onClick={clearQueue} className="mt-3 rounded-lg bg-gray-700 hover:bg-gray-600 px-3 py-2 text-sm text-white transition-colors">
            Clear queue
          </button>
        </div>
      </div>

      {/* Track List / Album View */}
      <div className="space-y-4">
        {isLoadingTracks ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <p className="text-gray-400 mt-4">Loading tracks from blockchain...</p>
          </div>
        ) : viewMode === 'albums' ? (
          // Album View
          albums.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FaMusic className="mx-auto text-4xl mb-4 opacity-50" />
              <p>No albums found</p>
            </div>
          ) : (
            albums.map((album) => (
              <div key={album.name} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex items-start gap-4">
                  {album.coverArt ? (
                    <img
                      src={album.coverArt}
                      alt={album.name}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                      <FaMusic className="text-white text-2xl" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{album.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{album.artist}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{album.tracks.length} tracks</span>
                      <span>{album.totalPlays.toLocaleString()} plays</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPlaylist(album.tracks);
                      if (album.tracks.length > 0) {
                        playTrack(album.tracks[0]);
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Play Album
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  {album.tracks.map((track) => (
                    <div key={track.id} className="flex items-center justify-between rounded-lg bg-gray-900/70 p-3 hover:bg-gray-900 transition-colors">
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{track.title}</p>
                        <p className="text-gray-400 text-sm">{track.duration}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => playTrack(track)}
                          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-2"
                          title={`Play ${track.title}`}
                        >
                          <FaPlay />
                        </button>
                        {playlists.length > 0 && (
                          <button
                            onClick={() => handleAddToPlaylist(track)}
                            className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-2"
                            title="Add to playlist"
                          >
                            <FaListUl />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )
        ) : (
          // Track View
          filteredTracks.length === 0 ? (
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

                {/* Cover Art */}
                {track.coverArt ? (
                  <img 
                    src={track.coverArt} 
                    alt={track.title}
                    className="flex-shrink-0 w-12 h-12 rounded object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded flex items-center justify-center ${track.coverArt ? 'hidden' : ''}`}>
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
                    <div className="text-xs">
                      {(track.livePlayCount !== undefined ? track.livePlayCount : track.plays).toLocaleString()} plays
                      {track.livePlayCount !== undefined && track.livePlayCount > track.plays && (
                        <span className="ml-1 text-green-400">●</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFollowArtist(track.artist)}
                    className="text-gray-400 hover:text-yellow-400 transition-colors"
                    title={followedArtists.has(track.artist) ? 'Unfollow artist' : 'Follow artist'}
                  >
                    {followedArtists.has(track.artist) ? '★' : '☆'}
                  </button>

                  <button
                    onClick={() => addToQueue(track)}
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                    title="Add to queue"
                  >
                    <FaPlus />
                  </button>

                  <button
                    onClick={() => removeFromQueue(track.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    title="Remove from queue"
                  >
                    <FaListUl />
                  </button>

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

                  {/* Add to Playlist Button */}
                  {playlists.length > 0 && (
                    <button
                      onClick={() => handleAddToPlaylist(track)}
                      className="text-gray-400 hover:text-purple-500 transition-colors"
                      title="Add to playlist"
                    >
                      <FaListUl />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-gray-900/75 p-3 border border-gray-700">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm text-gray-300">
                    <span className="font-semibold text-white">Mood:</span> {track.mood ?? 'Chill'} • <span className="font-semibold text-white">BPM:</span> {track.bpm ?? 120} • <span className="font-semibold text-white">Released:</span> {track.releaseDate ?? '2024-01-10'}
                  </div>
                  <div className="text-xs text-gray-400">{(commentsByTrack[track.id] ?? []).length} comments</div>
                </div>
                <div className="mt-3 space-y-2">
                  {(commentsByTrack[track.id] ?? []).map((comment, commentIndex) => (
                    <div key={`${track.id}-${commentIndex}`} className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-300">
                      {comment}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      value={commentDrafts[track.id] ?? ''}
                      onChange={(event) => setCommentDrafts((prev) => ({ ...prev, [track.id]: event.target.value }))}
                      placeholder="Share a comment on this track"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button onClick={() => submitComment(track.id)} className="rounded-lg bg-purple-600 hover:bg-purple-700 px-3 py-2 text-sm text-white transition-colors">
                      Post
                    </button>
                  </div>
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
              <li>• Subscribe for $2.50/month to unlock unlimited streaming - no transaction per play!</li>
              <li>• Stream as much as you want without wallet popups or gas fees</li>
              <li>• Artists earn based on their share of total platform plays</li>
              <li>• Revenue is distributed fairly: 85% to artists, 15% to platform</li>
              <li>• All play counts are tracked on-chain for transparency</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
