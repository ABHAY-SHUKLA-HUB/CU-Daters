import express from 'express';
import { verifyFirebaseOrJwtAuth } from '../middleware/authFirebaseOrJwt.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import Like from '../models/Like.js';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Conversation from '../models/Conversation.js';
import Connection from '../models/Connection.js';
import { sendLikeNotification, sendMatchNotification } from '../socket/notificationSocket.js';

const router = express.Router();

const normalizePair = (a, b) => [a.toString(), b.toString()].sort();

const DEFAULT_TAG = 'Friend';

const upsertUserSettings = (existing = [], userA, userB) => {
  const a = userA.toString();
  const b = userB.toString();
  const byUserId = new Map((existing || []).map((item) => [item.userId?.toString?.() || String(item.userId), item]));

  const ensure = (userId) => {
    const current = byUserId.get(userId) || {};
    return {
      userId,
      favorite: Boolean(current.favorite),
      muted: Boolean(current.muted),
      tag: current.tag || DEFAULT_TAG,
      updatedAt: current.updatedAt || new Date()
    };
  };

  return [ensure(a), ensure(b)];
};

const createOrReuseConversation = async (userA, userB) => {
  const participants = normalizePair(userA, userB);
  const participantKey = participants.join(':');

  try {
    const conversation = await Conversation.findOneAndUpdate(
      { participantKey },
      {
        $setOnInsert: {
          participants,
          participantKey,
          lastMessage: '',
          lastMessageTime: null
        }
      },
      { new: true, upsert: true }
    );
    return conversation;
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await Conversation.findOne({ participantKey });
      if (existing) {
        return existing;
      }
    }
    throw error;
  }
};

const createOrReuseMatch = async (userA, userB, requestedBy) => {
  const usersKey = normalizePair(userA, userB);
  const pairKey = usersKey.join(':');
  let match = await Match.findOne({ users: usersKey });

  if (!match) {
    match = await Match.create({
      users: usersKey,
      status: 'matched',
      requestedBy,
      matchedAt: new Date(),
      userSettings: upsertUserSettings([], userA, userB)
    });
    return match;
  }

  match.status = 'matched';
  match.requestedBy = requestedBy;
  match.unmatchedAt = null;
  match.unmatchedBy = null;
  match.matchedAt = new Date();
  match.userSettings = upsertUserSettings(match.userSettings || [], userA, userB);
  await match.save();

  await Connection.findOneAndUpdate(
    { pairKey },
    {
      $setOnInsert: {
        userA: usersKey[0],
        userB: usersKey[1],
        pairKey
      }
    },
    { new: true, upsert: true }
  );

  return match;
};

