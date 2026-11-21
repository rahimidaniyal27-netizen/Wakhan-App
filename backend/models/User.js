const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  avatar: { type: String, default: '' },
  birthDate: { type: Date },
  googleId: { type: String, sparse: true },
  facebookId: { type: String, sparse: true },
  telegramId: { type: String, sparse: true },
  wallet: { type: Number, default: 0 },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  pushToken: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
