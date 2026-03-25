import Conversation from '../models/Conversation.js';
import Connection from '../models/Connection.js';
import Block from '../models/Block.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { verifyToken } from '../utils/auth.js';
import { verifyFirebaseIdToken } from '../utils/firebaseAdmin.js';

const onlineSocketsByUser = new Map();

const normalizePair = (a, b) => [a.toString(), b.toString()].sort();
const MAX_MESSAGE_LENGTH = 2000;

const addOnlineSocket = (userId, socketId) => {
  const current = onlineSocketsByUser.get(userId) || new Set();
  current.add(socketId);
  onlineSocketsByUser.set(userId, current);
};

const removeOnlineSocket = (userId, socketId) => {
  const current = onlineSocketsByUser.get(userId);
  if (!current) {
    return;
  }

  current.delete(socketId);
  if (!current.size) {
    onlineSocketsByUser.delete(userId);
  }
};

const isOnline = (userId) => onlineSocketsByUser.has(userId);

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

const ensureParticipant = (conversation, userId) =>
  conversation.participants.some((participantId) => participantId.toString() === userId.toString());

const ensureConnected = async (userId, partnerId) => {
  const users = normalizePair(userId, partnerId);
  const pairKey = users.join(':');
  const connection = await Connection.findOne({ pairKey }).lean();
  return Boolean(connection);
};

const ensureNotBlocked = async (userId, partnerId) => {
  const blocked = await Block.findOne({
    $or: [
      { blockerId: userId, blockedId: partnerId },
      { blockerId: partnerId, blockedId: userId }
    ]
  }).lean();
  return !blocked;
};

