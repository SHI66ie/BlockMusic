import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFire, FaClock, FaStar, FaPlay, FaHeart, FaMusic, FaTrophy, FaSparkles } from 'react-icons/fa';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { useAccount, useReadContract } from 'wagmi';
import { readContract } from '@wagmi/core';
import { config } from '../config/web3';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const MUSIC_NFT_CONTRACT = import.meta.env.VITE_MUSIC_NFT_CONTRACT || '0xF29A2DCC8877fac176C36F30d6245C4320e90841';

interface Track {
  id: number;
  title: string;
  artist: string;
  artistAddress: string;
  duration: string;
  plays: number;
  coverArt?: string;
  audioUrl?: string;
  genre: string;
  releaseDate?: string;
}

export default function Discover() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedTracks, setLikedTracks] = useState<Set<number>>(new Set());

  // Get total supply
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

  // Fetch tracks
  useEffect(() => {
    const loadTracks = async () => {
      if (!totalSupply) {
        setIsLoading(false);
        return;
      }

      try {
        const supply = Number(totalSupply);
        const allTracks: Track[] = [];

        for (let i = 0; i < supply; i++) {
          try {
            const metadata = await readContract(config, {
              address: MUSIC_NFT_CONTRACT as `0x${string}`,
              abi: [
                {
                  name: 'getTrackMetadata',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [{ name: 'tokenId', type: 'uint256' }],
                  outputs: [
                    { name: 'trackTitle', type: 'string' },
                    { name: 'artist', type: 'string' },
                    { name: 'artistAddress', type: 'address' },
                    { name: 'duration', type: 'uint256' },
                    { name: 'genre', type: 'string' },
                    { name: 'coverArt', type: 'string' },
                    { name: 'audioUrl', type: 'string' },
                    { name: 'releaseDate', type: 'uint256' }
                  ]
                }
              ],
              functionName: 'getTrackMetadata',
              args: [BigInt(i)]
            });

            const playData = await readContract(config, {
              address: MUSIC_NFT_CONTRACT as `0x${string}`,
              abi: [
                {
                  name: 'getTrackPlays',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [{ name: 'tokenId', type: 'uint256' }],
                  outputs: [{ name: '', type: 'uint256' }]
                }
              ],
              functionName: 'getTrackPlays',
              args: [BigInt(i)]
            });

            const formatDuration = (seconds: number | bigint): string => {
              const totalSeconds = Number(seconds);
              if (!totalSeconds || totalSeconds <= 0) return '0:00';
              const mins = Math.floor(totalSeconds / 60);
              const secs = totalSeconds % 60;
              return `${mins}:${secs.toString().padStart(2, '0')}`;
            };

            allTracks.push({
              id: i,
              title: metadata.trackTitle || `Track ${i + 1}`,
              artist: metadata.artist || 'Unknown Artist',
              artistAddress: metadata.artistAddress,
              duration: formatDuration(metadata.duration),
              plays: Number(playData),
              coverArt: metadata.coverArt,
              audioUrl: metadata.audioUrl,
              genre: metadata.genre || 'Unknown',
              releaseDate: new Date(Number(metadata.releaseDate) * 1000).toISOString()
            });
          } catch (err) {
            console.error(`Error fetching track ${i}:`, err);
          }
        }

        setTracks(allTracks);
      } catch (error) {
        console.error('Error loading tracks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTracks();
  }, [totalSupply]);

  // Curated playlists (static for demo)
  const curatedPlaylists = useMemo(() => [
    {
      id: 'curated-1',
      name: 'Trending Now',
      description: 'The hottest tracks everyone is listening to',
      icon: <FaFire className="text-orange-500" />,
      tracks: tracks.sort((a, b) => b.plays - a.plays).slice(0, 10)
    },
    {
      id: 'curated-2',
      name: 'New Releases',
      description: 'Fresh tracks just dropped',
      icon: <FaSparkles className="text-purple-500" />,
      tracks: tracks.sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        return dateB - dateA;
      }).slice(0, 10)
    },
    {
      id: 'curated-3',
      name: 'Top Hip Hop',
      description: 'Best hip hop tracks on the platform',
      icon: <FaTrophy className="text-yellow-500" />,
      tracks: tracks.filter(t => t.genre === 'Hip Hop').sort((a, b) => b.plays - a.plays).slice(0, 10)
    },
    {
      id: 'curated-4',
      name: 'Chill Vibes',
      description: 'Relax and unwind with these tracks',
      icon: <FaMusic className="text-blue-500" />,
      tracks: tracks.slice(0, 10)
    }
  ], [tracks]);

  const trendingTracks = useMemo(() => 
    tracks.sort((a, b) => b.plays - a.plays).slice(0, 10),
    [tracks]
  );

  const newReleases = useMemo(() =>
    tracks.sort((a, b) => {
      const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
      const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
      return dateB - dateA;
    }).slice(0, 10),
    [tracks]
  );

  const handlePlay = (track: Track) => {
    playTrack(track);
  };

  const toggleLike = (trackId: number) => {
    const newLiked = new Set(likedTracks);
    if (newLiked.has(trackId)) {
      newLiked.delete(trackId);
    } else {
      newLiked.add(trackId);
    }
    setLikedTracks(newLiked);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Discover
        </h1>
        <p className="text-gray-400 mt-2">Find your next favorite track</p>
      </div>

      {/* Curated Playlists */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FaStar className="text-yellow-500" />
          Curated Playlists
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {curatedPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer group"
              onClick={() => {
                if (playlist.tracks.length > 0) {
                  handlePlay(playlist.tracks[0]);
                }
              }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                {playlist.icon}
              </div>
              <h3 className="font-bold text-lg text-white">{playlist.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{playlist.description}</p>
              <p className="text-gray-500 text-xs mt-2">{playlist.tracks.length} tracks</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Tracks */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FaFire className="text-orange-500" />
          Trending Now
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingTracks.map((track, index) => (
            <div
              key={track.id}
              className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-purple-500 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold ${
                    index < 3 ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{track.title}</h3>
                  <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>{track.genre}</span>
                    <span>•</span>
                    <span>{track.plays.toLocaleString()} plays</span>
                  </div>
                </div>
                <button
                  onClick={() => handlePlay(track)}
                  className="w-10 h-10 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <FaPlay className="text-white text-sm ml-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* New Releases */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FaClock className="text-blue-500" />
          New Releases
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {newReleases.map((track) => (
            <div
              key={track.id}
              className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-purple-500 transition-all group"
            >
              <div className="flex items-start gap-4">
                {track.coverArt ? (
                  <img src={track.coverArt} alt={track.title} className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <FaMusic className="text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{track.title}</h3>
                  <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>{track.genre}</span>
                    <span>•</span>
                    <span>{track.releaseDate ? new Date(track.releaseDate).toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>
                <button
                  onClick={() => handlePlay(track)}
                  className="w-10 h-10 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <FaPlay className="text-white text-sm ml-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Artists */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FaTrophy className="text-yellow-500" />
          Top Artists
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from(new Map(tracks.map(t => [t.artist, t])).values())
            .slice(0, 6)
            .map((track) => (
              <div
                key={track.artist}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-purple-500 transition-all text-center cursor-pointer"
                onClick={() => navigate(`/artist/${track.artistAddress}`)}
              >
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-3">
                  <FaMusic className="text-white text-2xl" />
                </div>
                <h3 className="font-semibold text-white truncate">{track.artist}</h3>
                <p className="text-gray-400 text-xs mt-1">
                  {tracks.filter(t => t.artist === track.artist).length} tracks
                </p>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
