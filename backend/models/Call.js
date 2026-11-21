const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  room: { type: String, required: true },
  caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  callee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['audio', 'video'], required: true },
  status: { type: String, enum: ['ringing', 'ongoing', 'ended', 'missed', 'rejected'], default: 'ringing' },
  startedAt: { type: Date },
  endedAt: { type: Date },
  duration: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Call', CallSchema);
