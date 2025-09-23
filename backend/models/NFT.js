const mongoose = require('mongoose');

const nftSchema = new mongoose.Schema({
  tokenId: { type: Number, required: true, unique: true },
  owner: { type: String, required: true },
  tokenURI: { type: String, required: true },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
nftSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('NFT', nftSchema);
