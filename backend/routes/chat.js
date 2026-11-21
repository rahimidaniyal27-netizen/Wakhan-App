const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Get room messages
router.get('/:room', auth, async (req, res) => {
  try {
    const msgs = await Message.find({ room: req.params.room })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'name username avatar')
      .lean();
    res.json(msgs.reverse());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get user's rooms
router.get('/rooms/list', auth, async (req, res) => {
  try {
    const rooms = await Message.distinct('room', {
      $or: [
        { sender: req.user.id },
        { room: { $regex: req.user.id } }
      ]
    });
    res.json(rooms);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
