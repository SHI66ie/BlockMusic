import { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaPlay, FaTrash, FaMusic, FaList } from 'react-icons/fa';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

export default function PlaylistsPage() {
  const { playlists, createPlaylist, deletePlaylist, addTrackToPlaylist, removeTrackFromPlaylist } = usePlaylist();
  const { playTrack, playlist, addToQueue } = useMusicPlayer();

  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');

  useEffect(() => {
    if (!selectedPlaylistId && playlists.length > 0) {
      setSelectedPlaylistId(playlists[0].id);
    }
  }, [playlists, selectedPlaylistId]);

  const queuePreview = useMemo(() => playlist.slice(0, 6), [playlist]);

  const handleCreatePlaylist = () => {
    if (!playlistName.trim()) {
      return;
    }

    createPlaylist(playlistName.trim(), playlistDescription.trim() || 'My curated collection');
    setPlaylistName('');
    setPlaylistDescription('');
  };

  const handleAddCurrentTrackToPlaylist = () => {
    const track = queuePreview[0];
    if (!track || !selectedPlaylistId) {
      return;
    }
    addTrackToPlaylist(selectedPlaylistId, track);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">My Playlists</h1>
          <p className="text-gray-400 mt-1">Create custom playlists, save tracks, and keep your favorites close.</p>
        </div>
        <div className="text-sm text-purple-300 bg-purple-900/30 border border-purple-700/60 rounded-full px-4 py-2">
          {playlists.length} saved {playlists.length === 1 ? 'playlist' : 'playlists'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6">
        <div className="bg-gray-800/80 rounded-2xl p-5 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <FaPlus className="text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Create playlist</h2>
          </div>

          <div className="space-y-3">
            <input
              value={playlistName}
              onChange={(event) => setPlaylistName(event.target.value)}
              placeholder="Playlist name"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <textarea
              value={playlistDescription}
              onChange={(event) => setPlaylistDescription(event.target.value)}
              placeholder="Description"
              rows={4}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleCreatePlaylist}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl font-semibold transition-colors"
            >
              Save playlist
            </button>
          </div>

          <div className="mt-6 border-t border-gray-700 pt-4">
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-300">
              <FaList />
              <span>Quick add from current queue</span>
            </div>
            <select
              value={selectedPlaylistId}
              onChange={(event) => setSelectedPlaylistId(event.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddCurrentTrackToPlaylist}
              className="mt-3 w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-semibold transition-colors"
            >
              Add active track to playlist
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {playlists.length === 0 ? (
            <div className="bg-gray-800/60 rounded-2xl border border-dashed border-gray-700 p-12 text-center text-gray-400">
              <FaMusic className="mx-auto text-4xl mb-3 opacity-60" />
              <p className="text-lg">No playlists yet.</p>
              <p className="text-sm mt-1">Create your first mix and start saving tracks from the explorer.</p>
            </div>
          ) : (
            playlists.map((playlist) => (
              <div key={playlist.id} className="bg-gray-800/80 rounded-2xl p-5 border border-gray-700">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{playlist.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{playlist.description || 'Custom playlist curated by you.'}</p>
                    <p className="text-xs text-gray-500 mt-2">{playlist.tracks.length} track{playlist.tracks.length === 1 ? '' : 's'}</p>
                  </div>
                  <button
                    onClick={() => deletePlaylist(playlist.id)}
                    className="inline-flex items-center gap-2 bg-red-900/40 hover:bg-red-900/60 text-red-200 border border-red-700 rounded-xl px-4 py-2 transition-colors"
                  >
                    <FaTrash />
                    Delete
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {playlist.tracks.length === 0 ? (
                    <div className="rounded-xl bg-gray-900/70 border border-dashed border-gray-700 p-4 text-sm text-gray-400">
                      Add tracks from the marketplace to start building this playlist.
                    </div>
                  ) : (
                    playlist.tracks.map((track) => (
                      <div key={`${playlist.id}-${track.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-gray-900/70 p-3">
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{track.title}</p>
                          <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              playTrack(track);
                              addToQueue(track);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-2"
                            aria-label={`Play ${track.title}`}
                          >
                            <FaPlay />
                          </button>
                          <button
                            onClick={() => removeTrackFromPlaylist(playlist.id, track.id)}
                            className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-2"
                            aria-label={`Remove ${track.title} from playlist`}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