// ==========================================================================
// POST /api/likes/:targetUserId
// Like a user's profile
// ==========================================================================
router.post('/:targetUserId', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  const { targetUserId } = req.params;
  const likedByUserId = req.userId.toString();

  console.log('📍 Like API called:', { likedByUserId, targetUserId });

  // Prevent liking own profile
  if (likedByUserId === targetUserId) {
    console.warn('⚠️ User tried to like own profile');
    throw new AppError('Cannot like your own profile', 400);
  }

  // Check if target user exists and is not admin
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    console.warn('⚠️ Target user not found:', targetUserId);
    throw new AppError('User not found', 404);
  }

  if (['admin', 'super_admin', 'moderator'].includes(targetUser.role)) {
    console.warn('⚠️ Cannot like admin profile:', targetUserId);
    throw new AppError('Cannot like admin profiles', 400);
  }

  // Check if already liked
  const existingLike = await Like.findOne({
    likedBy: likedByUserId,
    likedUser: targetUserId
  });

  if (existingLike) {
    const reciprocalLike = await Like.findOne({
      likedBy: targetUserId,
      likedUser: likedByUserId,
      status: { $in: ['pending', 'accepted'] }
    });

    const matched = reciprocalLike || existingLike.status === 'accepted';
    if (matched) {
      const match = await createOrReuseMatch(likedByUserId, targetUserId, targetUserId);
      const conversation = await createOrReuseConversation(likedByUserId, targetUserId);
      await existingLike.populate('likedBy', 'name profilePhoto avatarConfig');

      return res.status(200).json({
        success: true,
        message: 'Like already recorded. Conversation is ready.',
        matched: true,
        like: existingLike,
        match,
        conversation
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Like already sent',
      matched: false,
      like: existingLike
    });
  }

  try {
    const reciprocalLike = await Like.findOne({
      likedBy: targetUserId,
      likedUser: likedByUserId,
      status: 'pending'
    });

    // Mutual like detected: resolve both likes as accepted and create chat-ready match state.
    if (reciprocalLike) {
      const now = new Date();

      const newLike = new Like({
        likedBy: likedByUserId,
        likedUser: targetUserId,
        status: 'accepted',
        actionAt: now,
        actionBy: likedByUserId,
        notificationSent: true
      });
      await newLike.save();

      reciprocalLike.status = 'accepted';
      reciprocalLike.actionAt = now;
      reciprocalLike.actionBy = likedByUserId;
      await reciprocalLike.save();

      const match = await createOrReuseMatch(likedByUserId, targetUserId, targetUserId);
      const conversation = await createOrReuseConversation(likedByUserId, targetUserId);

      await newLike.populate('likedBy', 'name profilePhoto avatarConfig');

      const currentUser = await User.findById(likedByUserId).select('name');
      const io = req.app?.locals?.io;
      if (io && currentUser) {
        sendMatchNotification(
          io,
          likedByUserId,
          currentUser.name,
          targetUserId,
          targetUser.name
        );
      }

      return res.status(201).json({
        success: true,
        message: 'It is a match! Conversation is ready.',
        matched: true,
        like: newLike,
        match,
        conversation
      });
    }

    // Create like record
    const newLike = new Like({
      likedBy: likedByUserId,
      likedUser: targetUserId,
      status: 'pending',
      notificationSent: false
    });

    await newLike.save();
    console.log('✓ Like saved:', newLike._id);

    // Populate data for response
    await newLike.populate('likedBy', 'name profilePhoto avatarConfig');
    
    // Get current user's name for notification
    const currentUser = await User.findById(likedByUserId);
    if (!currentUser) {
      console.warn('⚠️ Current user not found for notification:', likedByUserId);
    }
    
    // Send notification via socket.io if configured
    const io = req.app?.locals?.io;
    if (io && currentUser) {
      console.log('✓ Sending like notification to:', targetUserId);
      sendLikeNotification(io, targetUserId, currentUser.name, newLike._id);
    }

    res.status(201).json({
      success: true,
      message: 'Profile liked successfully',
      like: newLike
    });
  } catch (dbError) {
    if (dbError?.code === 11000) {
      const existing = await Like.findOne({ likedBy: likedByUserId, likedUser: targetUserId })
        .populate('likedBy', 'name profilePhoto avatarConfig');
      return res.status(200).json({
        success: true,
        message: 'Like already processed',
        matched: existing?.status === 'accepted',
        like: existing
      });
    }
    console.error('❌ Database error while saving like:', dbError);
    throw new AppError('Failed to save like. Please try again.', 500);
  }
}));

// ==========================================================================
// GET /api/likes/pending
// Get all pending likes for the current user
// ==========================================================================
router.get('/pending', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  const userId = req.userId.toString();

  const pendingLikes = await Like.find({
    likedUser: userId,
    status: 'pending'
  })
    .populate('likedBy', 'name profilePhoto avatarConfig bio gender college')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: pendingLikes.length,
    likes: pendingLikes
  });
}));

