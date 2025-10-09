import React, { useState } from 'react';
import { 
  FaPlay, 
  FaPause, 
  FaVolumeUp, 
  FaVolumeMute, 
  FaMusic, 
  FaStepBackward, 
  FaStepForward,
  FaRandom,
  FaRedo,
  FaHeart,
  FaRegHeart
} from 'react-icons/fa';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

export const NowPlayingBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    currentTime,
    duration,
    volume,
    setVolume,
    seek,
    playNext,
    playPrevious,
    isShuffled,
    toggleShuffle,
    repeatMode,
    setRepeatMode,
  } = useMusicPlayer();

  const [isLiked, setIsLiked] = useState(false);

  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleToggleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  const toggleLike = () => setIsLiked(!isLiked);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 border-t border-purple-700 shadow-2xl z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 flex-shrink-0 w-64">
            {currentTrack.coverArt ? (
              <img
                src={currentTrack.coverArt}
                alt={currentTrack.title}
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-purple-700 rounded flex items-center justify-center">
                <FaMusic className="text-white text-xl" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate text-sm">
                {currentTrack.title}
              </p>
              <p className="text-purple-300 text-xs truncate">
                {currentTrack.artist}
              </p>
            </div>
            {/* Like Button */}
            <button
              onClick={toggleLike}
              className="text-purple-300 hover:text-pink-500 transition-colors"
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              {isLiked ? <FaHeart className="text-pink-500" /> : <FaRegHeart />}
            </button>
          </div>

          {/* Player Controls */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-center gap-4">
              {/* Shuffle */}
              <button
                onClick={toggleShuffle}
                className={`transition-colors ${
                  isShuffled ? 'text-green-400' : 'text-purple-300 hover:text-white'
                }`}
                aria-label="Shuffle"
                title="Shuffle"
              >
                <FaRandom className="text-sm" />
              </button>

              {/* Previous */}
              <button
                onClick={playPrevious}
                className="text-purple-300 hover:text-white transition-colors"
                aria-label="Previous"
                title="Previous track"
              >
                <FaStepBackward />
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 rounded-full bg-white text-purple-900 flex items-center justify-center hover:scale-110 transition-transform"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <FaPause className="text-lg" />
                ) : (
                  <FaPlay className="text-lg ml-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={playNext}
                className="text-purple-300 hover:text-white transition-colors"
                aria-label="Next"
                title="Next track"
              >
                <FaStepForward />
              </button>

              {/* Repeat */}
              <button
                onClick={handleToggleRepeat}
                className={`transition-colors ${
                  repeatMode !== 'off' ? 'text-green-400' : 'text-purple-300 hover:text-white'
                }`}
                aria-label={`Repeat ${repeatMode}`}
                title={`Repeat: ${repeatMode}`}
              >
                <FaRedo className="text-sm" />
                {repeatMode === 'one' && (
                  <span className="absolute -mt-1 -ml-1 text-xs">1</span>
                )}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <span className="text-purple-300 text-xs w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-purple-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #fff 0%, #fff ${
                    (currentTime / duration) * 100
                  }%, #7c3aed ${(currentTime / duration) * 100}%, #7c3aed 100%)`,
                }}
              />
              <span className="text-purple-300 text-xs w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-shrink-0 w-32">
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 1)}
              className="text-white hover:text-purple-300 transition-colors"
            >
              {volume > 0 ? <FaVolumeUp /> : <FaVolumeMute />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 bg-purple-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
