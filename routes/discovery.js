import express from 'express';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Conversation from '../models/Conversation.js';
import { verifyFirebaseOrJwtAuth } from '../middleware/authFirebaseOrJwt.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import { successResponse, errorResponse } from '../utils/validation.js';
import { logActivity, getClientInfo } from '../utils/auth.js';

const router = express.Router();

// Helper function to normalize participant pair
const normalizePair = (a, b) => [a.toString(), b.toString()].sort();

// Helper function to create conversation for matched users
const createConversationForMatchedUsers = async (userId, targetUserId) => {
  const pair = normalizePair(userId, targetUserId);
  const participantKey = pair.join(':');

  let conversation = await Conversation.findOne({ participantKey });
  if (conversation) {
    return conversation;
  }

  conversation = await Conversation.create({
    participants: pair,
    participantKey,
    lastMessage: null,
    lastMessageTime: null
  });

  return conversation;
};

// ===== GET DISCOVERY FEED =====
router.get('/feed', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    if (user.status !== 'active') {
      return res.status(403).json(errorResponse('Your account must be approved to access the feed'));
    }

    // Get users already matched, liked, or passed by current user
    const userInteractions = await Match.find({
      users: userId.toString()
    }).select('users status');

    const interactedUserIds = new Set();
    const matchedUserIds = new Set();

    userInteractions.forEach(interaction => {
      // Find the other user in the match
      const otherUserId = interaction.users.find(id => id.toString() !== userId.toString());
      if (otherUserId) {
        interactedUserIds.add(otherUserId.toString());
        if (interaction.status === 'matched') {
          matchedUserIds.add(otherUserId.toString());
        }
      }
    });

    // Get approved users (excluding current user and already interacted)
    const feedUsers = await User.find({
      _id: { $ne: userId, $nin: Array.from(interactedUserIds) },
      status: 'active',
      role: 'user',
      is_verified: true
    })
      .select('name email gender course year bio livePhoto avatar age college') // Never expose ID card
      .limit(50)
      .lean();

    const feedData = feedUsers.map(u => ({
      _id: u._id,
      name: u.name,
      age: u.age || 'N/A',
      gender: u.gender,
      course: u.course,
      year: u.year,
      college: u.college,
      bio: u.bio,
      // Use avatar if available, otherwise use profile photo
      profileImage: u.avatar || u.livePhoto || '/default-avatar.png'
    }));

    return res.json(successResponse('Feed loaded', { 
      data: feedData,
      total: feedData.length,
      matched: matchedUserIds.size
    }));
  } catch (error) {
    console.error('❌ Feed Error:', error);
    return res.status(500).json(errorResponse('Failed to load feed: ' + error.message));
  }
}));

// ===== SEND LIKE REQUEST (creates pending match) =====
router.post('/like/:targetUserId', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.params;

    if (userId.toString() === targetUserId) {
      return res.status(400).json(errorResponse('You cannot like yourself'));
    }

    const user = await User.findById(userId).select('name status');
    const targetUser = await User.findById(targetUserId).select('name status');

    if (!user || !targetUser) {
      return res.status(404).json(errorResponse('User not found'));
    }

    if (user.status !== 'active' || targetUser.status !== 'active') {
      return res.status(403).json(errorResponse('Both users must be active'));
    }

    // Use normalized pair for lookup (Match schema uses this)
    const pair = normalizePair(userId, targetUserId);

    // Check if interaction already exists
    const existingMatch = await Match.findOne({ users: pair });
    if (existingMatch) {
      return res.status(400).json(errorResponse('Interaction already exists with this user'));
    }

    // Create like request
    const match = await Match.create({
      users: pair,
      status: 'pending',
      requestedBy: userId,
      matchedAt: null
    });

    // Log activity
    await logActivity({
      user_id: userId,
      action: 'sent_like_request',
      description: `Sent like request to ${targetUser.name}`,
      target_user_id: targetUserId,
      target_type: 'user',
      target_id: match._id,
      ...getClientInfo(req),
      status: 'success'
    });

    return res.json(successResponse('Like sent! 💖', { 
      matchId: match._id,
      targetUser: { _id: targetUser._id, name: targetUser.name }
    }));
  } catch (error) {
    console.error('❌ Like Error:', error);
    return res.status(500).json(errorResponse('Failed to send like: ' + error.message));
  }
}));

// ===== PASS/SKIP USER =====
router.post('/pass/:targetUserId', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.params;

    if (userId.toString() === targetUserId) {
      return res.status(400).json(errorResponse('Invalid action'));
    }

    const user = await User.findById(userId).select('name');
    const targetUser = await User.findById(targetUserId).select('name');

    if (!user || !targetUser) {
      return res.status(404).json(errorResponse('User not found'));
    }

    // Create pass record (so we don't show them again)
    const pair = normalizePair(userId, targetUserId);
    const existingMatch = await Match.findOne({ users: pair });

    if (!existingMatch) {
      await Match.create({
        users: pair,
        status: 'unmatched',
        requestedBy: userId
      });
    } else if (existingMatch.status !== 'unmatched') {
      existingMatch.status = 'unmatched';
      await existingMatch.save();
    }

    // Log activity
    await logActivity({
      user_id: userId,
      action: 'passed_user',
      description: `Passed on ${targetUser.name}`,
      target_user_id: targetUserId,
      target_type: 'user',
      ...getClientInfo(req),
      status: 'success'
    });

    return res.json(successResponse('User passed'));
  } catch (error) {
    console.error('❌ Pass Error:', error);
    return res.status(500).json(errorResponse('Failed to pass user: ' + error.message));
  }
}));

