const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Get room messages (with pagination)
router.get('/:room', auth, async (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    const query = { room: req.params.room, isDeleted: false };
    if (before) query.createdAt = { $lt: new Date(before) };
    const msgs = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('sender', 'name username avatar')
      .populate('replyTo', 'text sender')
      .populate('mentions', 'name username')
      .lean();
    res.json(msgs.reverse());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Search messages in a room
router.get('/:room/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    const msgs = await Message.find({
      room: req.params.room,
      isDeleted: false,
      text: { $regex: q, $options: 'i' }
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('sender', 'name username avatar')
      .lean();
    res.json(msgs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Pin a message
router.post('/:id/pin', auth, async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { isPinned: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Unpin a message
router.post('/:id/unpin', auth, async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { isPinned: false });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete message (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'not_found' });
    if (msg.sender.toString() !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    await Message.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
      deletedAt: new Date(),
      text: '[پیام حذف شد]'
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Edit message
router.patch('/:id', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'not_found' });
    if (msg.sender.toString() !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    await Message.findByIdAndUpdate(req.params.id, { text, isEdited: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add reaction
router.post('/:id/react', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    await Message.findByIdAndUpdate(req.params.id, {
      $pull: { reactions: { user: req.user.id } },
      $push: { reactions: { user: req.user.id, emoji } }
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Remove reaction
router.delete('/:id/react', auth, async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, {
      $pull: { reactions: { user: req.user.id } }
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get pinned messages in room
router.get('/:room/pins', auth, async (req, res) => {
  try {
    const msgs = await Message.find({ room: req.params.room, isPinned: true, isDeleted: false })
      .sort({ createdAt: -1 })
      .populate('sender', 'name username avatar')
      .lean();
    res.json(msgs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
