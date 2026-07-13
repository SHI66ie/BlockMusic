const { expect } = require('chai');
const sinon = require('sinon');
const request = require('supertest');
const mongoose = require('mongoose');

const Playlist = require('../../models/Playlist');
const auth = require('../../middleware/auth');
const {
  connectDB,
  closeDB,
  clearDB,
  generateMockUser,
} = require('../testUtils');

let app;

describe('Playlist Controller', () => {
  const mockUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    role: 'user',
  };

  beforeAll(async () => {
    await connectDB();
    sinon.stub(auth, 'protect').callsFake((req, res, next) => {
      req.user = mockUser;
      next();
    });
    app = require('../../app');
  });

  beforeEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    sinon.restore();
    await closeDB();
  });

  it('should create a playlist for the authenticated user', async () => {
    const res = await request(app)
      .post('/api/playlists')
      .set('Authorization', 'Bearer test-token')
      .send({
        name: 'Weekend Mix',
        description: 'Late-night favorites',
        tracks: [
          {
            id: 1,
            title: 'Midnight City',
            artist: 'M83',
            artistAddress: '0x0000000000000000000000000000000000000001',
            duration: '4:03',
            plays: 45,
            genre: 'Synthwave',
            coverArt: 'https://example.com/cover.jpg',
            audioUrl: 'https://example.com/audio.mp3',
          },
        ],
      })
      .expect(201);

    expect(res.body.success).to.equal(true);
    expect(res.body.data.name).to.equal('Weekend Mix');
    expect(res.body.data.user).to.equal(mockUser._id);
    expect(res.body.data.tracks).to.have.lengthOf(1);

    const savedPlaylist = await Playlist.findOne({ user: mockUser._id });
    expect(savedPlaylist).to.not.equal(null);
    expect(savedPlaylist.name).to.equal('Weekend Mix');
  });

  it('should return the authenticated user playlists', async () => {
    await Playlist.create({
      user: mockUser._id,
      name: 'Favorites',
      description: 'My favorites',
      tracks: [],
    });

    const res = await request(app)
      .get('/api/playlists')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.have.lengthOf(1);
    expect(res.body.data[0].name).to.equal('Favorites');
  });
});
