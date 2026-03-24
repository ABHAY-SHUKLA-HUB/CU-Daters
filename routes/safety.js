import express from 'express';
import mongoose from 'mongoose';
import { verifyFirebaseOrJwtAuth } from '../middleware/authFirebaseOrJwt.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import User from '../models/User.js';
import Block from '../models/Block.js';
import Report from '../models/Report.js';
import Conversation from '../models/Conversation.js';
import ConnectionRequest from '../models/ConnectionRequest.js';

const router = express.Router();

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
router.post('/report', asyncHandler(async (req, res) => {
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

  return res.status(201).json({
    success: true,
    message: 'Report submitted. Our moderation team will review it.',
    data: { report }
  });
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
