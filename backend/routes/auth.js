const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'wakhan-secret';

function signToken(user) {
  return jwt.sign({ id: user._id, username: user.username }, SECRET, { expiresIn: '30d' });
}

// Register / complete profile
router.post('/profile', auth, async (req, res) => {
  try {
    const { name, username, birth, avatar } = req.body;
    if (!name || name.length < 2) return res.status(400).json({ error: 'name_short' });
    if (!username || !/^(?![._])(?!.*[._]{2})[a-z0-9._]{3,24}(?<![._])$/.test(username)) {
      return res.status(400).json({ error: 'username_bad' });
    }
    const exists = await User.findOne({ username });
    if (exists && exists._id.toString() !== req.user.id) {
      return res.status(400).json({ error: 'username_taken' });
    }
    const user = await User.findByIdAndUpdate(req.user.id, {
      name, username, avatar, birthDate: birth ? new Date(birth) : undefined
    }, { new: true, upsert: true });
    res.json({ user, token: signToken(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Check username availability
router.get('/username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.query.u?.toLowerCase() });
    res.json({ free: !user, err: !!user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-__v');
    if (!user) return res.status(404).json({ error: 'not_found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
