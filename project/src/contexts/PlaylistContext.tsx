import React, { createContext, useContext, useState, useEffect } from 'react';
import { emailAuth } from '../services/emailAuth';

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
  createPlaylist: (name: string, description: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: number) => Promise<void>;
  updatePlaylist: (id: string, name: string, description: string) => Promise<void>;
  getPlaylist: (id: string) => Playlist | undefined;
}

const LOCAL_STORAGE_KEY = 'blockmusic_playlists';
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

const normalizePlaylist = (playlist: Record<string, unknown>): Playlist => ({
  id: String((playlist.id ?? playlist._id) ?? `playlist_${Date.now()}`),
  name: String(playlist.name ?? ''),
  description: String(playlist.description ?? ''),
  tracks: Array.isArray(playlist.tracks) ? (playlist.tracks as Track[]) : [],
  createdAt: String(playlist.createdAt ?? new Date().toISOString()),
  coverArt: typeof playlist.coverArt === 'string' ? playlist.coverArt : undefined,
});

const loadLocalPlaylists = (): Playlist[] => {
  try {
    const savedPlaylists = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!savedPlaylists) {
      return [];
    }

    const parsed = JSON.parse(savedPlaylists) as unknown[];
    return parsed.map(playlist => normalizePlaylist(playlist as Record<string, unknown>));
  } catch (error) {
    console.error('Failed to load playlists:', error);
    return [];
  }
};

const requestPlaylistApi = async (path: string, options: RequestInit = {}) => {
  const token = emailAuth.getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || 'Playlist request failed');
  }

  return payload?.data ?? null;
};

export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
};

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const hydratePlaylists = async () => {
    if (emailAuth.isAuthenticated()) {
      try {
        const remotePlaylists = await requestPlaylistApi('/playlists');
        const normalized = Array.isArray(remotePlaylists)
          ? remotePlaylists.map(playlist => normalizePlaylist(playlist as Record<string, unknown>))
          : [];

        setPlaylists(normalized);
        return;
      } catch (error) {
        console.error('Failed to load authenticated playlists:', error);
      }
    }

    setPlaylists(loadLocalPlaylists());
  };

  useEffect(() => {
    void hydratePlaylists();

    const handleAuthSuccess = () => {
      void hydratePlaylists();
    };

    const handleAuthSignOut = () => {
      setPlaylists(loadLocalPlaylists());
    };

    window.addEventListener('emailAuthSuccess', handleAuthSuccess);
    window.addEventListener('emailAuthSignOut', handleAuthSignOut);

    return () => {
      window.removeEventListener('emailAuthSuccess', handleAuthSuccess);
      window.removeEventListener('emailAuthSignOut', handleAuthSignOut);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(playlists));
  }, [playlists]);

  const createPlaylist = async (name: string, description: string) => {
    const playlistName = name.trim();
    const playlistDescription = description.trim() || 'My curated collection';

    if (emailAuth.isAuthenticated()) {
      try {
        const created = await requestPlaylistApi('/playlists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: playlistName,
            description: playlistDescription,
            tracks: [],
          }),
        });

        const nextPlaylist = normalizePlaylist(created as Record<string, unknown>);
        setPlaylists(prev => [nextPlaylist, ...prev]);
        return;
      } catch (error) {
        console.error('Failed to create playlist on backend:', error);
      }
    }

    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}`,
      name: playlistName,
      description: playlistDescription,
      tracks: [],
      createdAt: new Date().toISOString(),
    };

    setPlaylists(prev => [newPlaylist, ...prev]);
  };

  const deletePlaylist = async (id: string) => {
    if (emailAuth.isAuthenticated()) {
      try {
        await requestPlaylistApi(`/playlists/${id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to delete playlist on backend:', error);
      }
    }

    setPlaylists(prev => prev.filter(playlist => playlist.id !== id));
  };

  const addTrackToPlaylist = async (playlistId: string, track: Track) => {
    const targetPlaylist = playlists.find(playlist => playlist.id === playlistId);

    if (!targetPlaylist) {
      return;
    }

    const trackExists = targetPlaylist.tracks.some(existingTrack => existingTrack.id === track.id);
    if (trackExists) {
      return;
    }

    const nextTracks = [...targetPlaylist.tracks, track];

    if (emailAuth.isAuthenticated()) {
      try {
        const updated = await requestPlaylistApi(`/playlists/${playlistId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tracks: nextTracks,
          }),
        });

        const normalized = normalizePlaylist(updated as Record<string, unknown>);
        setPlaylists(prev => prev.map(playlist => playlist.id === playlistId ? normalized : playlist));
        return;
      } catch (error) {
        console.error('Failed to update playlist on backend:', error);
      }
    }

    setPlaylists(prev =>
      prev.map(playlist => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            tracks: nextTracks,
          };
        }
        return playlist;
      })
    );
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: number) => {
    const targetPlaylist = playlists.find(playlist => playlist.id === playlistId);

    if (!targetPlaylist) {
      return;
    }

    const nextTracks = targetPlaylist.tracks.filter(track => track.id !== trackId);

    if (emailAuth.isAuthenticated()) {
      try {
        const updated = await requestPlaylistApi(`/playlists/${playlistId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tracks: nextTracks,
          }),
        });

        const normalized = normalizePlaylist(updated as Record<string, unknown>);
        setPlaylists(prev => prev.map(playlist => playlist.id === playlistId ? normalized : playlist));
        return;
      } catch (error) {
        console.error('Failed to update playlist on backend:', error);
      }
    }

    setPlaylists(prev =>
      prev.map(playlist => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            tracks: nextTracks,
          };
        }
        return playlist;
      })
    );
  };

  const updatePlaylist = async (id: string, name: string, description: string) => {
    if (emailAuth.isAuthenticated()) {
      try {
        const updated = await requestPlaylistApi(`/playlists/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            description,
          }),
        });

        const normalized = normalizePlaylist(updated as Record<string, unknown>);
        setPlaylists(prev => prev.map(playlist => playlist.id === id ? normalized : playlist));
        return;
      } catch (error) {
        console.error('Failed to update playlist on backend:', error);
      }
    }

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
