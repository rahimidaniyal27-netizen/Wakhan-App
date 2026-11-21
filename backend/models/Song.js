const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String },
  coverUrl: { type: String },
  audioUrl: { type: String, required: true },
  duration: { type: Number, default: 0 },
  genre: { type: String },
  language: { type: String, default: 'fa' },
  likes: { type: Number, default: 0 },
  playCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Song', SongSchema);
