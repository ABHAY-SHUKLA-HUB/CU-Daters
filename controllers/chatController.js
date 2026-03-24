import mongoose from 'mongoose';
import fs from 'fs';
import Conversation from '../models/Conversation.js';
import Connection from '../models/Connection.js';
import Block from '../models/Block.js';
import Message from '../models/Message.js';
import Match from '../models/Match.js';
import User from '../models/User.js';
import { AppError } from '../utils/errorHandler.js';
import { persistMessageAndFanout } from '../services/chatMessageService.js';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;
const ALLOWED_CHAT_THEMES = new Set([
  'romantic-pink',
  'lavender-blush',
  'heart-mode',
  'soft-night',
  'cream-dream',
  'minimal-white',
  'dark-romantic'
]);

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

const normalizePair = (a, b) => [a.toString(), b.toString()].sort();

const ensureValidObjectId = (id, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

const ensureParticipants = (conversation, userId) => {
  const isParticipant = conversation.participants.some((id) => id.toString() === userId.toString());
  if (!isParticipant) {
    throw new AppError('You are not a participant of this conversation', 403);
  }
};

const ensureConnectedUsers = async (userId, targetUserId) => {
  const usersKey = normalizePair(userId, targetUserId);
  const pairKey = usersKey.join(':');
  const connection = await Connection.findOne({ pairKey }).lean();
  if (!connection) {
    throw new AppError('Messaging is allowed only after request acceptance', 403);
  }

  return connection;
};

const ensureUsersNotBlocked = async (userId, targetUserId) => {
  const blocked = await Block.findOne({
    $or: [
      { blockerId: userId, blockedId: targetUserId },
      { blockerId: targetUserId, blockedId: userId }
    ]
  }).lean();

  if (blocked) {
    throw new AppError('Action not allowed because one user has blocked the other', 403);
  }
};

const resolveViewerNickname = (conversation, viewerId) => {
  const fallbackParticipants = Array.isArray(conversation?.participants)
    ? [...conversation.participants].map((id) => id?.toString?.() || id).sort()
    : [];
  const participantA = conversation?.participantAId?.toString?.() || fallbackParticipants[0] || '';
  const participantB = conversation?.participantBId?.toString?.() || fallbackParticipants[1] || '';
  const viewer = viewerId?.toString?.() || viewerId;

  if (viewer === participantA) {
    return String(conversation?.nicknameAForB || '').trim();
  }
  if (viewer === participantB) {
    return String(conversation?.nicknameBForA || '').trim();
  }
  return '';
};

const toClientMessage = (message) => {
  const raw = typeof message?.toObject === 'function' ? message.toObject() : message;
  return {
    ...raw,
    _id: raw?._id?.toString?.() || raw?._id,
    conversationId:
      typeof raw?.conversationId === 'object' && raw?.conversationId?._id
        ? raw.conversationId._id.toString()
        : raw?.conversationId?.toString?.() || raw?.conversationId,
    senderId:
      typeof raw?.senderId === 'object' && raw?.senderId?._id
        ? raw.senderId._id.toString()
        : raw?.senderId?.toString?.() || raw?.senderId,
    receiverId:
      typeof raw?.receiverId === 'object' && raw?.receiverId?._id
        ? raw.receiverId._id.toString()
        : raw?.receiverId?.toString?.() || raw?.receiverId,
    clientMessageId: raw?.clientMessageId || '',
    clientTempId: raw?.clientMessageId || raw?.clientTempId || '',
    deliveryStatus: raw?.deliveryStatus || (raw?.seen ? 'seen' : raw?.delivered ? 'delivered' : 'sent')
  };
};

const normalizeMessageType = (messageType, text) => {
  const normalized = (messageType || 'text').toString().toLowerCase();
  if (normalized === 'text' && text && text.trim() && text.trim().length <= 2) {
    return 'emoji';
  }
  return normalized;
};

const sanitizeAttachment = (attachment) => {
  if (!attachment || typeof attachment !== 'object') {
    return null;
  }
  return {
    name: String(attachment.name || '').trim(),
    size: Number(attachment.size || 0),
    mimeType: String(attachment.mimeType || '').trim(),
    url: String(attachment.url || '').trim()
  };
};

const sanitizeVoiceNote = (voiceNote) => {
  if (!voiceNote || typeof voiceNote !== 'object') {
    return null;
  }
  return {
    durationSec: Number(voiceNote.durationSec || 0),
    mimeType: String(voiceNote.mimeType || 'audio/webm').trim(),
    fileName: String(voiceNote.fileName || '').trim(),
    url: String(voiceNote.url || '').trim()
  };
};

const ensurePayloadByType = ({ messageType, text, attachment, voiceNote }) => {
  const trimmedText = typeof text === 'string' ? text.trim() : '';

  if ((messageType === 'text' || messageType === 'emoji' || messageType === 'system' || messageType === 'call') && !trimmedText) {
    throw new AppError('Message text is required', 400);
  }

  if (trimmedText.length > MAX_MESSAGE_LENGTH) {
    throw new AppError(`Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`, 400);
  }

  if ((messageType === 'image' || messageType === 'file' || messageType === 'attachment') && !attachment?.url) {
    throw new AppError('Attachment URL is required', 400);
  }

  if (messageType === 'voice' && !voiceNote?.url) {
    throw new AppError('Voice note URL is required', 400);
  }
};

export const createConversationForMatchedUsers = async (userId, targetUserId) => {
  const pair = normalizePair(userId, targetUserId);
  const participantKey = pair.join(':');

  // Atomic upsert prevents duplicate conversation creation under concurrent requests.
  let conversation;
  try {
    conversation = await Conversation.findOneAndUpdate(
      { participantKey },
      {
        $setOnInsert: {
          participants: pair,
          participantKey,
          participantAId: pair[0],
          participantBId: pair[1],
          lastMessage: null,
          lastMessageTime: null
        }
      },
      { new: true, upsert: true }
    );
  } catch (error) {
    if (error?.code === 11000) {
      conversation = await Conversation.findOne({ participantKey });
    } else {
      throw error;
    }
  }

  // Populate before returning ✓
  await conversation.populate('participants', '_id name email status profile_approval_status gender profilePhoto avatarConfig livePhoto verified_badge is_verified college_verification_status privacy');
  return conversation;
};

const createOrReuseConnectionForUsers = async (userA, userB) => {
  const usersKey = normalizePair(userA, userB);
  const pairKey = usersKey.join(':');
  return Connection.findOneAndUpdate(
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
};

export const createOrGetConversation = async (req, res, next) => {
  try {
    const userId = req.userId.toString();
    const { participantId } = req.body;

    ensureValidObjectId(participantId, 'participantId');

    if (userId === participantId) {
      throw new AppError('Cannot create a conversation with yourself', 400);
    }

    const targetUser = await User.findById(participantId).select('_id name email status profile_approval_status privacy');
    if (!targetUser || targetUser.status !== 'active' || targetUser.profile_approval_status !== 'approved') {
      throw new AppError('Target user not available for chat', 404);
    }

    await ensureUsersNotBlocked(userId, participantId);

    await ensureConnectedUsers(userId, participantId);

    const conversation = await createConversationForMatchedUsers(userId, participantId);

    // Format response with proper participant data for UI ✓
    const participant = conversation.participants.find((p) => p._id.toString() !== userId);
    
    return res.json({
      success: true,
      message: 'Conversation ready ✓',
      data: { 
        conversation: {
          _id: conversation._id,
          participants: conversation.participants,
          participant: participant ? {
            _id: participant._id,
            name: participant.name,
            email: participant.email,
            status: participant.status,
            profilePhoto: participant.profilePhoto,
            avatarConfig: participant.avatarConfig,
            livePhoto: participant.livePhoto
          } : null,
          viewerNickname: resolveViewerNickname(conversation, userId),
          chatTheme: conversation.chatTheme || 'romantic-pink',
          lastMessage: conversation.lastMessage,
          lastMessageTime: conversation.lastMessageTime
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyConversations = async (req, res, next) => {
  try {
    const userId = req.userId.toString();
    const [connectedRows, blockedRows] = await Promise.all([
      Connection.find({ $or: [{ userA: userId }, { userB: userId }] }).select('pairKey').lean(),
      Block.find({ $or: [{ blockerId: userId }, { blockedId: userId }] }).select('pairKey').lean()
    ]);

    const connectedPairKeys = new Set(connectedRows.map((item) => item.pairKey));
    const blockedPairKeys = new Set(blockedRows.map((item) => item.pairKey));
    const allowedPairKeys = [...connectedPairKeys].filter((pairKey) => !blockedPairKeys.has(pairKey));

    if (!allowedPairKeys.length) {
      return res.json({
        success: true,
        data: {
          conversations: [],
          unreadTotal: 0
        }
      });
    }

    const conversationFilter = {
      participantKey: { $in: allowedPairKeys },
      $or: [{ participantAId: userId }, { participantBId: userId }, { participants: userId }]
    };

    const conversations = await Conversation.find(conversationFilter)
      .sort({ lastMessageTime: -1, updatedAt: -1 })
      .populate('participants', '_id name status profilePhoto avatarConfig livePhoto last_active_at verified_badge is_verified college_verification_status privacy')
      .lean();

    const conversationIds = conversations.map((chat) => chat._id);

    if (!conversationIds.length) {
      return res.json({
        success: true,
        data: {
          conversations: [],
          unreadTotal: 0
        }
      });
    }

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          receiverId: toObjectId(userId),
          seen: false
        }
      },
      {
        $group: {
          _id: '$conversationId',
          unreadCount: { $sum: 1 }
        }
      }
    ]);

    const unreadByConversationId = unreadCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.unreadCount;
      return acc;
    }, {});

    const data = conversations.map((chat) => {
      const participant = chat.participants.find((p) => p._id.toString() !== userId);
      const existingLastMessage = String(chat.lastMessage || '').trim();
      const previewMessage = existingLastMessage || 'You matched 💖 Start chatting';
      const normalizedParticipant = participant
        ? {
            ...participant,
            lastActiveAt: participant.lastActiveAt || participant.last_active_at || null
          }
        : null;
      return {
        ...chat,
        participant: normalizedParticipant,
        viewerNickname: resolveViewerNickname(chat, userId),
        chatTheme: chat.chatTheme || 'romantic-pink',
        lastMessage: previewMessage,
        lastMessageTime: chat.lastMessageTime || chat.updatedAt,
        unreadCount: unreadByConversationId[chat._id.toString()] || 0
      };
    });

    return res.json({
      success: true,
      data: {
        conversations: data,
        unreadTotal: data.reduce((sum, item) => sum + item.unreadCount, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadSummary = async (req, res, next) => {
  try {
    const userId = req.userId.toString();
    const [connectedRows, blockedRows] = await Promise.all([
      Connection.find({ $or: [{ userA: userId }, { userB: userId }] }).select('pairKey').lean(),
      Block.find({ $or: [{ blockerId: userId }, { blockedId: userId }] }).select('pairKey').lean()
    ]);

    const connectedPairKeys = new Set(connectedRows.map((item) => item.pairKey));
    const blockedPairKeys = new Set(blockedRows.map((item) => item.pairKey));
    const allowedPairKeys = [...connectedPairKeys].filter((pairKey) => !blockedPairKeys.has(pairKey));

    if (!allowedPairKeys.length) {
      return res.json({ success: true, data: { unreadTotal: 0 } });
    }

    const allowedConversationIds = (await Conversation.find({
      participantKey: { $in: allowedPairKeys },
      $or: [{ participantAId: userId }, { participantBId: userId }, { participants: userId }]
    })
      .select('_id')
      .lean()).map((chat) => chat._id);

    if (!allowedConversationIds.length) {
      return res.json({ success: true, data: { unreadTotal: 0 } });
    }

    const unreadTotal = await Message.countDocuments({
      conversationId: { $in: allowedConversationIds },
      receiverId: toObjectId(userId),
      seen: false
    });

    return res.json({
      success: true,
      data: { unreadTotal }
    });
  } catch (error) {
    next(error);
  }
};

export const getConversationMessages = async (req, res, next) => {
  try {
    const userId = req.userId.toString();
    const { conversationId } = req.params;

    ensureValidObjectId(conversationId, 'conversationId');

    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    ensureParticipants(conversation, userId);
    const [userA, userB] = conversation.participants.map((id) => id.toString());
    await ensureUsersNotBlocked(userA, userB);
    await ensureConnectedUsers(userA, userB);

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const normalizedMessages = messages.reverse().map((item) => toClientMessage(item));

    return res.json({
      success: true,
      data: {
        messages: normalizedMessages,
        pagination: { page, limit, hasMore: messages.length === limit }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const userId = req.userId.toString();
    const io = req.app?.locals?.io;
    const { conversationId } = req.params;
    const {
      text = '',
      messageType = 'text',
      attachment: rawAttachment,
      voiceNote: rawVoiceNote,
      clientMessageId: rawClientMessageId,
      clientTempId: rawClientTempId
    } = req.body;

    ensureValidObjectId(conversationId, 'conversationId');

    const normalizedType = normalizeMessageType(messageType, text);
    const attachment = sanitizeAttachment(rawAttachment);
    const voiceNote = sanitizeVoiceNote(rawVoiceNote);
    const trimmedText = typeof text === 'string' ? text.trim() : '';
    const clientMessageId = String(rawClientMessageId || rawClientTempId || '').trim();

    ensurePayloadByType({
      messageType: normalizedType,
      text: trimmedText,
      attachment,
      voiceNote
    });

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    ensureParticipants(conversation, userId);

    const [userA, userB] = conversation.participants.map((id) => id.toString());
    const receiverId = userA === userId ? userB : userA;

    await ensureUsersNotBlocked(userId, receiverId);
    await ensureConnectedUsers(userId, receiverId);

    if (conversation.isBlocked) {
      throw new AppError('You cannot send messages in this conversation', 403);
    }

    const receiverRoomSize = io?.sockets?.adapter?.rooms?.get(`user:${receiverId}`)?.size || 0;
    const receiverOnline = receiverRoomSize > 0;

    const { message: outbound } = await persistMessageAndFanout({
      conversationId,
      senderId: userId,
      receiverId,
      text: trimmedText,
      messageType: normalizedType,
      attachment,
      voiceNote,
      clientMessageId,
      isReceiverOnline: receiverOnline,
      io,
      emitEvents: true
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent',
      data: { message: outbound }
    });
  } catch (error) {
    next(error);
  }
};

export const reactToMessage = async (req, res, next) => {
  try {
    const userId = req.userId.toString();
    const io = req.app?.locals?.io;
    const { conversationId, messageId } = req.params;
    const emoji = String(req.body?.emoji || '❤️').trim();

    ensureValidObjectId(conversationId, 'conversationId');
    ensureValidObjectId(messageId, 'messageId');

    if (!emoji || emoji.length > 8) {
      throw new AppError('Invalid reaction emoji', 400);
    }

    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    ensureParticipants(conversation, userId);

    const [userA, userB] = conversation.participants.map((id) => id.toString());
    await ensureUsersNotBlocked(userA, userB);
    await ensureConnectedUsers(userA, userB);

    const message = await Message.findOne({ _id: messageId, conversationId });
    if (!message) {
      throw new AppError('Message not found', 404);
    }

    const existingIndex = (message.reactions || []).findIndex(
      (item) => item?.userId?.toString() === userId
    );

    if (existingIndex >= 0) {
      if (message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex].emoji = emoji;
        message.reactions[existingIndex].createdAt = new Date();
      }
    } else {
      message.reactions.push({ userId, emoji, createdAt: new Date() });
    }

    await message.save();
    const outbound = toClientMessage(message);

    if (io) {
      io.to(`chat:${conversationId}`).emit('message_reaction', {
        conversationId,
        messageId: message._id.toString(),
        reactions: outbound.reactions || [],
        message: outbound
      });
    }

    return res.json({
      success: true,
      message: 'Reaction updated',
      data: { message: outbound }
    });
  } catch (error) {
    next(error);
  }
};

export const uploadConversationAttachment = async (req, res, next) => {
  try {
    const userId = req.userId.toString();
    const { conversationId } = req.params;

    ensureValidObjectId(conversationId, 'conversationId');

    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    ensureParticipants(conversation, userId);

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    if (req.file.size > MAX_ATTACHMENT_SIZE) {
      throw new AppError('File exceeds 20MB limit', 400);
    }

    const relativeUrl = `/uploads/chat/${req.file.filename}`;
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const absoluteUrl = `${baseUrl}${relativeUrl}`;

    return res.status(201).json({
      success: true,
      message: 'Attachment uploaded',
      data: {
        attachment: {
          name: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          url: absoluteUrl,
          relativeUrl,
          fileName: req.file.filename
        }
      }
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => null);
    }
    next(error);
  }
};

export const markConversationSeen = async (req, res, next) => {
  try {
    const userId = req.userId.toString();
    const { conversationId } = req.params;

    ensureValidObjectId(conversationId, 'conversationId');

    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    ensureParticipants(conversation, userId);

    const result = await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        seen: false
      },
      { $set: { seen: true, delivered: true, deliveryStatus: 'seen' } }
    );

    return res.json({
      success: true,
      message: 'Messages marked as seen',
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    next(error);
  }
};

export const updateConversationTheme = async (req, res, next) => {
  try {
    const userId = req.userId.toString();
    const { conversationId } = req.params;
    const nextTheme = String(req.body?.theme || '').trim();

    ensureValidObjectId(conversationId, 'conversationId');

    if (!ALLOWED_CHAT_THEMES.has(nextTheme)) {
      throw new AppError('Invalid conversation theme', 400);
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    ensureParticipants(conversation, userId);
    conversation.chatTheme = nextTheme;
    await conversation.save();

    return res.json({
      success: true,
      message: 'Conversation theme updated',
      data: { conversationId: conversation._id, chatTheme: conversation.chatTheme }
    });
  } catch (error) {
    next(error);
  }
};

export const updateConversationNickname = async (req, res, next) => {
  try {
    const userId = req.userId.toString();
    const { conversationId } = req.params;
    const nickname = String(req.body?.nickname || '').trim();

    ensureValidObjectId(conversationId, 'conversationId');

    if (nickname.length > 40) {
      throw new AppError('Nickname cannot exceed 40 characters', 400);
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    ensureParticipants(conversation, userId);

    const fallbackParticipants = Array.isArray(conversation.participants)
      ? [...conversation.participants].map((id) => id?.toString?.() || id).sort()
      : [];
    const participantA = conversation.participantAId?.toString?.() || fallbackParticipants[0];
    const participantB = conversation.participantBId?.toString?.() || fallbackParticipants[1];

    if (userId === participantA) {
      conversation.nicknameAForB = nickname;
    } else if (userId === participantB) {
      conversation.nicknameBForA = nickname;
    }

    await conversation.save();

    return res.json({
      success: true,
      message: 'Conversation nickname updated',
      data: { conversationId: conversation._id, viewerNickname: resolveViewerNickname(conversation, userId) }
    });
  } catch (error) {
    next(error);
  }
};

export const blockConversationUser = async (req, res, next) => {
  try {
    const userId = req.userId.toString();
    const { conversationId } = req.params;

    ensureValidObjectId(conversationId, 'conversationId');

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    ensureParticipants(conversation, userId);

    conversation.isBlocked = true;
    conversation.blockedBy = userId;
    await conversation.save();

    return res.json({
      success: true,
      message: 'User blocked for this conversation',
      data: { conversation }
    });
  } catch (error) {
    next(error);
  }
};

export const unmatchConversationUsers = async (req, res, next) => {
  try {
    const userId = req.userId.toString();
    const { conversationId } = req.params;

    ensureValidObjectId(conversationId, 'conversationId');

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    ensureParticipants(conversation, userId);

    const [userA, userB] = conversation.participants.map((id) => id.toString());
    const usersKey = normalizePair(userA, userB);

    await Match.findOneAndUpdate(
      { users: usersKey },
      {
        $set: {
          status: 'unmatched',
          unmatchedBy: userId,
          unmatchedAt: new Date()
        }
      },
      { new: true }
    );

    conversation.isBlocked = true;
    conversation.blockedBy = userId;
    await conversation.save();

    return res.json({ success: true, message: 'Users unmatched and chat disabled' });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const userId = req.userId.toString();
    const { conversationId } = req.params;

    ensureValidObjectId(conversationId, 'conversationId');

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    ensureParticipants(conversation, userId);

    await Message.deleteMany({ conversationId });
    await conversation.deleteOne();

    return res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    next(error);
  }
};

export const getMyMatches = async (req, res, next) => {
  try {
    const userId = req.userId.toString();

    const matches = await Match.find({
      users: userId,
      status: 'matched'
    })
      .populate('users', '_id name email status gender profilePhoto avatarConfig')
      .sort({ updatedAt: -1 })
      .lean();

    const data = matches.map((match) => ({
      ...match,
      participant: match.users.find((item) => item._id.toString() !== userId)
    }));

    return res.json({ success: true, data: { matches: data } });
  } catch (error) {
    next(error);
  }
};

export const createMatchAndConversation = async (req, res, next) => {
  try {
    const userId = req.userId.toString();
    const { targetUserId } = req.body;

    ensureValidObjectId(targetUserId, 'targetUserId');

    if (userId === targetUserId) {
      throw new AppError('Cannot match with yourself', 400);
    }

    const targetUser = await User.findById(targetUserId).select('_id status profile_approval_status');
    if (!targetUser || targetUser.status !== 'active' || targetUser.profile_approval_status !== 'approved') {
      throw new AppError('Target user not available for matching', 404);
    }

    const usersKey = normalizePair(userId, targetUserId);

    const match = await Match.findOneAndUpdate(
      { users: usersKey },
      {
        $set: { status: 'matched', unmatchedBy: null, unmatchedAt: null, requestedBy: userId },
        $setOnInsert: { matchedAt: new Date() }
      },
      { new: true, upsert: true }
    );

    const conversation = await createConversationForMatchedUsers(userId, targetUserId);
    await createOrReuseConnectionForUsers(userId, targetUserId);

    return res.status(201).json({
      success: true,
      message: 'Match created and conversation initialized',
      data: { match, conversation }
    });
  } catch (error) {
    if (typeof next === 'function') {
      return next(error);
    }
    throw error;
  }
};

export const swipeProfile = async (req, res, next) => {
  try {
    const userId = req.userId.toString();
    const { targetUserId, action } = req.body;

    ensureValidObjectId(targetUserId, 'targetUserId');
    if (!['like', 'pass'].includes(action)) {
      throw new AppError('Invalid swipe action', 400);
    }
    if (userId === targetUserId) {
      throw new AppError('Cannot swipe on yourself', 400);
    }

    const targetUser = await User.findById(targetUserId).select('_id status role profile_approval_status');
    if (!targetUser || targetUser.status !== 'active' || targetUser.role !== 'user' || targetUser.profile_approval_status !== 'approved') {
      throw new AppError('Target user not available', 404);
    }

    const usersKey = normalizePair(userId, targetUserId);
    let match = await Match.findOne({ users: usersKey });

    if (action === 'pass') {
      if (match && match.status === 'pending' && match.requestedBy?.toString() === userId) {
        await match.deleteOne();
      }
      return res.json({
        success: true,
        message: 'Profile passed',
        data: { matched: false, conversationId: null }
      });
    }

    if (!match) {
      match = await Match.create({
        users: usersKey,
        status: 'pending',
        requestedBy: userId
      });
      return res.json({
        success: true,
        message: 'Like sent',
        data: { matched: false, match }
      });
    }

    if (match.status === 'matched') {
      const conversation = await createConversationForMatchedUsers(userId, targetUserId);
      await createOrReuseConnectionForUsers(userId, targetUserId);
      return res.json({
        success: true,
        message: 'Already matched',
        data: { matched: true, match, conversation }
      });
    }

    // Mutual like: pending request exists from other user.
    if (match.status === 'pending' && match.requestedBy?.toString() !== userId) {
      match.status = 'matched';
      match.matchedAt = new Date();
      match.unmatchedAt = null;
      match.unmatchedBy = null;
      await match.save();

      const conversation = await createConversationForMatchedUsers(userId, targetUserId);
      await createOrReuseConnectionForUsers(userId, targetUserId);
      return res.json({
        success: true,
        message: 'It is a match!',
        data: { matched: true, match, conversation }
      });
    }

    return res.json({
      success: true,
      message: 'Like already sent',
      data: { matched: false, match }
    });
  } catch (error) {
    if (typeof next === 'function') {
      return next(error);
    }
    throw error;
  }
};

export const discoverProfiles = async (req, res, next) => {
  try {
    const userId = req.userId.toString();
    const me = await User.findById(userId).select('_id status profile_approval_status role gender discoveringPreference').lean();
    if (!me || me.role !== 'user' || me.status !== 'active' || me.profile_approval_status !== 'approved') {
      throw new AppError('Complete approval to view profiles', 403);
    }
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const isLiteMode = String(req.query.lite || '1') !== '0';
    const genderFilter = String(req.query.genderFilter || 'both').toLowerCase().trim();
    const skip = (page - 1) * limit;

    // DEBUG: Log gender filter
    console.log(`🔍 [DISCOVER] User: ${userId} | Filter: ${genderFilter} | Gender: ${me.gender}`);

    // Validate gender filter
    const validGenderFilters = ['male', 'female', 'both'];
    if (!validGenderFilters.includes(genderFilter)) {
      throw new AppError('Invalid gender filter', 400);
    }

    // Get already matched users to exclude them
    const matchedUsers = await Match.find({
      users: userId,
      status: 'matched'
    })
      .select('users')
      .lean();

    const matchedUserIds = matchedUsers.flatMap(match => 
      match.users.filter(id => id.toString() !== userId)
    );

    // Fetch blocked users
    const blockedRows = await Block.find({
      $or: [{ blockerId: userId }, { blockedId: userId }]
    })
      .select('blockerId blockedId')
      .lean();

    const blockedUserIds = blockedRows.map((row) =>
      row.blockerId?.toString() === userId ? row.blockedId : row.blockerId
    );

    // Fetch users already in conversation with (to exclude them)
    const conversations = await Conversation.find({
      participants: userId
    })
      .select('participants')
      .lean();

    const conversationUserIds = conversations.flatMap(conv =>
      conv.participants.filter(id => id.toString() !== userId)
    );

    const excludedIds = [
      ...matchedUserIds,
      ...blockedUserIds,
      ...conversationUserIds  // Add conversation participants
    ];

    // Build discover filter with gender filtering
    let discoverFilter = {
      _id: { $ne: toObjectId(userId), $nin: excludedIds },
      role: 'user',
      status: 'active',
      profile_approval_status: 'approved',
      'privacy.allowDiscovery': { $ne: false }
    };

    // Apply gender filter based on user selection (case-insensitive)
    const normalizedGenderFilter = String(genderFilter || 'both').toLowerCase().trim();
    if (normalizedGenderFilter === 'male') {
      discoverFilter.gender = 'male';
    } else if (normalizedGenderFilter === 'female') {
      discoverFilter.gender = 'female';
    }
    // if 'both', no additional gender filter applied

    console.log(`📊 [DISCOVER FILTER] Applied: ${normalizedGenderFilter} | Excluded IDs: ${excludedIds.length}`);

    const totalCount = isLiteMode
      ? null
      : await User.countDocuments(discoverFilter);

    // Select only essential fields for fast loading
    const essentialFields = '_id name age gender year course shortAbout bio college profilePhoto verified_badge is_verified college_verification_status';
    
    const profiles = await User.find(discoverFilter)
      .select(essentialFields)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(`✅ [DISCOVER] Returned ${profiles.length} profiles | Total available: ${totalCount}`);

    const publicProfiles = profiles.map((profile) => ({
      _id: profile._id,
      name: profile.name,
      age: profile.age || null,
      gender: profile.gender,
      year: profile.year,
      course: profile.course,
      college: profile.college,
      shortAbout: profile.shortAbout || String(profile.bio || '').slice(0, 160),
      bio: profile.shortAbout || String(profile.bio || '').slice(0, 160),
      profilePhoto: profile.profilePhoto,
      verified_badge: Boolean(profile.verified_badge || profile.is_verified || profile.college_verification_status === 'verified')
    }));

    return res.json({
      success: true,
      data: {
        profiles: publicProfiles,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: totalCount === null ? null : Math.ceil(totalCount / limit),
          hasMore: totalCount === null ? publicProfiles.length === limit : skip + publicProfiles.length < totalCount
        },
        // Send filter metadata to frontend
        currentGenderFilter: genderFilter,
        userGender: me.gender,
        defaultPreference: me.discoveringPreference || (me.gender === 'female' ? 'male' : me.gender === 'male' ? 'female' : 'both')
      }
    });
  } catch (error) {
    next(error);
  }
};
