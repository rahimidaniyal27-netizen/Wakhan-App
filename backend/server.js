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

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wakhan')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const musicRoutes = require('./routes/music');
const userRoutes = require('./routes/user');
const callRoutes = require('./routes/call');
const uploadRoutes = require('./routes/upload');

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/user', userRoutes);
app.use('/api/call', callRoutes);
app.use('/api/upload', uploadRoutes);

// App aliases for frontend compatibility
app.use('/api/app', authRoutes);
app.use('/api/app', userRoutes);
app.use('/api/app', chatRoutes);

// === CATCH-ALL for Wakhan app endpoints ===
// These return empty/success responses so the app can load

app.get('/api/me', (req, res) => {
  res.json({ ok: true, entitlement: null, finance: null, identity: null, me: null });
});

app.post('/api/me', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/search', (req, res) => {
  res.json({ ok: true, results: [] });
});

app.get('/api/stream', (req, res) => {
  res.json({ ok: true, url: req.query.u });
});

app.get('/api/fav', (req, res) => {
  res.json({ ok: true, favs: [] });
});

app.post('/api/fav', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/g/:gid', (req, res) => {
  res.json({ ok: true, g: req.params.gid });
});

app.post('/api/g/:gid', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/personal', (req, res) => {
  res.json({ ok: true, entitlement: null });
});

app.post('/api/personal/order', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/personal/trial', (req, res) => {
  res.json({ ok: false, duplicate: false });
});

app.get('/api/finance', (req, res) => {
  res.json({ ok: true, balance: 0 });
});

app.get('/api/finance/orders', (req, res) => {
  res.json({ ok: true, orders: [] });
});

app.post('/api/finance/seen', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/finance/review', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/identity', (req, res) => {
  res.json({ ok: true, identity: null });
});

app.get('/api/checkout', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/checkout/prepare', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/checkout/stars', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/checkout/status', (req, res) => {
  res.json({ ok: true, status: 'paid' });
});

app.get('/api/profile', (req, res) => {
  res.json({ ok: true, profile: null });
});

app.get('/api/wallet', (req, res) => {
  res.json({ ok: true, balance: 0 });
});

app.post('/api/wallet', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/frames', (req, res) => {
  res.json({ ok: true, frames: [] });
});

app.post('/api/frames', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/cinema/search', (req, res) => {
  res.json({ ok: true, results: [] });
});

app.get('/api/cinema/lock', (req, res) => {
  res.json({ ok: true, configured: false });
});

app.get('/api/cinema/providers', (req, res) => {
  res.json({ ok: true, providers: [] });
});

app.get('/api/cinema/files', (req, res) => {
  res.json({ ok: true, files: [] });
});

app.post('/api/cinema/files', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/yfeed', (req, res) => {
  res.json({ ok: true, items: [] });
});

app.get('/api/operations', (req, res) => {
  res.json({ ok: true, ops: [] });
});

app.post('/api/operations', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/v60/library', (req, res) => {
  res.json({ ok: true, library: [] });
});

app.post('/api/v60/library', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/v70/:path', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/v70/:path', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/v51/hall', (req, res) => {
  res.json({ ok: true, hall: null, halls: [] });
});

app.post('/api/v51/hall', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/room/new', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/c/:code', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/c/:code', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/cv/:cid', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/cv/:cid', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/cv/:cid/poll', (req, res) => {
  res.json({ ok: true, v: 0 });
});

app.get('/api/app/resolve', (req, res) => {
  res.json({ ok: true, user: null });
});

app.get('/api/app/dm/media/:id', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/app/dm/media', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/app/report', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/app/delete', (req, res) => {
  res.json({ ok: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Final catch-all for anything else
app.all('/api/*', (req, res) => {
  console.log('Unhandled API:', req.method, req.path);
  res.json({ ok: true });
});

// Socket.io
require('./socket/chat')(io);

// Start
const PORT = process.env.PORT || 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Wakhan API running on port ${PORT}`);
});
