import express from 'express';
import rateLimit from 'express-rate-limit';
import { verifyFirebaseOrJwtAuth } from '../middleware/authFirebaseOrJwt.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import ConnectionRequest from '../models/ConnectionRequest.js';
import Conversation from '../models/Conversation.js';
import Block from '../models/Block.js';

const router = express.Router();

const normalizePair = (a, b) => [a.toString(), b.toString()].sort();
const toPairKey = (a, b) => normalizePair(a, b).join(':');

const ensureValidObjectId = (id, field = 'id') => {
  if (!id || !/^[a-f\d]{24}$/i.test(String(id))) {
    throw new AppError(`Invalid ${field}`, 400);
  }
};

const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many connection requests. Please slow down and try again later.'
  }
});

router.use(verifyFirebaseOrJwtAuth);

const createConnectionRequest = asyncHandler(async (req, res) => {
  const senderId = req.userId.toString();
  const { receiverId, requestType: rawRequestType = 'connection', requestMessage: rawRequestMessage = '' } = req.body;
  const requestType = String(rawRequestType || 'connection').trim().toLowerCase();
  const requestMessage = String(rawRequestMessage || '').trim();

  ensureValidObjectId(receiverId, 'receiverId');

  if (!['connection', 'chat'].includes(requestType)) {
    throw new AppError('Invalid request type', 400);
  }

  if (requestMessage.length > 240) {
    throw new AppError('Request message is too long', 400);
  }

  if (senderId === receiverId.toString()) {
    throw new AppError('Cannot send request to yourself', 400);
  }

  const [sender, receiver] = await Promise.all([
    User.findById(senderId).select('_id role status profile_approval_status privacy'),
    User.findById(receiverId).select('_id role status profile_approval_status privacy')
  ]);

  if (!sender || !receiver || sender.role !== 'user' || receiver.role !== 'user') {
    throw new AppError('User not available for connection requests', 404);
  }

  if (receiver.status !== 'active' || receiver.profile_approval_status !== 'approved') {
    throw new AppError('Receiver is not available for requests', 400);
  }

  if (receiver?.privacy?.allowRequests === false) {
    throw new AppError('This user is not accepting connection requests right now', 403);
  }

  const pairKey = toPairKey(senderId, receiverId);

  const [blockExists, lastMinuteRequest, existingConnection, pending] = await Promise.all([
    Block.findOne({
      $or: [
        { blockerId: senderId, blockedId: receiverId },
        { blockerId: receiverId, blockedId: senderId }
      ]
    }).lean(),
    ConnectionRequest.findOne({
      senderId,
      receiverId,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
    })
      .sort({ createdAt: -1 })
      .lean(),
    Connection.findOne({ pairKey }).lean(),
    ConnectionRequest.findOne({ pairKey, status: 'pending' }).lean()
  ]);

  if (blockExists) {
    throw new AppError('Connection request not allowed for this user', 403);
  }

  if (lastMinuteRequest) {
    throw new AppError('Please wait before sending another request to the same user', 429);
  }

  if (existingConnection) {
    return res.status(409).json({
      success: false,
      message: 'Users are already connected',
      data: { connected: true, pending: false }
    });
  }

  if (pending) {
    return res.status(409).json({
      success: false,
      message: 'Connection request already pending',
      data: {
        connected: false,
        pending: true,
        pendingRequest: pending
      }
    });
  }

  const request = await ConnectionRequest.create({
    senderId,
    receiverId,
    pairKey,
    requestType,
    requestMessage,
    status: 'pending'
  });

  const io = req.app?.locals?.io;
  if (io) {
    io.of('/notifications').to(`notifications:${receiverId.toString()}`).emit('chat_request_received', {
      requestId: request._id.toString(),
      requestType,
      requestMessage,
      senderId: senderId.toString(),
      timestamp: new Date().toISOString()
    });
  }

  return res.status(201).json({
    success: true,
    message: requestType === 'chat' ? 'Chat request sent' : 'Connection request sent',
    data: { request }
  });
});

