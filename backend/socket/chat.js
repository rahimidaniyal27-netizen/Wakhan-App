const Message = require('../models/Message');
const User = require('../models/User');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join', (room) => {
      socket.join(room);
      console.log('Joined room:', room);
    });

    socket.on('leave', (room) => {
      socket.leave(room);
    });

    socket.on('message', async (data) => {
      try {
        const { room, text, sender, type = 'text' } = data;
        const msg = await Message.create({ room, sender, text, type });
        const populated = await Message.findById(msg._id)
          .populate('sender', 'name username avatar')
          .lean();
        io.to(room).emit('message', populated);
      } catch (e) {
        socket.emit('error', { message: e.message });
      }
    });

    socket.on('typing', (data) => {
      socket.to(data.room).emit('typing', {
        user: data.user,
        typing: data.typing
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
};
