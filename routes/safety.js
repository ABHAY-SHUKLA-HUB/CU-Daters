import express from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { verifyFirebaseOrJwtAuth } from '../middleware/authFirebaseOrJwt.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import User from '../models/User.js';
import Block from '../models/Block.js';
import Report from '../models/Report.js';
import Conversation from '../models/Conversation.js';
import ConnectionRequest from '../models/ConnectionRequest.js';
import ModerationCase from '../models/ModerationCase.js';
import AppealRequest from '../models/AppealRequest.js';
import DataDeletionRequest from '../models/DataDeletionRequest.js';
import PrivacyEvent from '../models/PrivacyEvent.js';
import { sendAdminSecurityNotification } from '../socket/notificationSocket.js';

const router = express.Router();

const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many report actions in a short time. Please wait before submitting more reports.'
  }
});

const normalizePair = (a, b) => [a.toString(), b.toString()].sort();
const toPairKey = (a, b) => normalizePair(a, b).join(':');

const ensureValidObjectId = (id, field = 'id') => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${field}`, 400);
  }
};

router.use(verifyFirebaseOrJwtAuth);

// GET /api/safety/blocks
router.get('/blocks', asyncHandler(async (req, res) => {
  const userId = req.userId.toString();

  const rows = await Block.find({ blockerId: userId })
    .populate('blockedId', '_id name college year course profilePhoto avatarConfig verified_badge college_verification_status')
    .sort({ createdAt: -1 })
    .lean();

  const blockedUsers = rows.map((row) => ({
    _id: row._id,
    blockedAt: row.createdAt,
    reason: row.reason || '',
    user: row.blockedId
  }));

  return res.json({ success: true, data: { blockedUsers } });
}));

// POST /api/safety/block/:targetUserId
router.post('/block/:targetUserId', asyncHandler(async (req, res) => {
  const userId = req.userId.toString();
  const { targetUserId } = req.params;
  const { reason = '' } = req.body || {};

  ensureValidObjectId(targetUserId, 'targetUserId');

  if (userId === targetUserId) {
    throw new AppError('Cannot block yourself', 400);
  }

  const target = await User.findById(targetUserId).select('_id role');
  if (!target || target.role !== 'user') {
    throw new AppError('Target user not found', 404);
  }

  const pairKey = toPairKey(userId, targetUserId);

  const block = await Block.findOneAndUpdate(
    { blockerId: userId, blockedId: targetUserId },
    { $set: { pairKey, reason: String(reason || '').trim() } },
    { upsert: true, new: true }
  );

  await ConnectionRequest.updateMany(
    {
      pairKey,
      status: 'pending'
    },
    {
      $set: {
        status: 'cancelled',
        actedAt: new Date()
      }
    }
  );

  await Conversation.updateMany(
    {
      participantKey: pairKey
    },
    {
      $set: {
        isBlocked: true,
        blockedBy: userId
      }
    }
  );

  return res.json({
    success: true,
    message: 'User blocked successfully',
    data: { block }
  });
}));

// DELETE /api/safety/block/:targetUserId
router.delete('/block/:targetUserId', asyncHandler(async (req, res) => {
  const userId = req.userId.toString();
  const { targetUserId } = req.params;

  ensureValidObjectId(targetUserId, 'targetUserId');

  const result = await Block.deleteOne({ blockerId: userId, blockedId: targetUserId });

  return res.json({
    success: true,
    message: result.deletedCount ? 'User unblocked successfully' : 'User was not blocked'
  });
}));

// POST /api/safety/report
router.post('/report', reportLimiter, asyncHandler(async (req, res) => {
  const reporterId = req.userId.toString();
  const {
    targetUserId,
    targetType = 'user',
    targetId = '',
    reason,
    details = ''
  } = req.body || {};

  ensureValidObjectId(targetUserId, 'targetUserId');

  if (!reason || String(reason).trim().length < 3) {
    throw new AppError('Report reason is required', 400);
  }

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const reportCount24h = await Report.countDocuments({
    reporter_id: reporterId,
    created_at: { $gte: last24h }
  });

  if (reportCount24h >= 50) {
    throw new AppError('Daily report limit reached. Please contact support for urgent safety concerns.', 429);
  }

  const duplicateRecent = await Report.findOne({
    reporter_id: reporterId,
    target_user_id: targetUserId,
    reason: String(reason).trim(),
    created_at: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
  }).lean();

  if (duplicateRecent) {
    throw new AppError('Duplicate report detected. Please wait before sending the same report again.', 429);
  }

  if (reporterId === targetUserId) {
    throw new AppError('Cannot report yourself', 400);
  }

  const report = await Report.create({
    reporter_id: reporterId,
    target_user_id: targetUserId,
    target_type: targetType,
    target_id: String(targetId || '').trim(),
    reason: String(reason).trim(),
    details: String(details || '').trim(),
    status: 'open',
    priority: 'medium'
  });

  await ModerationCase.create({
    sourceType: 'report',
    sourceId: report._id.toString(),
    targetUserId,
    severity: ['violence', 'threat', 'sexual_abuse', 'blackmail'].includes(String(reason).toLowerCase()) ? 'high' : 'medium',
    status: 'open',
    summary: `Report created: ${String(reason).trim()}`,
    dueAt: new Date(Date.now() + (String(reason).toLowerCase().includes('threat') ? 4 : 24) * 60 * 60 * 1000)
  });

  const io = req.app?.locals?.io;
  if (io) {
    sendAdminSecurityNotification(io, {
      type: 'new_report',
      severity: ['violence', 'threat', 'sexual_abuse', 'blackmail'].includes(String(reason).toLowerCase()) ? 'high' : 'medium',
      message: `New user report filed: ${String(reason).trim()}`,
      reportId: report._id,
      targetUserId
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Report submitted. Our moderation team will review it.',
    data: { report }
  });
}));

router.get('/privacy-notice', asyncHandler(async (_req, res) => {
  return res.json({
    success: true,
    data: {
      screenshotProtection: {
        web: 'Screenshots cannot be fully prevented on web. Suspicious capture events may be monitored where supported.',
        android: 'On supported Android versions, secure-screen and screenshot callbacks may be applied in sensitive views.',
        ios: 'On supported iOS versions, capture-state signals may be available for sensitive views.'
      },
      consentNotice: 'Privacy and screenshot event handling is best-effort and platform-limited. It is used for abuse prevention and trust & safety investigations.'
    }
  });
}));

router.post('/privacy-events', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const {
    eventType,
    conversationId = null,
    platform = 'web',
    supportedSignal = false,
    metadata = {},
    consentContext = ''
  } = req.body || {};

  const allowed = ['screenshot_detected', 'screen_recording_detected', 'printscreen_key', 'chat_sensitive_view'];
  if (!allowed.includes(String(eventType))) {
    throw new AppError('Invalid privacy event type', 400);
  }

  if (conversationId && !mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new AppError('Invalid conversationId', 400);
  }

  const event = await PrivacyEvent.create({
    userId,
    conversationId: conversationId || null,
    eventType,
    platform: ['web', 'android', 'ios', 'unknown'].includes(String(platform)) ? platform : 'unknown',
    supportedSignal: Boolean(supportedSignal),
    metadata,
    consentContext: String(consentContext || '').slice(0, 500),
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown'
  });

  if (conversationId) {
    const convo = await Conversation.findById(conversationId).lean();
    if (convo?.participants?.length) {
      const otherUserId = convo.participants.find((id) => String(id) !== String(userId));
      if (otherUserId) {
        await ModerationCase.create({
          sourceType: 'privacy_event',
          sourceId: event._id.toString(),
          targetUserId: otherUserId,
          severity: eventType === 'screen_recording_detected' ? 'high' : 'medium',
          status: 'open',
          summary: `Privacy event: ${eventType}`,
          dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      }
    }
  }

  const io = req.app?.locals?.io;
  if (io) {
    sendAdminSecurityNotification(io, {
      type: 'privacy_event',
      severity: eventType === 'screen_recording_detected' ? 'high' : 'medium',
      message: `Privacy event detected: ${eventType}`,
      eventId: event._id,
      conversationId: conversationId || null
    });
  }

  return res.status(201).json({ success: true, message: 'Privacy event recorded', data: { eventId: event._id } });
}));

router.post('/appeals', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { relatedAction, relatedEntityId = '', reason } = req.body || {};

  if (!relatedAction || !String(relatedAction).trim()) {
    throw new AppError('relatedAction is required', 400);
  }

  if (!reason || String(reason).trim().length < 10) {
    throw new AppError('Appeal reason must be at least 10 characters', 400);
  }

  const appeal = await AppealRequest.create({
    userId,
    relatedAction: String(relatedAction).toLowerCase().trim(),
    relatedEntityId: String(relatedEntityId || ''),
    reason: String(reason).trim(),
    status: 'pending'
  });

  await ModerationCase.create({
    sourceType: 'appeal',
    sourceId: appeal._id.toString(),
    targetUserId: userId,
    severity: 'medium',
    status: 'open',
    summary: `Appeal submitted: ${appeal.relatedAction}`,
    dueAt: new Date(Date.now() + 72 * 60 * 60 * 1000)
  });

  return res.status(201).json({ success: true, message: 'Appeal submitted', data: { appeal } });
}));

router.get('/appeals/my', asyncHandler(async (req, res) => {
  const rows = await AppealRequest.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return res.json({ success: true, data: { appeals: rows } });
}));

router.post('/deletion-request', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { reason = '' } = req.body || {};

  const existingPending = await DataDeletionRequest.findOne({ userId, status: { $in: ['pending', 'approved'] } }).lean();
  if (existingPending) {
    throw new AppError('A data deletion request is already pending', 409);
  }

  const request = await DataDeletionRequest.create({
    userId,
    status: 'pending',
    reason: String(reason || '').trim(),
    retentionDays: 30,
    scheduledFor: null
  });

  await ModerationCase.create({
    sourceType: 'system_alert',
    sourceId: request._id.toString(),
    targetUserId: userId,
    severity: 'medium',
    status: 'open',
    summary: 'User requested account/data deletion',
    dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  return res.status(201).json({
    success: true,
    message: 'Data deletion request submitted. Support team will review retention/legal constraints before deletion.',
    data: { request }
  });
}));

router.get('/deletion-request', asyncHandler(async (req, res) => {
  const rows = await DataDeletionRequest.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return res.json({ success: true, data: { requests: rows } });
}));

// GET /api/safety/privacy
router.get('/privacy', asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).select('privacy verified_badge college_verification_status is_verified college_verified_at');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return res.json({
    success: true,
    data: {
      privacy: user.privacy,
      verification: {
        isVerified: Boolean(user.is_verified),
        verifiedBadge: Boolean(user.verified_badge),
        collegeVerificationStatus: user.college_verification_status,
        collegeVerifiedAt: user.college_verified_at || null
      }
    }
  });
}));

// PUT /api/safety/privacy
router.put('/privacy', asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const incoming = req.body || {};
  const nextPrivacy = {
    ...user.privacy?.toObject?.(),
    ...user.privacy,
    ...(incoming.profileVisibility ? { profileVisibility: incoming.profileVisibility } : {}),
    ...(incoming.showOnlineStatus !== undefined ? { showOnlineStatus: Boolean(incoming.showOnlineStatus) } : {}),
    ...(incoming.allowDiscovery !== undefined ? { allowDiscovery: Boolean(incoming.allowDiscovery) } : {}),
    ...(incoming.allowRequests !== undefined ? { allowRequests: Boolean(incoming.allowRequests) } : {}),
    ...(incoming.showVerifiedBadge !== undefined ? { showVerifiedBadge: Boolean(incoming.showVerifiedBadge) } : {})
  };

  user.privacy = nextPrivacy;
  await user.save();

  return res.json({
    success: true,
    message: 'Privacy settings updated',
    data: { privacy: user.privacy }
  });
}));

// POST /api/safety/college-verification/request
router.post('/college-verification/request', asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const collegeEmail = String(req.body?.collegeEmail || '').trim().toLowerCase();
  if (!collegeEmail || !collegeEmail.includes('@')) {
    throw new AppError('Valid college email is required', 400);
  }

  user.collegeEmail = collegeEmail;
  user.college_verification_status = 'pending';
  await user.save();

  return res.json({
    success: true,
    message: 'College verification submitted and pending review',
    data: {
      collegeEmail: user.collegeEmail,
      collegeVerificationStatus: user.college_verification_status
    }
  });
}));

export default router;
