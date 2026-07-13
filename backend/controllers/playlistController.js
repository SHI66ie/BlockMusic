const Playlist = require('../models/Playlist');
const { successResponse, errorResponse, validationError, notFoundResponse } = require('../utils/apiResponse');

const getUserPlaylists = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const playlists = await Playlist.find({ user: userId }).sort({ createdAt: -1 });
    return successResponse(res, playlists, 'Playlists retrieved successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to retrieve playlists', 500, error);
  }
};

const createPlaylist = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { name, description, tracks = [], coverArt = null } = req.body;

    if (!name?.trim()) {
      return validationError(res, [
        { field: 'name', message: 'Playlist name is required' },
      ]);
    }

    const playlist = await Playlist.create({
      user: userId,
      name: name.trim(),
      description: description?.trim() || '',
      tracks,
      coverArt,
    });

    return successResponse(res, playlist, 'Playlist created successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create playlist', 400, error);
  }
};

const getPlaylistById = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const playlist = await Playlist.findOne({ _id: req.params.id, user: userId });

    if (!playlist) {
      return notFoundResponse(res, 'Playlist not found');
    }

    return successResponse(res, playlist, 'Playlist retrieved successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to retrieve playlist', 500, error);
  }
};

const updatePlaylist = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { name, description, tracks, coverArt } = req.body;
    const playlist = await Playlist.findOne({ _id: req.params.id, user: userId });

    if (!playlist) {
      return notFoundResponse(res, 'Playlist not found');
    }

    if (name !== undefined) playlist.name = name.trim();
    if (description !== undefined) playlist.description = typeof description === 'string' ? description.trim() : '';
    if (tracks !== undefined) playlist.tracks = tracks;
    if (coverArt !== undefined) playlist.coverArt = coverArt;

    await playlist.save();
    return successResponse(res, playlist, 'Playlist updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update playlist', 400, error);
  }
};

const deletePlaylist = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const deleted = await Playlist.findOneAndDelete({ _id: req.params.id, user: userId });

    if (!deleted) {
      return notFoundResponse(res, 'Playlist not found');
    }

    return successResponse(res, null, 'Playlist deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to delete playlist', 500, error);
  }
};

module.exports = {
  getUserPlaylists,
  createPlaylist,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
};