// ===== GET PENDING LIKE REQUESTS (Inbox for current user) =====
router.get('/requests', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    // Find matches where current user is the recipient, status is pending
    const requests = await Match.find({
      users: userId.toString(),
      status: 'pending',
      requestedBy: { $ne: userId } // Someone else requested, not current user
    })
      .populate({
        path: 'requestedBy',
        select: 'name age gender course college bio avatar livePhoto'
      })
      .sort({ createdAt: -1 });

    const data = requests.map(req => ({
      _id: req._id,
      requester: req.requestedBy,
      status: req.status,
      createdAt: req.createdAt
    }));

    return res.json(successResponse('Like requests fetched', { 
      data,
      count: data.length
    }));
  } catch (error) {
    console.error('❌ Requests Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch requests: ' + error.message));
  }
}));

// ===== ACCEPT LIKE REQUEST (Creates match + conversation) =====
router.post('/accept-request/:matchId', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { matchId } = req.params;

    const match = await Match.findById(matchId)
      .populate('requestedBy', 'name email')
      .populate('users', 'name email');

    if (!match) {
      return res.status(404).json(errorResponse('Match not found'));
    }

    // Verify current user is a participant
    const isParticipant = match.users.some(u => u._id.toString() === userId.toString());
    if (!isParticipant) {
      return res.status(403).json(errorResponse('Unauthorized'));
    }

    // Verify this user is the recipient (not the requester)
    if (match.requestedBy._id.toString() === userId.toString()) {
      return res.status(400).json(errorResponse('Cannot accept your own request'));
    }

    // Update to matched status
    match.status = 'matched';
    match.matchedAt = new Date();
    await match.save();

    // Find the other user (not current user)
    const otherUser = match.users.find(u => u._id.toString() !== userId.toString());

    // CREATE CONVERSATION AUTOMATICALLY ✓
    const conversation = await createConversationForMatchedUsers(userId, otherUser._id);

    // Log activity
    await logActivity({
      user_id: userId,
      action: 'accepted_like_request',
      description: `Accepted like request from ${match.requestedBy.name}`,
      target_user_id: match.requestedBy._id,
      target_type: 'user',
      target_id: matchId,
      ...getClientInfo(req),
      status: 'success'
    });

    return res.json(successResponse('Match accepted! 💖 Conversation created.', { 
      matchId,
      conversationId: conversation._id,
      otherUser: {
        _id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email
      }
    }));
  } catch (error) {
    console.error('❌ Accept Error:', error);
    return res.status(500).json(errorResponse('Failed to accept request: ' + error.message));
  }
}));

// ===== REJECT LIKE REQUEST =====
router.post('/reject-request/:matchId', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { matchId } = req.params;

    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json(errorResponse('Match not found'));
    }

    // Verify current user is a participant
    const isParticipant = match.users.some(u => u.toString() === userId.toString());
    if (!isParticipant) {
      return res.status(403).json(errorResponse('Unauthorized'));
    }

    // Mark as unmatched instead of deleting
    match.status = 'unmatched';
    match.unmatchedAt = new Date();
    match.unmatchedBy = userId;
    await match.save();

    // Log activity
    await logActivity({
      user_id: userId,
      action: 'rejected_like_request',
      description: 'Rejected like request',
      target_type: 'user',
      target_id: matchId,
      ...getClientInfo(req),
      status: 'success'
    });

    return res.json(successResponse('Request rejected'));
  } catch (error) {
    console.error('❌ Reject Error:', error);
    return res.status(500).json(errorResponse('Failed to reject request: ' + error.message));
  }
}));

// ===== GET MATCHES (All matched users - mostly for debugging, inbox should use /chat/conversations) =====
router.get('/matches', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    const matches = await Match.find({
      users: userId.toString(),
      status: 'matched'
    })
      .populate('users', 'name email avatar livePhoto status')
      .sort({ matchedAt: -1 });

    const matchList = matches.map(m => {
      // Find the other user (not current user)
      const otherUser = m.users.find(u => u._id.toString() !== userId.toString());
      
      return {
        matchId: m._id,
        userId: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        avatar: otherUser.avatar || otherUser.livePhoto,
        status: otherUser.status,
        matchedAt: m.matchedAt
      };
    });

    return res.json(successResponse('Matches fetched', { 
      data: matchList,
      count: matchList.length
    }));
  } catch (error) {
    console.error('❌ Matches Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch matches: ' + error.message));
  }
}));

export default router;
