import SupportTicket from '../models/SupportTicket.js';
import SupportMessage from '../models/SupportMessage.js';
import User from '../models/User.js';
import { verifyToken } from '../utils/auth.js';
import { verifyFirebaseIdToken } from '../utils/firebaseAdmin.js';

const onlineSupportAdmins = new Map(); // { adminId: Set of socketIds }
const activeSupportRooms = new Map(); // { requestId: Set of socketIds }

const resolveSocketUser = async (token) => {
  if (!token) {
    return null;
  }

  const firebaseDecoded = await verifyFirebaseIdToken(token);
  if (firebaseDecoded?.uid) {
    const email = firebaseDecoded.email?.toLowerCase();
    return await User.findOne({
      $or: [
        { firebase_uid: firebaseDecoded.uid },
        ...(email ? [{ email }, { collegeEmail: email }, { personalEmail: email }] : [])
      ]
    });
  }

  const decodedJwt = verifyToken(token);
  if (decodedJwt?.userId) {
    return await User.findById(decodedJwt.userId);
  }

  return null;
};

const addOnlineAdmin = (adminId, socketId) => {
  const current = onlineSupportAdmins.get(adminId.toString()) || new Set();
  current.add(socketId);
  onlineSupportAdmins.set(adminId.toString(), current);
};

const removeOnlineAdmin = (adminId, socketId) => {
  const current = onlineSupportAdmins.get(adminId.toString());
  if (!current) {
    return;
  }

  current.delete(socketId);
  if (!current.size) {
    onlineSupportAdmins.delete(adminId.toString());
  }
};

const isAdminOnline = (adminId) => {
  return onlineSupportAdmins.has(adminId.toString());
};

export const registerSupportSocket = (io) => {
  const supportNamespace = io.of('/support');

  supportNamespace.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      const user = await resolveSocketUser(token);
      if (!user) {
        return next(new Error('Unauthorized socket connection'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Socket authentication failed'));
    }
  });

  supportNamespace.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const isAdmin = socket.user.role === 'admin' || socket.user.role === 'super_admin';

    console.log(`✓ Support socket connected: ${userId} (${isAdmin ? 'admin' : 'user'})`);

    // Track online admins
    if (isAdmin) {
      addOnlineAdmin(userId, socket.id);
      supportNamespace.emit('admin_online', { adminId: userId, online: true });
    }

    // User join support request room
    socket.on('join_support_request', async ({ requestId }, ack) => {
      try {
        const request = await SupportTicket.findById(requestId);
        if (!request) {
          throw new Error('Support request not found');
        }

        // Check authorization
        if (!isAdmin && request.user_id.toString() !== userId) {
          throw new Error('Unauthorized');
        }

        // Check if admin, verify they accepted the request
        if (isAdmin && request.status !== 'accepted') {
          throw new Error('Support request is not active');
        }

        // Add socket to room
        socket.join(`support:${requestId}`);
        const roomKey = `support:${requestId}`;

        if (!activeSupportRooms.has(roomKey)) {
          activeSupportRooms.set(roomKey, new Set());
        }
        activeSupportRooms.get(roomKey).add(socket.id);

        // Emit join event
        supportNamespace.to(roomKey).emit('user_joined_support', {
          requestId,
          userId,
          isAdmin,
          userName: socket.user.name,
          timestamp: new Date().toISOString()
        });

        if (ack) {
          ack({ ok: true, message: 'Joined support request' });
        }
      } catch (error) {
        if (ack) {
          ack({ ok: false, message: error.message });
        }
      }
    });

    // Send support message
    socket.on('send_support_message', async ({ requestId, message }, ack) => {
      try {
        if (!message || typeof message !== 'string' || message.trim().length === 0 || message.trim().length > 2000) {
          throw new Error('Invalid message');
        }

        const request = await SupportTicket.findById(requestId);
        if (!request) {
          throw new Error('Support request not found');
        }

        // Check authorization
        if (!isAdmin && request.user_id.toString() !== userId) {
          throw new Error('Unauthorized');
        }

        // Check status
        if (request.status !== 'accepted') {
          throw new Error('Support request is not active');
        }

        // Save message
        const supportMessage = await SupportMessage.create({
          support_ticket_id: requestId,
          sender_id: userId,
          sender_type: isAdmin ? 'admin' : 'user',
          message: message.trim()
        });

        // Update request timestamp
        request.updated_at = new Date();
        await request.save();

        // Emit message to all in the room
        const roomKey = `support:${requestId}`;
        supportNamespace.to(roomKey).emit('support_message', {
          _id: supportMessage._id,
          requestId,
          sender_id: userId,
          sender_name: socket.user.name,
          sender_type: isAdmin ? 'admin' : 'user',
          message: supportMessage.message,
          created_at: supportMessage.created_at
        });

        if (ack) {
          ack({ ok: true, messageId: supportMessage._id });
        }
      } catch (error) {
        if (ack) {
          ack({ ok: false, message: error.message });
        }
      }
    });

    // Typing indicator
    socket.on('support_typing_start', async ({ requestId }) => {
      try {
        const request = await SupportTicket.findById(requestId);
        if (!request) {
          return;
        }

        const roomKey = `support:${requestId}`;
        socket.to(roomKey).emit('support_typing_indicator', {
          requestId,
          userId,
          userName: socket.user.name,
          isAdmin
        });
      } catch (error) {
        console.error('Error in typing_start:', error.message);
      }
    });

    socket.on('support_typing_stop', async ({ requestId }) => {
      try {
        const roomKey = `support:${requestId}`;
        socket.to(roomKey).emit('support_typing_stop', {
          requestId,
          userId
        });
      } catch (error) {
        console.error('Error in typing_stop:', error.message);
      }
    });

    // Mark messages as read
    socket.on('mark_support_messages_read', async ({ requestId }, ack) => {
      try {
        const request = await SupportTicket.findById(requestId);
        if (!request) {
          throw new Error('Support request not found');
        }

        // Update read status for messages
        await SupportMessage.updateMany(
          { support_ticket_id: requestId, 'read_by': { $ne: userId } },
          { $addToSet: { read_by: userId }, read_at: new Date() }
        );

        const roomKey = `support:${requestId}`;
        supportNamespace.to(roomKey).emit('support_messages_read', {
          requestId,
          userId
        });

        if (ack) {
          ack({ ok: true });
        }
      } catch (error) {
        if (ack) {
          ack({ ok: false, message: error.message });
        }
      }
    });

    // Leave support room
    socket.on('leave_support_request', async ({ requestId }, ack) => {
      try {
        const roomKey = `support:${requestId}`;
        socket.leave(roomKey);

        const room = activeSupportRooms.get(roomKey);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            activeSupportRooms.delete(roomKey);
          }
        }

        supportNamespace.to(roomKey).emit('user_left_support', {
          requestId,
          userId,
          timestamp: new Date().toISOString()
        });

        if (ack) {
          ack({ ok: true });
        }
      } catch (error) {
        if (ack) {
          ack({ ok: false, message: error.message });
        }
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`✓ Support socket disconnected: ${userId}`);

      // Remove from admin tracking
      if (isAdmin) {
        removeOnlineAdmin(userId, socket.id);
        if (!isAdminOnline(userId)) {
          supportNamespace.emit('admin_online', { adminId: userId, online: false });
        }
      }

      // Remove from all rooms
      activeSupportRooms.forEach((room, roomKey) => {
        room.delete(socket.id);
        if (room.size === 0) {
          activeSupportRooms.delete(roomKey);
        }
      });
    });
  });
};
