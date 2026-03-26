// socket/notificationSocket.js - Real-time notifications for likes
import Like from '../models/Like.js';
import User from '../models/User.js';
import { verifyToken } from '../utils/auth.js';
import { verifyFirebaseIdToken } from '../utils/firebaseAdmin.js';

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

export const registerNotificationSocket = (io) => {
  io.of('/notifications').use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      const user = await resolveSocketUser(token);
      if (!user) {
        return next(new Error('Unauthorized notification socket'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Notification socket auth error:', error);
      next(new Error('Notification socket auth failed'));
    }
  });

  io.of('/notifications').on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const role = String(socket.user.role || '').toLowerCase();

    // Join user-specific room for notifications
    socket.join(`notifications:${userId}`);

    if (['admin', 'super_admin', 'moderator', 'finance_admin', 'support_admin', 'analyst'].includes(role)) {
      socket.join('notifications:admins');
    }
    console.log(`✓ User ${userId} connected to notifications`);

    socket.on('disconnect', () => {
      console.log(`✗ User ${userId} disconnected from notifications`);
    });
  });

  return io;
};

/**
 * Send like notification to a user
 */
export const sendLikeNotification = (io, likedUserId, likerName, likeId) => {
  try {
    io.of('/notifications').to(`notifications:${likedUserId}`).emit('new_like', {
      message: `${likerName} liked your profile!`,
      likeId: likeId,
      likerName: likerName,
      timestamp: new Date().toISOString()
    });
    console.log(`✓ Like notification sent to ${likedUserId}`);
  } catch (error) {
    console.error('Error sending like notification:', error);
  }
};

/**
 * Send match notification to both users
 */
export const sendMatchNotification = (io, userId1, user1Name, userId2, user2Name) => {
  try {
    // Notify first user
    io.of('/notifications').to(`notifications:${userId1}`).emit('new_match', {
      message: `You matched with ${user2Name}!`,
      matchedUserName: user2Name,
      timestamp: new Date().toISOString()
    });

    // Notify second user
    io.of('/notifications').to(`notifications:${userId2}`).emit('new_match', {
      message: `You matched with ${user1Name}!`,
      matchedUserName: user1Name,
      timestamp: new Date().toISOString()
    });

    console.log(`✓ Match notification sent to ${userId1} and ${userId2}`);
  } catch (error) {
    console.error('Error sending match notification:', error);
  }
};

export const sendAdminSecurityNotification = (io, payload = {}) => {
  try {
    io.of('/notifications').to('notifications:admins').emit('security_alert', {
      ...payload,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending admin security notification:', error);
  }
};

export const sendPrivacyCaptureNotification = (io, userId, payload = {}) => {
  try {
    io.of('/notifications').to(`notifications:${userId}`).emit('privacy_capture_alert', {
      ...payload,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending privacy capture notification:', error);
  }
};
