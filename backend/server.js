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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/music', require('./routes/music'));
app.use('/api/user', require('./routes/user'));
app.use('/api/call', require('./routes/call'));
app.use('/api/upload', require('./routes/upload'));

// App aliases for frontend compatibility
app.use('/api/app', require('./routes/auth'));
app.use('/api/app', require('./routes/user'));
app.use('/api/app', require('./routes/chat'));

// Catch-all for app endpoints
app.all('/api/*', (req, res) => {
  console.log('Unhandled API:', req.method, req.path);
  res.json({ ok: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Socket.io
require('./socket/chat')(io);

// Start
const PORT = process.env.PORT || 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Wakhan API running on port ${PORT}`);
});
