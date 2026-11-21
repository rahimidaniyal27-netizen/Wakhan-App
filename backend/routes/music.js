const express = require('express');
const Song = require('../models/Song');
const auth = require('../middleware/auth');
const router = express.Router();

// List songs
router.get('/list', async (req, res) => {
  try {
    const { q, genre, limit = 20, skip = 0 } = req.query;
    const filter = {};
    if (q) filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { artist: { $regex: q, $options: 'i' } }
    ];
    if (genre) filter.genre = genre;
    const songs = await Song.find(filter)
      .sort({ playCount: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();
    res.json(songs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Like song
router.post('/like/:id', auth, async (req, res) => {
  try {
    await Song.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Increment play count
router.post('/play/:id', async (req, res) => {
  try {
    await Song.findByIdAndUpdate(req.params.id, { $inc: { playCount: 1 } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
