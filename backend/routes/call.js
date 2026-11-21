const express = require('express');
const Call = require('../models/Call');
const auth = require('../middleware/auth');
const router = express.Router();

// Start a call
router.post('/start', auth, async (req, res) => {
  try {
    const { room, callee, type } = req.body;
    const call = await Call.create({
      room,
      caller: req.user.id,
      callee,
      type,
      status: 'ringing'
    });
    res.json(call);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Accept call
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const call = await Call.findByIdAndUpdate(req.params.id, {
      status: 'ongoing',
      startedAt: new Date()
    }, { new: true });
    res.json(call);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// End call
router.post('/:id/end', auth, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) return res.status(404).json({ error: 'not_found' });
    const endedAt = new Date();
    const duration = call.startedAt ? Math.round((endedAt - call.startedAt) / 1000) : 0;
    await Call.findByIdAndUpdate(req.params.id, {
      status: 'ended',
      endedAt,
      duration
    });
    res.json({ ok: true, duration });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reject / Missed
router.post('/:id/reject', auth, async (req, res) => {
  try {
    await Call.findByIdAndUpdate(req.params.id, { status: 'rejected' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
