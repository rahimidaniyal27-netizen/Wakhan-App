const Message = require('../models/Message');
const Call = require('../models/Call');
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

    // Text / Image / Voice / Sticker message
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
          .populate('mentions', 'name username')
          .lean();
        io.to(room).emit('message', populated);
      } catch (e) {
        socket.emit('error', { message: e.message });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(data.room).emit('typing', {
        user: data.user,
        typing: data.typing
      });
    });

    // Read receipt
    socket.on('read', async (data) => {
      try {
        await Message.findByIdAndUpdate(data.messageId, {
          $addToSet: { readBy: data.userId }
        });
        io.to(data.room).emit('read', {
          messageId: data.messageId,
          userId: data.userId
        });
      } catch (e) {
        socket.emit('error', { message: e.message });
      }
    });

    // Reaction
    socket.on('reaction', async (data) => {
      try {
        const { messageId, userId, emoji, room } = data;
        await Message.findByIdAndUpdate(messageId, {
          $pull: { reactions: { user: userId } },
          $push: { reactions: { user: userId, emoji } }
        });
        io.to(room).emit('reaction', { messageId, userId, emoji });
      } catch (e) {
        socket.emit('error', { message: e.message });
      }
    });

    // Edit message
    socket.on('edit', async (data) => {
      try {
        const { messageId, text, room } = data;
        await Message.findByIdAndUpdate(messageId, { text, isEdited: true });
        io.to(room).emit('edit', { messageId, text });
      } catch (e) {
        socket.emit('error', { message: e.message });
      }
    });

    // Delete message
    socket.on('delete', async (data) => {
      try {
        const { messageId, room } = data;
        await Message.findByIdAndUpdate(messageId, {
          isDeleted: true,
          deletedAt: new Date(),
          text: '[پیام حذف شد]'
        });
        io.to(room).emit('delete', { messageId });
      } catch (e) {
        socket.emit('error', { message: e.message });
      }
    });

    // Pin message
    socket.on('pin', async (data) => {
      try {
        const { messageId, room, pinned } = data;
        await Message.findByIdAndUpdate(messageId, { isPinned: pinned });
        io.to(room).emit('pin', { messageId, pinned });
      } catch (e) {
        socket.emit('error', { message: e.message });
      }
    });

    // Call signaling (WebRTC)
    socket.on('call-offer', (data) => {
      socket.to(data.room).emit('call-offer', data);
    });

    socket.on('call-answer', (data) => {
      socket.to(data.room).emit('call-answer', data);
    });

    socket.on('call-ice', (data) => {
      socket.to(data.room).emit('call-ice', data);
    });

    socket.on('call-end', (data) => {
      io.to(data.room).emit('call-end', data);
    });

    // Online status
    socket.on('online', async (data) => {
      try {
        await User.findByIdAndUpdate(data.userId, {
          isOnline: data.online,
          lastSeen: new Date()
        });
        io.emit('user-online', { userId: data.userId, online: data.online });
      } catch (e) {
        console.error(e);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
};
