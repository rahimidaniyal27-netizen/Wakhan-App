#!/bin/bash
set -e

echo "=========================================="
echo "  Wakhan Backend Auto Installer v1.0"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root: sudo bash install.sh${NC}"
  exit 1
fi

# Config
APP_DIR="/var/www/wakhan-app"
BACKEND_DIR="$APP_DIR/backend"

echo -e "${YELLOW}[1/8] Updating system...${NC}"
apt update -y && apt upgrade -y

echo -e "${YELLOW}[2/8] Installing base tools...${NC}"
apt install -y curl wget git nano ufw nginx software-properties-common \
  apt-transport-https ca-certificates gnupg unzip

echo -e "${YELLOW}[3/8] Installing Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

echo -e "${YELLOW}[4/8] Installing PM2...${NC}"
npm install -g pm2 2>/dev/null || true

echo -e "${YELLOW}[5/8] Installing MongoDB...${NC}"
if ! command -v mongod &> /dev/null; then
  curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
    gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
    tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  apt update -y
  apt install -y mongodb-org
fi
systemctl start mongod
systemctl enable mongod

echo -e "${YELLOW}[6/8] Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo -e "${YELLOW}[7/8] Creating app structure...${NC}"
rm -rf "$APP_DIR"
mkdir -p "$BACKEND_DIR"/{routes,models,middleware,socket,uploads}
cd "$BACKEND_DIR"

# package.json
cat > package.json << 'PKGJSON'
{
  "name": "wakhan-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "mongoose": "^8.7.0",
    "socket.io": "^4.8.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "express-rate-limit": "^7.4.0",
    "helmet": "^8.0.0",
    "compression": "^1.7.4",
    "multer": "^1.4.5-lts.1"
  }
}
PKGJSON

# .env
cat > .env << 'ENVEOF'
PORT=8000
MONGODB_URI=mongodb://127.0.0.1:27017/wakhan
JWT_SECRET=wakhan-2026-secret-random-key
NODE_ENV=production
ENVEOF

# server.js
cat > server.js << 'SRVEOF'
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests' }
});
app.use(limiter);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wakhan')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/music', require('./routes/music'));
app.use('/api/user', require('./routes/user'));
app.use('/api/call', require('./routes/call'));
app.use('/api/upload', require('./routes/upload'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

require('./socket/chat')(io);

const PORT = process.env.PORT || 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('Wakhan API running on port ' + PORT);
});
SRVEOF

# middleware/auth.js
cat > middleware/auth.js << 'AUTHEOF'
const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'wakhan-secret');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
AUTHEOF

# models/User.js
cat > models/User.js << 'USEREOF'
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
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', UserSchema);
USEREOF

# models/Message.js
cat > models/Message.js << 'MSGEOF'
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
MSGEOF

# models/Song.js
cat > models/Song.js << 'SONGEOF'
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
SONGEOF

# models/Call.js
cat > models/Call.js << 'CALLEOF'
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
CALLEOF

# routes/auth.js
cat > routes/auth.js << 'AUTHREOF'
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'wakhan-secret';

function signToken(user) {
  return jwt.sign({ id: user._id, username: user.username }, SECRET, { expiresIn: '30d' });
}

