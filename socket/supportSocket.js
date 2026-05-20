import SupportTicket from '../models/SupportTicket.js';
import SupportMessage from '../models/SupportMessage.js';
import SupportNotification from '../models/SupportNotification.js';
import SupportAILog from '../models/SupportAILog.js';
import User from '../models/User.js';
import { verifyToken } from '../utils/auth.js';
import { verifyFirebaseIdToken } from '../utils/firebaseAdmin.js';
import aiSupportAgent from '../services/aiSupportAgent.js';

const onlineSupportAdmins = new Map(); // { adminId: Set of socketIds }
const activeSupportRooms = new Map(); // { requestId: Set of socketIds }
const supportTimers = new Map(); // { requestId: timeoutId }
const connectedUsers = new Map(); // { userId: socketId }

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

// Timer management functions
const startSupportTimer = async (io, supportNamespace, requestId, TIMER_DURATION = 5 * 60 * 1000) => {
  try {
    // Clear any existing timer
    if (supportTimers.has(requestId)) {
      clearTimeout(supportTimers.get(requestId));
    }

    // Set new timer
    const timeoutId = setTimeout(async () => {
      try {
        const request = await SupportTicket.findById(requestId);
        if (request && request.status === 'pending' && request.timerActive) {
          // Auto-expire the request
          request.status = 'expired';
          request.timerActive = false;
          request.expired_at = new Date();
          request.aiActive = false;
          await request.save();

          // Notify user
          const roomKey = `support:${requestId}`;
          supportNamespace.to(roomKey).emit('support_request_expired', {
            requestId,
            message: 'Support request session has expired. Please create a new request.'
          });

          // Notify admin
          supportNamespace.emit('support_request_expired_admin', {
            requestId,
            userId: request.user_id.toString()
          });

          // Create notification
          await SupportNotification.create({
            user_id: request.user_id,
            support_ticket_id: requestId,
            type: 'ticket_expired',
            title: 'Support Request Expired',
            message: 'Your support request has expired. Please create a new request.'
          });

          supportTimers.delete(requestId);
        }
      } catch (error) {
        // Error in auto-expiring support request
      }
    }, TIMER_DURATION);

    supportTimers.set(requestId, timeoutId);
  } catch (error) {
    // Error starting support timer
  }
};

// Send AI response
const sendAIResponse = async (io, supportNamespace, supportTicket, userMessage) => {
  try {
    const aiResult = await aiSupportAgent.generateAIResponse(supportTicket, userMessage);
    
    // Create AI message
    const aiMessage = await SupportMessage.create({
      support_ticket_id: supportTicket._id,
      sender_id: null,
      sender_type: 'ai',
      sender_name: 'SeeU Support AI',
      message: aiResult.response,
      delivered_at: new Date()
    });

    // Emit AI response to room
    const roomKey = `support:${supportTicket._id}`;
    supportNamespace.to(roomKey).emit('support_message', {
      _id: aiMessage._id,
      requestId: supportTicket._id.toString(),
      sender_id: null,
      sender_name: 'SeeU Support AI',
      sender_type: 'ai',
      message: aiResult.response,
      created_at: aiMessage.created_at,
      confidence_score: aiResult.confidence,
      urgency: aiResult.urgency
    });

    // Update AI message count
    supportTicket.aiMessages = (supportTicket.aiMessages || 0) + 1;
    supportTicket.aiSolvedIssue = !aiResult.shouldEscalate && aiResult.confidence > 80;
    
    if (aiResult.shouldEscalate || aiSupportAgent.shouldEscalateToHuman(userMessage)) {
      supportTicket.aiActive = false;
      supportTicket.aiSolvedIssue = false;
      
      // Notify admins that this needs human intervention
      supportNamespace.emit('support_requires_human', {
        requestId: supportTicket._id.toString(),
        userId: supportTicket.user_id.toString(),
        userName: supportTicket.userName,
        reason: 'User requested human support or AI unable to resolve',
        priority: aiResult.urgency === 'critical' ? 'urgent' : 'high'
      });
    }
    
    await supportTicket.save();

    return aiResult;
  } catch (error) {
    // Error sending AI response
  }
};

