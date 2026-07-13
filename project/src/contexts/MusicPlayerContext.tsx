import React, { createContext, useContext, useState, useRef, useEffect, useMemo } from 'react';
import { recordPlay } from '../services/playTracker';
import { useAccount } from 'wagmi';

interface Track {
  id: number;
  title: string;
  artist: string;
  artistAddress: string;
  coverArt?: string;
  audioUrl?: string;
  duration?: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  releaseDate?: string;
}

interface HistoryEntry {
  track: Track;
  playedAt: string;
}

interface ListeningStats {
  totalPlays: number;
  trackCounts: Record<number, number>;
}

interface MusicPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  playTrack: (track: Track) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  togglePlayPause: () => void;
  currentTime: number;
  duration: number;
  volume: number;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  playlist: Track[];
  setPlaylist: (tracks: Track[]) => void;
  queue: Track[];
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: number) => void;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  playNext: () => void;
  playPrevious: () => void;
  isShuffled: boolean;
  toggleShuffle: () => void;
  repeatMode: 'off' | 'all' | 'one';
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
  recentlyPlayed: HistoryEntry[];
  mostPlayed: Track[];
  totalListeningStats: number;
  isOffline: boolean;
  offlineCache: Track[];
}

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? (JSON.parse(storedValue) as T) : fallback;
  } catch (error) {
    console.error(`Failed to load ${key}:`, error);
    return fallback;
  }
};

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useAccount();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [queue, setQueue] = useState<Track[]>(() => loadFromStorage('blockmusic_queue', []));
  const [recentlyPlayed, setRecentlyPlayed] = useState<HistoryEntry[]>(() => loadFromStorage('blockmusic_recently_played', []));
  const [stats, setStats] = useState<ListeningStats>(() => loadFromStorage('blockmusic_listening_stats', { totalPlays: 0, trackCounts: {} }));
  const [offlineCache, setOfflineCache] = useState<Track[]>(() => loadFromStorage('blockmusic_offline_cache', []));
  const [isOffline, setIsOffline] = useState<boolean>(() => (typeof navigator === 'undefined' ? false : !navigator.onLine));
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playRecordedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnlineStatus = () => setIsOffline(!navigator.onLine);

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('blockmusic_queue', JSON.stringify(queue));
    }
  }, [queue]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('blockmusic_recently_played', JSON.stringify(recentlyPlayed));
    }
  }, [recentlyPlayed]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('blockmusic_listening_stats', JSON.stringify(stats));
    }
  }, [stats]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('blockmusic_offline_cache', JSON.stringify(offlineCache));
    }
  }, [offlineCache]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;

      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });

      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });

      audioRef.current.addEventListener('ended', () => {
        handleTrackEnd();
      });

      audioRef.current.addEventListener('error', (event) => {
        console.error('Audio playback error:', event);
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const updatePlayHistory = (track: Track) => {
    const playedAt = new Date().toISOString();
    setRecentlyPlayed((prev) => [{ track, playedAt }, ...prev.filter((entry) => entry.track.id !== track.id)].slice(0, 10));
    setStats((prev) => ({
      totalPlays: prev.totalPlays + 1,
      trackCounts: {
        ...prev.trackCounts,
        [track.id]: (prev.trackCounts[track.id] ?? 0) + 1,
      },
    }));
    setOfflineCache((prev) => [track, ...prev.filter((cachedTrack) => cachedTrack.id !== track.id)].slice(0, 12));
  };

  const addToQueue = (track: Track) => {
    setQueue((prev) => (prev.some((item) => item.id === track.id) ? prev : [...prev, track]));
  };

  const removeFromQueue = (trackId: number) => {
    setQueue((prev) => prev.filter((track) => track.id !== trackId));
  };

  const moveQueueItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= queue.length || toIndex >= queue.length) {
      return;
    }

    const reorderedQueue = [...queue];
    const [movedItem] = reorderedQueue.splice(fromIndex, 1);
    reorderedQueue.splice(toIndex, 0, movedItem);
    setQueue(reorderedQueue);
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const playTrack = (track: Track) => {
    if (!audioRef.current || !track.audioUrl) return;

    if (currentTrack?.id === track.id && audioRef.current.src) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
      return;
    }

    setCurrentTrack(track);
    audioRef.current.src = track.audioUrl;
    audioRef.current.play().catch(console.error);
    setIsPlaying(true);

    updatePlayHistory(track);

    if (track.id !== undefined && track.id !== null && address && !playRecordedRef.current.has(track.id)) {
      playRecordedRef.current.add(track.id);
      recordPlay({
        tokenId: track.id,
        userAddress: address,
      })
        .then((response) => {
          console.log(`✅ Play recorded: ${track.title} (Total: ${response.totalPlays})`);
        })
        .catch((error) => {
          console.error('❌ Failed to record play:', error);
          playRecordedRef.current.delete(track.id);
        });
    }
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeTrack = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
  };

  const handleSetVolume = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTrackEnd = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    } else if (repeatMode === 'all' || playlist.length > 0) {
      playNext();
    } else {
      setIsPlaying(false);
    }
  };

  const getCurrentTrackIndex = () => {
    if (!currentTrack || playlist.length === 0) return -1;
    return playlist.findIndex((track) => track.id === currentTrack.id);
  };

  const playNext = () => {
    const currentIndex = getCurrentTrackIndex();
    if (currentIndex === -1 || playlist.length === 0) return;

    let nextIndex = currentIndex + 1;

    if (isShuffled) {
      const availableIndices = playlist.map((_, index) => index).filter((index) => index !== currentIndex);
      nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)] ?? 0;
    }

    if (nextIndex >= playlist.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    playTrack(playlist[nextIndex]);
  };

  const playPrevious = () => {
    const currentIndex = getCurrentTrackIndex();
    if (currentIndex === -1 || playlist.length === 0) return;

    if (currentTime > 3) {
      seek(0);
      return;
    }

    let prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        prevIndex = playlist.length - 1;
      } else {
        seek(0);
        return;
      }
    }

    playTrack(playlist[prevIndex]);
  };

  const toggleShuffle = () => {
    setIsShuffled((prev) => !prev);
  };

  const mostPlayed = useMemo(() => {
    const topTrackIds = Object.entries(stats.trackCounts)
      .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
      .slice(0, 5)
      .map(([trackId]) => Number(trackId));

    return topTrackIds
      .map((trackId) => playlist.find((track) => track.id === trackId) ?? recentlyPlayed.find((entry) => entry.track.id === trackId)?.track)
      .filter((track): track is Track => Boolean(track));
  }, [playlist, recentlyPlayed, stats.trackCounts]);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        playTrack,
        pauseTrack,
        resumeTrack,
        togglePlayPause,
        currentTime,
        duration,
        volume,
        setVolume: handleSetVolume,
        seek,
        playlist,
        setPlaylist,
        queue,
        addToQueue,
        removeFromQueue,
        moveQueueItem,
        clearQueue,
        playNext,
        playPrevious,
        isShuffled,
        toggleShuffle,
        repeatMode,
        setRepeatMode,
        recentlyPlayed,
        mostPlayed,
        totalListeningStats: stats.totalPlays,
        isOffline,
        offlineCache,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }
  return context;
};
