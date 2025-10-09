import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface Track {
  id: number;
  title: string;
  artist: string;
  artistAddress: string;
  coverArt?: string;
  audioUrl?: string;
  duration?: string;
  genre?: string;
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
  playNext: () => void;
  playPrevious: () => void;
  isShuffled: boolean;
  toggleShuffle: () => void;
  repeatMode: 'off' | 'all' | 'one';
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;

      // Event listeners
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });

      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });

      audioRef.current.addEventListener('ended', () => {
        handleTrackEnd();
      });

      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
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

  const playTrack = (track: Track) => {
    if (!audioRef.current || !track.audioUrl) return;

    // If same track, just toggle play/pause
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

    // New track
    setCurrentTrack(track);
    audioRef.current.src = track.audioUrl;
    audioRef.current.play().catch(console.error);
    setIsPlaying(true);
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
      // Repeat current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    } else if (repeatMode === 'all' || playlist.length > 0) {
      // Play next track
      playNext();
    } else {
      setIsPlaying(false);
    }
  };

  const getCurrentTrackIndex = () => {
    if (!currentTrack || playlist.length === 0) return -1;
    return playlist.findIndex(track => track.id === currentTrack.id);
  };

  const playNext = () => {
    const currentIndex = getCurrentTrackIndex();
    if (currentIndex === -1 || playlist.length === 0) return;

    let nextIndex = currentIndex + 1;
    
    if (nextIndex >= playlist.length) {
      if (repeatMode === 'all') {
        nextIndex = 0; // Loop back to start
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

    // If more than 3 seconds played, restart current track
    if (currentTime > 3) {
      seek(0);
      return;
    }

    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        prevIndex = playlist.length - 1; // Loop to end
      } else {
        seek(0); // Just restart current track
        return;
      }
    }

    playTrack(playlist[prevIndex]);
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
    // TODO: Implement shuffle logic - reorder playlist
  };

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
        setVolume,
        seek,
        playlist,
        setPlaylist,
        playNext,
        playPrevious,
        isShuffled,
        toggleShuffle,
        repeatMode,
        setRepeatMode,
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