// Notify admin of new request
const notifyAdminOfNewRequest = async (io, supportNamespace, supportTicket) => {
  try {
    const onlineAdmins = Array.from(onlineSupportAdmins.keys());
    
    for (const adminId of onlineAdmins) {
      // Create notification
      await SupportNotification.create({
        user_id: adminId,
        support_ticket_id: supportTicket._id,
        type: 'request_received',
        title: 'New Support Request',
        message: `${supportTicket.userName} needs help with ${supportTicket.category}`
      });
    }

    // Emit to admin namespace
    supportNamespace.emit('new_support_request', {
      requestId: supportTicket._id.toString(),
      userId: supportTicket.user_id.toString(),
      userName: supportTicket.userName,
      userEmail: supportTicket.userEmail,
      category: supportTicket.category,
      description: supportTicket.description,
      priority: supportTicket.priority,
      timerStartedAt: supportTicket.timerStartedAt,
      expiresAt: supportTicket.expiresAt,
      createdAt: supportTicket.created_at
    });
  } catch (error) {
    // Error notifying admins
  }
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

        // Check status - allow messages if pending (with AI) or accepted
        if (!['pending', 'active'].includes(request.status)) {
          throw new Error('Support request is not active');
        }

        // Save user message
        const supportMessage = await SupportMessage.create({
          support_ticket_id: requestId,
          sender_id: userId,
          sender_type: isAdmin ? 'admin' : 'user',
          sender_name: socket.user.name,
          message: message.trim(),
          delivered_at: new Date()
        });

        // Update request timestamp
        request.updated_at = new Date();
        
        // If admin is accepting for the first time, stop AI and change status
        if (isAdmin && request.status === 'pending' && !request.admin_id) {
          request.status = 'active';
          request.admin_id = userId;
          request.assigned_to = userId;
          request.accepted_at = new Date();
          request.timerActive = false;
          request.aiActive = false;
          
          // Clear timer
          if (supportTimers.has(requestId)) {
            clearTimeout(supportTimers.get(requestId));
            supportTimers.delete(requestId);
          }
        }
        
        await request.save();

        // Emit message to all in the room
        const roomKey = `support:${requestId}`;
        supportNamespace.to(roomKey).emit('support_message', {
          _id: supportMessage._id,
          requestId: requestId.toString(),
          sender_id: userId,
          sender_name: socket.user.name,
          sender_type: isAdmin ? 'admin' : 'user',
          message: supportMessage.message,
          created_at: supportMessage.created_at,
          delivered: true
        });

        // If user sent a message and AI is still active, send AI response
        if (!isAdmin && request.aiActive && request.status === 'pending') {
          // Send AI response asynchronously
          setTimeout(async () => {
            await sendAIResponse(supportNamespace, request, message);
          }, 1000);
        }

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
        // Error in typing start
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
        // Error in typing stop
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

    // ============ NEW EVENTS FOR ADVANCED SUPPORT SYSTEM ============

    // Create support request (from user)
    socket.on('create_support_request', async ({ category, description, userName, userEmail, userUsername, attachments }, ack) => {
      try {
        if (!isAdmin && request.user_id.toString() !== userId) {
          // Create support ticket
          const newRequest = await SupportTicket.create({
            user_id: userId,
            category,
            description,
            status: 'pending',
            priority: 'medium',
            timerStartedAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            timerActive: true,
            aiActive: true,
            userName,
            userEmail,
            userUsername,
            attachments: attachments || []
          });

          await newRequest.save();

          // Start 5-minute timer
          await startSupportTimer(io, supportNamespace, newRequest._id.toString());

          // Send AI greeting
          const aiGreeting = aiSupportAgent.getGreeting(category);
          const aiMessage = await SupportMessage.create({
            support_ticket_id: newRequest._id,
            sender_type: 'ai',
            sender_name: 'SeeU Support AI',
            message: aiGreeting,
            delivered_at: new Date()
          });

          // Notify admins
          await notifyAdminOfNewRequest(io, supportNamespace, newRequest);

          // Emit to user
          socket.emit('support_request_created', {
            requestId: newRequest._id.toString(),
            status: newRequest.status,
            expiresAt: newRequest.expiresAt,
            aiGreeting
          });

          if (ack) {
            ack({ ok: true, requestId: newRequest._id.toString() });
          }
        } else {
          throw new Error('Unauthorized to create support request');
        }
      } catch (error) {
        if (ack) {
          ack({ ok: false, message: error.message });
        }
      }
    });

    // Admin accept support request
    socket.on('admin_accept_request', async ({ requestId }, ack) => {
      try {
        if (!isAdmin) {
          throw new Error('Only admins can accept requests');
        }

        const request = await SupportTicket.findById(requestId);
        if (!request) {
          throw new Error('Support request not found');
        }

        if (request.status !== 'pending') {
          throw new Error('Request is not pending');
        }

        // Update request
        request.status = 'active';
        request.admin_id = userId;
        request.assigned_to = userId;
        request.accepted_at = new Date();
        request.timerActive = false;
        request.aiActive = false;
        await request.save();

        // Clear timer
        if (supportTimers.has(requestId)) {
          clearTimeout(supportTimers.get(requestId));
          supportTimers.delete(requestId);
        }

        // Notify all parties
        const roomKey = `support:${requestId}`;
        supportNamespace.to(roomKey).emit('admin_accepted_request', {
          requestId: requestId.toString(),
          adminName: socket.user.name,
          adminId: userId,
          message: `${socket.user.name} has joined the conversation`
        });

        // Create notification
        await SupportNotification.create({
          user_id: request.user_id,
          support_ticket_id: requestId,
          type: 'admin_accepted',
          title: 'Support Agent Joined',
          message: `${socket.user.name} is now helping you`
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

    // Admin reject request
    socket.on('admin_reject_request', async ({ requestId, reason }, ack) => {
      try {
        if (!isAdmin) {
          throw new Error('Only admins can reject requests');
        }

        const request = await SupportTicket.findById(requestId);
        if (!request) {
          throw new Error('Support request not found');
        }

        // Update request
        request.status = 'expired';
        request.rejection_reason = reason;
        request.expired_at = new Date();
        request.timerActive = false;
        await request.save();

        // Notify user
        const roomKey = `support:${requestId}`;
        supportNamespace.to(roomKey).emit('support_request_rejected', {
          requestId: requestId.toString(),
          reason: reason || 'Request could not be processed'
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

    // Resolve/Close support ticket
    socket.on('resolve_support_ticket', async ({ requestId, resolutionNote }, ack) => {
      try {
        if (!isAdmin) {
          throw new Error('Only admins can resolve tickets');
        }

        const request = await SupportTicket.findById(requestId);
        if (!request) {
          throw new Error('Support request not found');
        }

        // Update request
        request.status = 'resolved';
        request.resolution_note = resolutionNote;
        request.resolved_at = new Date();
        await request.save();

        // Notify all parties
        const roomKey = `support:${requestId}`;
        supportNamespace.to(roomKey).emit('support_ticket_resolved', {
          requestId: requestId.toString(),
          resolutionNote,
          message: 'This support ticket has been resolved'
        });

        // Create notification
        await SupportNotification.create({
          user_id: request.user_id,
          support_ticket_id: requestId,
          type: 'ticket_resolved',
          title: 'Support Ticket Resolved',
          message: 'Thank you for contacting us. Your ticket has been resolved.'
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

    // Get unread count for admin
    socket.on('get_unread_count', async (ack) => {
      try {
        if (!isAdmin) {
          throw new Error('Only admins can get unread count');
        }

        const unreadCount = await SupportNotification.countDocuments({
          user_id: userId,
          read: false
        });

        if (ack) {
          ack({ ok: true, unreadCount });
        }
      } catch (error) {
        if (ack) {
          ack({ ok: false, message: error.message });
        }
      }
    });

    // Play notification sound (client acknowledges)
    socket.on('notification_sound_played', async ({ requestId }) => {
      try {
        await SupportNotification.updateMany(
          { support_ticket_id: requestId, notification_sound_played: false },
          { notification_sound_played: true }
        );
      } catch (error) {
        // Error updating notification sound status
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
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