// ==========================================================================
// POST /api/likes/:likeId/accept
// Accept a like and create a match
// ==========================================================================
router.post('/:likeId/accept', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  const { likeId } = req.params;
  const userId = req.userId.toString();

  // Find the like
  const like = await Like.findById(likeId);
  if (!like) {
    throw new AppError('Like not found', 404);
  }

  // Verify current user is the one being liked
  if (like.likedUser.toString() !== userId) {
    throw new AppError('Unauthorized to accept this like', 403);
  }

  // Idempotent accept: if already accepted, just return existing match/conversation.
  if (like.status === 'accepted') {
    const match = await createOrReuseMatch(like.likedBy.toString(), like.likedUser.toString(), like.likedBy.toString());
    const conversation = await createOrReuseConversation(like.likedBy.toString(), like.likedUser.toString());
    await like.populate(['likedBy', 'likedUser']);

    return res.json({
      success: true,
      message: 'Like already accepted',
      like,
      match,
      conversation
    });
  }

  if (like.status !== 'pending') {
    throw new AppError(`Like already ${like.status}`, 400);
  }

  // Update like status
  like.status = 'accepted';
  like.actionAt = new Date();
  like.actionBy = userId;
  await like.save();

  // Create mutual match
  const [likedByUser, likedUser] = await Promise.all([
    User.findById(like.likedBy),
    User.findById(like.likedUser)
  ]);

  if (!likedByUser || !likedUser) {
    throw new AppError('User not found', 404);
  }

  // Create match (will be unique due to schema validation)
  const match = await createOrReuseMatch(like.likedBy.toString(), like.likedUser.toString(), like.likedBy.toString());
  const conversation = await createOrReuseConversation(like.likedBy.toString(), like.likedUser.toString());

  // Populate response data
  await like.populate(['likedBy', 'likedUser']);

  // Send match notification via socket.io if configured
  const io = req.app?.locals?.io;
  if (io) {
    sendMatchNotification(
      io,
      like.likedBy.toString(),
      likedByUser.name,
      like.likedUser.toString(),
      likedUser.name
    );
  }

  res.json({
    success: true,
    message: 'Like accepted and match created',
    like: like,
    match: match,
    conversation: conversation
  });
}));

// ==========================================================================
// POST /api/likes/:likeId/reject
// Reject a like
// ==========================================================================
router.post('/:likeId/reject', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  const { likeId } = req.params;
  const userId = req.userId.toString();

  // Find the like
  const like = await Like.findById(likeId);
  if (!like) {
    throw new AppError('Like not found', 404);
  }

  // Verify current user is the one being liked
  if (like.likedUser.toString() !== userId) {
    throw new AppError('Unauthorized to reject this like', 403);
  }

  // Check if already accepted/rejected
  if (like.status !== 'pending') {
    throw new AppError(`Like already ${like.status}`, 400);
  }

  // Update like status
  like.status = 'rejected';
  like.actionAt = new Date();
  like.actionBy = userId;
  await like.save();

  res.json({
    success: true,
    message: 'Like rejected',
    like: like
  });
}));

// ==========================================================================
// GET /api/likes/sent
// Get all likes sent by current user
// ==========================================================================
router.get('/sent', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  const userId = req.userId.toString();

  const sentLikes = await Like.find({
    likedBy: userId
  })
    .populate('likedUser', 'name profilePhoto avatarConfig bio gender college')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: sentLikes.length,
    likes: sentLikes
  });
}));

// ==========================================================================
// GET /api/likes/stats
// Get like statistics for current user
// ==========================================================================
router.get('/stats', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  const userId = req.userId.toString();

  const [
    receivedTotal,
    receivedPending,
    sentTotal,
    sentPending,
    sentAccepted
  ] = await Promise.all([
    Like.countDocuments({ likedUser: userId }),
    Like.countDocuments({ likedUser: userId, status: 'pending' }),
    Like.countDocuments({ likedBy: userId }),
    Like.countDocuments({ likedBy: userId, status: 'pending' }),
    Like.countDocuments({ likedBy: userId, status: 'accepted' })
  ]);

  res.json({
    success: true,
    stats: {
      received: {
        total: receivedTotal,
        pending: receivedPending
      },
      sent: {
        total: sentTotal,
        pending: sentPending,
        accepted: sentAccepted
      }
    }
  });
}));

