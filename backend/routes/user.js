const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Update online status
router.post('/online', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      isOnline: req.body.online !== false,
      lastSeen: new Date()
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get user by username
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('name username avatar isOnline lastSeen');
    if (!user) return res.status(404).json({ error: 'not_found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
