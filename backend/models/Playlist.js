const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  artist: {
    type: String,
    required: true,
    trim: true,
  },
  artistAddress: {
    type: String,
    required: true,
    trim: true,
  },
  duration: {
    type: String,
    default: '0:00',
  },
  plays: {
    type: Number,
    default: 0,
  },
  coverArt: {
    type: String,
    default: null,
  },
  audioUrl: {
    type: String,
    default: null,
  },
  genre: {
    type: String,
    default: 'Unknown',
  },
  mood: {
    type: String,
    default: null,
  },
  bpm: {
    type: Number,
    default: null,
  },
  releaseDate: {
    type: String,
    default: null,
  },
}, { _id: false });

const playlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [80, 'Playlist name cannot exceed 80 characters'],
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: [250, 'Playlist description cannot exceed 250 characters'],
  },
  tracks: {
    type: [trackSchema],
    default: [],
  },
  coverArt: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

playlistSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Playlist', playlistSchema);
