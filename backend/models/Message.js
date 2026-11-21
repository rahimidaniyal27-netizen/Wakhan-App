const mongoose = require('mongoose');

const ReactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emoji: { type: String, required: true }
}, { _id: false });

const MessageSchema = new mongoose.Schema({
  room: { type: String, required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String },
  type: { type: String, enum: ['text', 'image', 'voice', 'sticker', 'gift'], default: 'text' },
  mediaUrl: { type: String },
  voiceDuration: { type: Number },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [ReactionSchema],
  isPinned: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