// ========================================================================
// GET /api/likes/connections
// Get accepted connections with participant + metadata
// ========================================================================
router.get('/connections', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  const userId = req.userId.toString();
  const search = String(req.query.search || '').trim().toLowerCase();

  const matches = await Match.find({
    users: userId,
    status: 'matched'
  })
    .populate('users', '_id name email college course year profilePhoto avatarConfig status')
    .sort({ updatedAt: -1 })
    .lean();

  const data = matches
    .map((match) => {
      const participant = (match.users || []).find((item) => item?._id?.toString() !== userId);
      const mySettings = (match.userSettings || []).find((item) => item?.userId?.toString?.() === userId) || {};
      return {
        _id: match._id,
        participant,
        matchedAt: match.matchedAt,
        updatedAt: match.updatedAt,
        connectionMeta: {
          favorite: Boolean(mySettings.favorite),
          muted: Boolean(mySettings.muted),
          tag: mySettings.tag || DEFAULT_TAG
        }
      };
    })
    .filter((row) => {
      if (!row.participant) {
        return false;
      }
      if (!search) {
        return true;
      }
      const haystack = `${row.participant.name || ''} ${row.participant.college || ''} ${row.participant.course || ''}`.toLowerCase();
      return haystack.includes(search);
    });

  res.json({
    success: true,
    count: data.length,
    connections: data
  });
}));

// ========================================================================
// PATCH /api/likes/connections/:matchId
// Update favorite/mute/tag for current user side
// ========================================================================
router.patch('/connections/:matchId', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const userId = req.userId.toString();
  const { favorite, muted, tag } = req.body || {};

  const allowedTags = ['Friend', 'Close Friend', 'Crush', 'Study Buddy', 'Coffee Buddy', 'Community Buddy', 'Date Vibe'];
  if (tag && !allowedTags.includes(tag)) {
    throw new AppError('Invalid connection tag', 400);
  }

  const match = await Match.findOne({ _id: matchId, users: userId, status: 'matched' });
  if (!match) {
    throw new AppError('Connection not found', 404);
  }

  const existing = (match.userSettings || []).find((item) => item.userId?.toString() === userId);
  if (!existing) {
    match.userSettings.push({
      userId,
      favorite: Boolean(favorite),
      muted: Boolean(muted),
      tag: tag || DEFAULT_TAG,
      updatedAt: new Date()
    });
  } else {
    if (typeof favorite === 'boolean') {
      existing.favorite = favorite;
    }
    if (typeof muted === 'boolean') {
      existing.muted = muted;
    }
    if (typeof tag === 'string' && tag) {
      existing.tag = tag;
    }
    existing.updatedAt = new Date();
  }

  await match.save();

  res.json({
    success: true,
    message: 'Connection updated',
    connectionMeta: {
      favorite: Boolean(existing ? existing.favorite : favorite),
      muted: Boolean(existing ? existing.muted : muted),
      tag: existing?.tag || tag || DEFAULT_TAG
    }
  });
}));

// ========================================================================
// DELETE /api/likes/connections/:matchId
// Remove connection (unmatch and lock existing chat)
// ========================================================================
router.delete('/connections/:matchId', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const userId = req.userId.toString();

  const match = await Match.findOne({ _id: matchId, users: userId, status: 'matched' });
  if (!match) {
    throw new AppError('Connection not found', 404);
  }

  match.status = 'unmatched';
  match.unmatchedAt = new Date();
  match.unmatchedBy = userId;
  await match.save();

  const usersKey = normalizePair(match.users[0], match.users[1]);
  const participantKey = usersKey.join(':');
  const conversation = await Conversation.findOne({ participantKey });
  if (conversation) {
    conversation.isBlocked = true;
    conversation.blockedBy = userId;
    await conversation.save();
  }

  res.json({ success: true, message: 'Connection removed' });
}));

export default router;