// POST /api/connections/requests
router.post('/requests', requestLimiter, createConnectionRequest);

// Backward compatibility for older clients
router.post('/request', requestLimiter, createConnectionRequest);

// Prevent confusing 404 when wrong method is used
router.all('/requests', (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST /api/connections/requests with receiverId in body.'
    });
  }

  return res.status(404).json({
    success: false,
    message: 'Route /api/connections/requests not found'
  });
});

// GET /api/connections/requests/incoming
router.get('/requests/incoming', asyncHandler(async (req, res) => {
  const userId = req.userId.toString();

  const requests = await ConnectionRequest.find({
    receiverId: userId,
    status: 'pending'
  })
    .populate('senderId', '_id name email college course year profilePhoto avatarConfig bio verified_badge is_verified college_verification_status')
    .sort({ createdAt: -1 })
    .lean();

  return res.json({ success: true, data: { requests } });
}));

// GET /api/connections/requests/outgoing
router.get('/requests/outgoing', asyncHandler(async (req, res) => {
  const userId = req.userId.toString();

  const requests = await ConnectionRequest.find({
    senderId: userId,
    status: { $in: ['pending', 'accepted'] }
  })
    .populate('receiverId', '_id name email college course year profilePhoto avatarConfig bio verified_badge is_verified college_verification_status')
    .sort({ createdAt: -1 })
    .lean();

  const pairKeys = requests.map((item) => item.pairKey).filter(Boolean);
  const conversations = pairKeys.length
    ? await Conversation.find({ participantKey: { $in: pairKeys } }).select('_id participantKey').lean()
    : [];

  const conversationByPairKey = new Map(conversations.map((item) => [item.participantKey, item._id]));
  const enriched = requests.map((item) => ({
    ...item,
    conversationId: conversationByPairKey.get(item.pairKey) || null
  }));

  return res.json({ success: true, data: { requests: enriched } });
}));

// POST /api/connections/requests/:requestId/accept
router.post('/requests/:requestId/accept', asyncHandler(async (req, res) => {
  const userId = req.userId.toString();
  const { requestId } = req.params;

  ensureValidObjectId(requestId, 'requestId');

  const request = await ConnectionRequest.findById(requestId);
  if (!request) {
    throw new AppError('Connection request not found', 404);
  }

  if (request.receiverId.toString() !== userId) {
    throw new AppError('Not allowed to accept this request', 403);
  }

  if (request.status !== 'pending') {
    throw new AppError(`Request already ${request.status}`, 400);
  }

  request.status = 'accepted';
  request.actedAt = new Date();
  await request.save();

  const [userA, userB] = normalizePair(request.senderId, request.receiverId);
  const pairKey = toPairKey(userA, userB);

  const connection = await Connection.findOneAndUpdate(
    { pairKey },
    {
      $setOnInsert: {
        userA,
        userB,
        pairKey
      }
    },
    { new: true, upsert: true }
  );

  const conversation = await Conversation.findOneAndUpdate(
    { participantKey: pairKey },
    {
      $setOnInsert: {
        participants: [userA, userB],
        participantKey: pairKey,
        lastMessage: '',
        lastMessageTime: null,
        isBlocked: false,
        blockedBy: null
      }
    },
    { new: true, upsert: true }
  );

  const io = req.app?.locals?.io;
  if (io) {
    io.of('/notifications').to(`notifications:${request.senderId.toString()}`).emit('chat_request_updated', {
      requestId: request._id.toString(),
      status: 'accepted',
      requestType: request.requestType || 'connection',
      conversationId: conversation?._id?.toString?.() || null,
      actedBy: userId,
      timestamp: new Date().toISOString()
    });
  }

  return res.json({
    success: true,
    message: request.requestType === 'chat' ? 'Chat request accepted. Conversation unlocked' : 'Connection request accepted',
    data: {
      request,
      connection,
      conversation,
      requestType: request.requestType || 'connection',
      chatUnlocked: true
    }
  });
}));

