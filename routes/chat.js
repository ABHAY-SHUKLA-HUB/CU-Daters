import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { asyncHandler } from '../utils/errorHandler.js';
import {
  blockConversationUser,
  createMatchAndConversation,
  createOrGetConversation,
  deleteConversation,
  getConversationMessages,
  getMyConversations,
  getUnreadSummary,
  getMyMatches,
  markConversationSeen,
  reactToMessage,
  sendMessage,
  updateConversationNickname,
  updateConversationTheme,
  uploadConversationAttachment,
  unmatchConversationUsers,
  discoverProfiles,
  swipeProfile
} from '../controllers/chatController.js';
import { verifyFirebaseOrJwtAuth } from '../middleware/authFirebaseOrJwt.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const chatUploadDir = path.join(__dirname, '..', 'uploads', 'chat');
if (!fs.existsSync(chatUploadDir)) {
  fs.mkdirSync(chatUploadDir, { recursive: true });
}

const chatAttachmentStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, chatUploadDir),
  filename: (_, file, cb) => {
    const safeOriginal = String(file.originalname || 'file')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeOriginal}`);
  }
});

const chatUpload = multer({
  storage: chatAttachmentStorage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

const messageLimiter = rateLimit({
  windowMs: 15 * 1000,
  max: 45,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many messages sent in a short burst. Please try again in a few seconds.'
  }
});

router.use(verifyFirebaseOrJwtAuth);

router.get('/discover', asyncHandler(discoverProfiles));
router.post('/swipe', asyncHandler(swipeProfile));
router.get('/matches', asyncHandler(getMyMatches));
router.post('/matches', asyncHandler(createMatchAndConversation));

router.post('/conversations', asyncHandler(createOrGetConversation));
router.get('/conversations', asyncHandler(getMyConversations));
router.get('/conversations/unread-summary', asyncHandler(getUnreadSummary));
router.get('/conversations/:conversationId/messages', asyncHandler(getConversationMessages));
router.post('/conversations/:conversationId/attachments', chatUpload.single('file'), asyncHandler(uploadConversationAttachment));
router.post('/conversations/:conversationId/messages', messageLimiter, asyncHandler(sendMessage));
router.post('/conversations/:conversationId/messages/:messageId/reactions', asyncHandler(reactToMessage));
router.post('/conversations/:conversationId/seen', asyncHandler(markConversationSeen));
router.patch('/conversations/:conversationId/theme', asyncHandler(updateConversationTheme));
router.patch('/conversations/:conversationId/nickname', asyncHandler(updateConversationNickname));
router.post('/conversations/:conversationId/block', asyncHandler(blockConversationUser));
router.post('/conversations/:conversationId/unmatch', asyncHandler(unmatchConversationUsers));
router.delete('/conversations/:conversationId', asyncHandler(deleteConversation));

export default router;
