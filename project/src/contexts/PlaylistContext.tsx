import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  createdAt: string;
  coverArt?: string;
}

interface PlaylistContextType {
  playlists: Playlist[];
  createPlaylist: (name: string, description: string) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: number) => void;
  updatePlaylist: (id: string, name: string, description: string) => void;
  getPlaylist: (id: string) => Playlist | undefined;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
};

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Load playlists from localStorage on mount
  useEffect(() => {
    const savedPlaylists = localStorage.getItem('blockmusic_playlists');
    if (savedPlaylists) {
      try {
        setPlaylists(JSON.parse(savedPlaylists));
      } catch (error) {
        console.error('Failed to load playlists:', error);
      }
    }
  }, []);

  // Save playlists to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('blockmusic_playlists', JSON.stringify(playlists));
  }, [playlists]);

  const createPlaylist = (name: string, description: string) => {
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}`,
      name,
      description,
      tracks: [],
      createdAt: new Date().toISOString(),
    };
    setPlaylists(prev => [...prev, newPlaylist]);
  };

  const deletePlaylist = (id: string) => {
    setPlaylists(prev => prev.filter(playlist => playlist.id !== id));
  };

  const addTrackToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists(prev =>
      prev.map(playlist => {
        if (playlist.id === playlistId) {
          // Check if track already exists
          const trackExists = playlist.tracks.some(t => t.id === track.id);
          if (trackExists) {
            return playlist;
          }
          return {
            ...playlist,
            tracks: [...playlist.tracks, track],
          };
        }
        return playlist;
      })
    );
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: number) => {
    setPlaylists(prev =>
      prev.map(playlist => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            tracks: playlist.tracks.filter(track => track.id !== trackId),
          };
        }
        return playlist;
      })
    );
  };

  const updatePlaylist = (id: string, name: string, description: string) => {
    setPlaylists(prev =>
      prev.map(playlist => {
        if (playlist.id === id) {
          return {
            ...playlist,
            name,
            description,
          };
        }
        return playlist;
      })
    );
  };

  const getPlaylist = (id: string) => {
    return playlists.find(playlist => playlist.id === id);
  };

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        updatePlaylist,
        getPlaylist,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
};