router.post('/profile', auth, async (req, res) => {
  try {
    const { name, username, birth, avatar } = req.body;
    if (!name || name.length < 2) return res.status(400).json({ error: 'name_short' });
    const user = await User.findByIdAndUpdate(req.user.id, {
      name, username, avatar, birthDate: birth ? new Date(birth) : undefined
    }, { new: true, upsert: true });
    res.json({ user, token: signToken(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.query.u?.toLowerCase() });
    res.json({ free: !user, err: !!user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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
AUTHREOF

# routes/chat.js
cat > routes/chat.js << 'CHATEOF'
const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const router = express.Router();

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
      .lean();
    res.json(msgs.reverse());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:room/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    const msgs = await Message.find({
      room: req.params.room, isDeleted: false,
      text: { $regex: q, $options: 'i' }
    }).sort({ createdAt: -1 }).limit(30)
      .populate('sender', 'name username avatar').lean();
    res.json(msgs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/pin', auth, async (req, res) => {
  try { await Message.findByIdAndUpdate(req.params.id, { isPinned: true }); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/unpin', auth, async (req, res) => {
  try { await Message.findByIdAndUpdate(req.params.id, { isPinned: false }); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'not_found' });
    if (msg.sender.toString() !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    await Message.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date(), text: '[پیام حذف شد]' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'not_found' });
    if (msg.sender.toString() !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    await Message.findByIdAndUpdate(req.params.id, { text, isEdited: true });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/react', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    await Message.findByIdAndUpdate(req.params.id, {
      $pull: { reactions: { user: req.user.id } },
      $push: { reactions: { user: req.user.id, emoji } }
    });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id/react', auth, async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { $pull: { reactions: { user: req.user.id } } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:room/pins', auth, async (req, res) => {
  try {
    const msgs = await Message.find({ room: req.params.room, isPinned: true, isDeleted: false })
      .sort({ createdAt: -1 }).populate('sender', 'name username avatar').lean();
    res.json(msgs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
CHATEOF

# routes/music.js
cat > routes/music.js << 'MUSICEOF'
const express = require('express');
const Song = require('../models/Song');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/list', async (req, res) => {
  try {
    const { q, genre, limit = 20, skip = 0 } = req.query;
    const filter = {};
    if (q) filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { artist: { $regex: q, $options: 'i' } }
    ];
    if (genre) filter.genre = genre;
    const songs = await Song.find(filter).sort({ playCount: -1 })
      .skip(Number(skip)).limit(Number(limit)).lean();
    res.json(songs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/like/:id', auth, async (req, res) => {
  try { await Song.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/play/:id', async (req, res) => {
  try { await Song.findByIdAndUpdate(req.params.id, { $inc: { playCount: 1 } }); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
MUSICEOF

# routes/user.js
cat > routes/user.js << 'USERREOF'
const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/online', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      isOnline: req.body.online !== false,
      lastSeen: new Date()
    });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('name username avatar isOnline lastSeen');
    if (!user) return res.status(404).json({ error: 'not_found' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
USERREOF

# routes/call.js
cat > routes/call.js << 'CALLREOF'
const express = require('express');
const Call = require('../models/Call');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/start', auth, async (req, res) => {
  try {
    const { room, callee, type } = req.body;
    const call = await Call.create({ room, caller: req.user.id, callee, type, status: 'ringing' });
    res.json(call);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/accept', auth, async (req, res) => {
  try {
    const call = await Call.findByIdAndUpdate(req.params.id, { status: 'ongoing', startedAt: new Date() }, { new: true });
    res.json(call);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/end', auth, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) return res.status(404).json({ error: 'not_found' });
    const endedAt = new Date();
    const duration = call.startedAt ? Math.round((endedAt - call.startedAt) / 1000) : 0;
    await Call.findByIdAndUpdate(req.params.id, { status: 'ended', endedAt, duration });
    res.json({ ok: true, duration });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/reject', auth, async (req, res) => {
  try { await Call.findByIdAndUpdate(req.params.id, { status: 'rejected' }); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
CALLREOF

# routes/upload.js
cat > routes/upload.js << 'UPLOADEOF'
const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/image', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

router.post('/voice', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' });
  res.json({ url: `/uploads/${req.file.filename}`, duration: req.body.duration || 0 });
});

module.exports = router;
UPLOADEOF

# socket/chat.js
cat > socket/chat.js << 'SOCKEOF'
const Message = require('../models/Message');
const Call = require('../models/Call');
const User = require('../models/User');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join', (room) => { socket.join(room); });
    socket.on('leave', (room) => { socket.leave(room); });

    socket.on('message', async (data) => {
      try {
        const { room, text, sender, type = 'text', mediaUrl, voiceDuration, replyTo, mentions } = data;
        const msg = await Message.create({
          room, sender, text, type, mediaUrl, voiceDuration,
          replyTo: replyTo || undefined,
          mentions: mentions || []
        });
        const populated = await Message.findById(msg._id)
          .populate('sender', 'name username avatar')
          .populate('replyTo', 'text sender')
          .lean();
        io.to(room).emit('message', populated);
      } catch (e) { socket.emit('error', { message: e.message }); }
    });

    socket.on('typing', (data) => {
      socket.to(data.room).emit('typing', { user: data.user, typing: data.typing });
    });

    socket.on('read', async (data) => {
      try {
        await Message.findByIdAndUpdate(data.messageId, { $addToSet: { readBy: data.userId } });
        io.to(data.room).emit('read', { messageId: data.messageId, userId: data.userId });
      } catch (e) { socket.emit('error', { message: e.message }); }
    });

    socket.on('reaction', async (data) => {
      try {
        const { messageId, userId, emoji, room } = data;
        await Message.findByIdAndUpdate(messageId, {
          $pull: { reactions: { user: userId } },
          $push: { reactions: { user: userId, emoji } }
        });
        io.to(room).emit('reaction', { messageId, userId, emoji });
      } catch (e) { socket.emit('error', { message: e.message }); }
    });

    socket.on('edit', async (data) => {
      try {
        const { messageId, text, room } = data;
        await Message.findByIdAndUpdate(messageId, { text, isEdited: true });
        io.to(room).emit('edit', { messageId, text });
      } catch (e) { socket.emit('error', { message: e.message }); }
    });

    socket.on('delete', async (data) => {
      try {
        const { messageId, room } = data;
        await Message.findByIdAndUpdate(messageId, {
          isDeleted: true, deletedAt: new Date(), text: '[پیام حذف شد]'
        });
        io.to(room).emit('delete', { messageId });
      } catch (e) { socket.emit('error', { message: e.message }); }
    });

    socket.on('pin', async (data) => {
      try {
        const { messageId, room, pinned } = data;
        await Message.findByIdAndUpdate(messageId, { isPinned: pinned });
        io.to(room).emit('pin', { messageId, pinned });
      } catch (e) { socket.emit('error', { message: e.message }); }
    });

    socket.on('call-offer', (data) => { socket.to(data.room).emit('call-offer', data); });
    socket.on('call-answer', (data) => { socket.to(data.room).emit('call-answer', data); });
    socket.on('call-ice', (data) => { socket.to(data.room).emit('call-ice', data); });
    socket.on('call-end', (data) => { io.to(data.room).emit('call-end', data); });

    socket.on('online', async (data) => {
      try {
        await User.findByIdAndUpdate(data.userId, { isOnline: data.online, lastSeen: new Date() });
        io.emit('user-online', { userId: data.userId, online: data.online });
      } catch (e) { console.error(e); }
    });

    socket.on('disconnect', () => { console.log('Socket disconnected:', socket.id); });
  });
};
SOCKEOF

echo -e "${YELLOW}[8/8] Installing npm dependencies...${NC}"
npm install

echo ""
echo -e "${GREEN}=========================================="
echo "  ✅ Installation Complete!"
echo "==========================================${NC}"
echo ""
echo "To start server:"
echo "  cd $BACKEND_DIR"
echo "  node server.js"
echo ""
echo "To run with PM2 (recommended):"
echo "  cd $BACKEND_DIR"
echo "  pm2 start server.js --name wakhan-api"
echo "  pm2 save"
echo "  pm2 startup"
echo ""
echo "Test API:"
echo "  curl http://localhost:8000/api/health"
echo ""