export const registerChatSocket = (io) => {
  io.use(async (socket, next) => {
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
    } catch {
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const joinedConversations = new Set();

    addOnlineSocket(userId, socket.id);
    User.findByIdAndUpdate(userId, { $set: { last_active_at: new Date() } }).catch(() => null);
    socket.join(`user:${userId}`);
    io.emit('user_online', { userId });

    socket.on('join_chat', async ({ conversationId }, ack) => {
      try {
        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation || !ensureParticipant(conversation, userId)) {
          throw new Error('Unauthorized conversation join');
        }

        const [a, b] = conversation.participants.map((id) => id.toString());
        const partnerId = a === userId ? b : a;
        const matched = await ensureConnected(userId, partnerId);
        const notBlocked = await ensureNotBlocked(userId, partnerId);

        if (!matched || !notBlocked || conversation.isBlocked) {
          throw new Error('Chat is unavailable');
        }

        socket.join(`chat:${conversationId}`);
        joinedConversations.add(conversationId.toString());

        if (ack) {
          ack({ ok: true });
        }
      } catch (error) {
        if (ack) {
          ack({ ok: false, message: error.message });
        }
      }
    });

    socket.on('send_message', async (_, ack) => {
      if (ack) {
        ack({
          ok: false,
          code: 'HTTP_GATEWAY_REQUIRED',
          message: 'Message persistence is HTTP-authoritative. Use POST /api/chat/conversations/:id/messages.'
        });
      }
    });

    socket.on('typing_start', async ({ conversationId }) => {
      const normalizedId = conversationId?.toString();
      if (!normalizedId || !joinedConversations.has(normalizedId)) {
        return;
      }

      socket.to(`chat:${conversationId}`).emit('typing_start', {
        conversationId,
        userId
      });
    });

    socket.on('typing_stop', async ({ conversationId }) => {
      const normalizedId = conversationId?.toString();
      if (!normalizedId || !joinedConversations.has(normalizedId)) {
        return;
      }

      socket.to(`chat:${conversationId}`).emit('typing_stop', {
        conversationId,
        userId
      });
    });

    socket.on('message_seen', async ({ conversationId }, ack) => {
      try {
        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation || !ensureParticipant(conversation, userId)) {
          throw new Error('Unauthorized conversation access');
        }

        const result = await Message.updateMany(
          {
            conversationId,
            receiverId: userId,
            seen: false
          },
          { $set: { seen: true, deliveryStatus: 'seen', delivered: true } }
        );

        socket.to(`chat:${conversationId}`).emit('message_seen', {
          conversationId,
          seenBy: userId,
          modifiedCount: result.modifiedCount
        });

        if (ack) {
          ack({ ok: true, modifiedCount: result.modifiedCount });
        }
      } catch (error) {
        if (ack) {
          ack({ ok: false, message: error.message });
        }
      }
    });

    socket.on('call_offer', async ({ conversationId, callId, mode = 'voice' }, ack) => {
      try {
        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation || !ensureParticipant(conversation, userId)) {
          throw new Error('Unauthorized conversation access');
        }

        if (conversation.isBlocked) {
          throw new Error('Chat is unavailable');
        }

        const [a, b] = conversation.participants.map((id) => id.toString());
        const partnerId = a === userId ? b : a;
        const connected = await ensureConnected(userId, partnerId);
        const notBlocked = await ensureNotBlocked(userId, partnerId);
        if (!connected || !notBlocked) {
          throw new Error('Chat is unavailable');
        }

        const payload = {
          conversationId: conversationId?.toString?.() || conversationId,
          callId,
          mode,
          fromUserId: userId,
          fromName: socket.user?.name || 'User'
        };

        io.to(`chat:${payload.conversationId}`).emit('call_offer', payload);
        io.to(`user:${payload.fromUserId}`).emit('call_offer', payload);

        if (ack) {
          ack({ ok: true });
        }
      } catch (error) {
        if (ack) {
          ack({ ok: false, message: error.message });
        }
      }
    });

    socket.on('call_answer', async ({ conversationId, callId, mode = 'voice' }, ack) => {
      try {
        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation || !ensureParticipant(conversation, userId)) {
          throw new Error('Unauthorized conversation access');
        }

        const [a, b] = conversation.participants.map((id) => id.toString());
        const partnerId = a === userId ? b : a;
        const connected = await ensureConnected(userId, partnerId);
        const notBlocked = await ensureNotBlocked(userId, partnerId);
        if (!connected || !notBlocked) {
          throw new Error('Chat is unavailable');
        }

        const payload = {
          conversationId: conversationId?.toString?.() || conversationId,
          callId,
          mode,
          fromUserId: userId
        };

        io.to(`chat:${payload.conversationId}`).emit('call_answer', payload);

        if (ack) {
          ack({ ok: true });
        }
      } catch (error) {
        if (ack) {
          ack({ ok: false, message: error.message });
        }
      }
    });

    socket.on('call_reject', async ({ conversationId, callId, mode = 'voice' }, ack) => {
      try {
        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation || !ensureParticipant(conversation, userId)) {
          throw new Error('Unauthorized conversation access');
        }

        const [a, b] = conversation.participants.map((id) => id.toString());
        const partnerId = a === userId ? b : a;
        const connected = await ensureConnected(userId, partnerId);
        const notBlocked = await ensureNotBlocked(userId, partnerId);
        if (!connected || !notBlocked) {
          throw new Error('Chat is unavailable');
        }

        const payload = {
          conversationId: conversationId?.toString?.() || conversationId,
          callId,
          mode,
          fromUserId: userId
        };

        io.to(`chat:${payload.conversationId}`).emit('call_reject', payload);

        if (ack) {
          ack({ ok: true });
        }
      } catch (error) {
        if (ack) {
          ack({ ok: false, message: error.message });
        }
      }
    });

    socket.on('call_end', async ({ conversationId, callId, mode = 'voice' }, ack) => {
      try {
        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation || !ensureParticipant(conversation, userId)) {
          throw new Error('Unauthorized conversation access');
        }

        const payload = {
          conversationId: conversationId?.toString?.() || conversationId,
          callId,
          mode,
          fromUserId: userId
        };

        io.to(`chat:${payload.conversationId}`).emit('call_end', payload);

        if (ack) {
          ack({ ok: true });
        }
      } catch (error) {
        if (ack) {
          ack({ ok: false, message: error.message });
        }
      }
    });

    socket.on('disconnect', () => {
      removeOnlineSocket(userId, socket.id);
      if (!isOnline(userId)) {
        User.findByIdAndUpdate(userId, { $set: { last_active_at: new Date() } }).catch(() => null);
        io.emit('user_offline', { userId });
      }
    });
  });
};

export default registerChatSocket;