// POST /api/connections/requests/:requestId/decline
router.post('/requests/:requestId/decline', asyncHandler(async (req, res) => {
  const userId = req.userId.toString();
  const { requestId } = req.params;

  ensureValidObjectId(requestId, 'requestId');

  const request = await ConnectionRequest.findById(requestId);
  if (!request) {
    throw new AppError('Connection request not found', 404);
  }

  if (request.receiverId.toString() !== userId) {
    throw new AppError('Not allowed to decline this request', 403);
  }

  if (request.status !== 'pending') {
    throw new AppError(`Request already ${request.status}`, 400);
  }

  request.status = 'declined';
  request.actedAt = new Date();
  await request.save();

  const io = req.app?.locals?.io;
  if (io) {
    io.of('/notifications').to(`notifications:${request.senderId.toString()}`).emit('chat_request_updated', {
      requestId: request._id.toString(),
      status: 'declined',
      requestType: request.requestType || 'connection',
      conversationId: null,
      actedBy: userId,
      timestamp: new Date().toISOString()
    });
  }

  return res.json({ success: true, message: 'Connection request declined', data: { request } });
}));

// POST /api/connections/requests/:requestId/cancel
router.post('/requests/:requestId/cancel', asyncHandler(async (req, res) => {
  const userId = req.userId.toString();
  const { requestId } = req.params;

  ensureValidObjectId(requestId, 'requestId');

  const request = await ConnectionRequest.findById(requestId);
  if (!request) {
    throw new AppError('Connection request not found', 404);
  }

  if (request.senderId.toString() !== userId) {
    throw new AppError('Not allowed to cancel this request', 403);
  }

  if (request.status !== 'pending') {
    throw new AppError(`Request already ${request.status}`, 400);
  }

  request.status = 'cancelled';
  request.actedAt = new Date();
  await request.save();

  const io = req.app?.locals?.io;
  if (io) {
    io.of('/notifications').to(`notifications:${request.receiverId.toString()}`).emit('chat_request_updated', {
      requestId: request._id.toString(),
      status: 'cancelled',
      requestType: request.requestType || 'connection',
      conversationId: null,
      actedBy: userId,
      timestamp: new Date().toISOString()
    });
  }

  return res.json({ success: true, message: 'Connection request cancelled', data: { request } });
}));

// GET /api/connections
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.userId.toString();

  const connections = await Connection.find({
    $or: [{ userA: userId }, { userB: userId }]
  })
    .populate('userA', '_id name email college course year profilePhoto avatarConfig verified_badge is_verified college_verification_status')
    .populate('userB', '_id name email college course year profilePhoto avatarConfig verified_badge is_verified college_verification_status')
    .sort({ createdAt: -1 })
    .lean();

  const data = connections.map((item) => ({
    ...item,
    participant: item.userA?._id?.toString() === userId ? item.userB : item.userA
  }));

  return res.json({ success: true, data: { connections: data } });
}));

// GET /api/connections/status/:targetUserId
router.get('/status/:targetUserId', asyncHandler(async (req, res) => {
  const userId = req.userId.toString();
  const { targetUserId } = req.params;

  ensureValidObjectId(targetUserId, 'targetUserId');

  if (userId === targetUserId) {
    return res.json({ success: true, data: { connected: false, pending: false, canRequest: false, reason: 'self' } });
  }

  const pairKey = toPairKey(userId, targetUserId);
  const [connection, pendingRequest, block] = await Promise.all([
    Connection.findOne({ pairKey }).lean(),
    ConnectionRequest.findOne({ pairKey, status: 'pending' }).lean(),
    Block.findOne({
      $or: [
        { blockerId: userId, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: userId }
      ]
    }).lean()
  ]);

  return res.json({
    success: true,
    data: {
      connected: Boolean(connection),
      pending: Boolean(pendingRequest),
      blocked: Boolean(block),
      canRequest: !connection && !pendingRequest && !block,
      pendingDirection: pendingRequest
        ? pendingRequest.senderId.toString() === userId ? 'outgoing' : 'incoming'
        : null,
      requestId: pendingRequest?._id || null
    }
  });
}));

export default router;
