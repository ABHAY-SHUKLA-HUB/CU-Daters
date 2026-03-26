import express from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { verifyFirebaseOrJwtAuth } from '../middleware/authFirebaseOrJwt.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import Conversation from '../models/Conversation.js';
import PrivacyEvent from '../models/PrivacyEvent.js';
import ModerationCase from '../models/ModerationCase.js';
import AppSetting from '../models/AppSetting.js';
import ScreenshotLog from '../models/ScreenshotLog.js';
import { sendAdminSecurityNotification, sendPrivacyCaptureNotification } from '../socket/notificationSocket.js';
import { logActivity, getClientInfo } from '../utils/auth.js';

const router = express.Router();

const screenshotEventLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 120 : 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many screenshot/privacy events submitted. Please slow down.'
  }
});

const allowedPlatforms = new Set(['android', 'ios', 'web', 'unknown']);
const allowedContexts = new Set(['chat', 'profile', 'other']);

const normalizeObjectId = (value, fieldName) => {
  if (!value) return null;
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
  return new mongoose.Types.ObjectId(value);
};

const computeRiskScore = ({ screenshots24h, sameTarget7d, screenshotCount7d, platform, supportedSignal }) => {
  let score = 0;
  score += Math.min(45, screenshots24h * 12);
  score += Math.min(35, sameTarget7d * 9);
  score += Math.min(15, screenshotCount7d * 2);

  if (platform === 'web' && !supportedSignal) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
};

router.use(verifyFirebaseOrJwtAuth);

router.get('/capabilities', asyncHandler(async (_req, res) => {
  return res.json({
    success: true,
    data: {
      disclaimer: 'Best-effort privacy protections only. Screenshot prevention and detection depend on platform capabilities.',
      android: {
        prevention: 'Use FLAG_SECURE on sensitive screens (chat/profile).',
        detection: 'Android 13+ screenshot callback can be reported to this API.',
        guaranteed: false
      },
      ios: {
        prevention: 'No full screenshot prevention for standard app surfaces.',
        detection: 'Use UIApplicationUserDidTakeScreenshot and UIScreen.isCaptured signals.',
        guaranteed: false
      },
      web: {
        prevention: 'Not fully preventable in browser environments.',
        detection: 'No reliable screenshot detection. Deterrence + best-effort signals only.',
        guaranteed: false
      }
    }
  });
}));

router.post('/screenshot-event', screenshotEventLimiter, asyncHandler(async (req, res) => {
  const authenticatedActorId = req.userId?.toString();
  const {
    actorUserId,
    targetUserId,
    conversationId,
    timestamp,
    platform = 'unknown',
    contextType = 'chat',
    detectionSignal = 'unknown',
    supportedSignal = false,
    notifyTargetUser = true,
    metadata = {}
  } = req.body || {};

  const normalizedActorId = String(actorUserId || authenticatedActorId || '').trim();
  if (!normalizedActorId) {
    throw new AppError('actorUserId is required', 400);
  }

  if (normalizedActorId !== authenticatedActorId) {
    throw new AppError('actorUserId must match authenticated user', 403);
  }

  const normalizedPlatform = String(platform || 'unknown').toLowerCase();
  if (!allowedPlatforms.has(normalizedPlatform)) {
    throw new AppError('platform must be android, ios, web, or unknown', 400);
  }

  const normalizedContextType = String(contextType || 'chat').toLowerCase();
  if (!allowedContexts.has(normalizedContextType)) {
    throw new AppError('contextType must be chat, profile, or other', 400);
  }

  const actorIdObj = normalizeObjectId(normalizedActorId, 'actorUserId');
  const conversationIdObj = normalizeObjectId(conversationId, 'conversationId');
  let targetIdObj = normalizeObjectId(targetUserId, 'targetUserId');

  let conversation = null;
  if (conversationIdObj) {
    conversation = await Conversation.findById(conversationIdObj).select('_id participants').lean();
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    const participantIds = Array.isArray(conversation.participants)
      ? conversation.participants.map((id) => String(id))
      : [];

    if (!participantIds.includes(normalizedActorId)) {
      throw new AppError('Actor is not a participant of this conversation', 403);
    }

    if (!targetIdObj) {
      const otherId = participantIds.find((id) => id !== normalizedActorId);
      if (otherId && mongoose.Types.ObjectId.isValid(otherId)) {
        targetIdObj = new mongoose.Types.ObjectId(otherId);
      }
    }
  }

  const occurredAt = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(occurredAt.getTime())) {
    throw new AppError('timestamp is invalid', 400);
  }

  const [screenshots24h, sameTarget7d, screenshotCount7d] = await Promise.all([
    ScreenshotLog.countDocuments({
      actorUserId: actorIdObj,
      occurredAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }),
    targetIdObj
      ? ScreenshotLog.countDocuments({
          actorUserId: actorIdObj,
          targetUserId: targetIdObj,
          occurredAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
      : Promise.resolve(0),
    ScreenshotLog.countDocuments({
      actorUserId: actorIdObj,
      occurredAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
  ]);

  const riskScore = computeRiskScore({
    screenshots24h,
    sameTarget7d,
    screenshotCount7d,
    platform: normalizedPlatform,
    supportedSignal: Boolean(supportedSignal)
  });

  const suspicious = riskScore >= 65 || screenshots24h >= 3 || sameTarget7d >= 4;

  const screenshotLog = await ScreenshotLog.create({
    actorUserId: actorIdObj,
    targetUserId: targetIdObj,
    conversationId: conversationIdObj,
    occurredAt,
    platform: normalizedPlatform,
    contextType: normalizedContextType,
    detectionSignal: String(detectionSignal || 'unknown').slice(0, 80),
    supportedSignal: Boolean(supportedSignal),
    riskScore,
    suspicious,
    metadata,
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown'
  });

  await PrivacyEvent.create({
    userId: actorIdObj,
    conversationId: conversationIdObj || null,
    eventType: normalizedPlatform === 'ios' && String(detectionSignal || '').includes('screen_recording')
      ? 'screen_recording_detected'
      : 'screenshot_detected',
    platform: normalizedPlatform,
    supportedSignal: Boolean(supportedSignal),
    metadata: {
      screenshotLogId: screenshotLog._id,
      targetUserId: targetIdObj ? String(targetIdObj) : null,
      detectionSignal: String(detectionSignal || 'unknown'),
      riskScore,
      suspicious,
      ...metadata
    },
    consentContext: 'security_screenshot_event',
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown'
  });

  if (suspicious && targetIdObj) {
    await ModerationCase.create({
      sourceType: 'privacy_event',
      sourceId: screenshotLog._id.toString(),
      targetUserId: targetIdObj,
      severity: riskScore >= 80 ? 'high' : 'medium',
      status: 'open',
      summary: `Suspicious screenshot activity detected (risk ${riskScore})`,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
  }

  const io = req.app?.locals?.io;
  let notificationSuppressed = false;
  let notifiedTarget = false;

  if (io && targetIdObj && notifyTargetUser) {
    const silentSetting = await AppSetting.findOne({ key: 'privacy_screenshot_silent_mode' }).lean();
    const silentMode = Boolean(silentSetting?.value === true || String(silentSetting?.value || '').toLowerCase() === 'true');

    if (silentMode) {
      notificationSuppressed = true;
    } else {
      sendPrivacyCaptureNotification(io, String(targetIdObj), {
        type: 'screenshot_event',
        actorUserId: normalizedActorId,
        targetUserId: String(targetIdObj),
        conversationId: conversationIdObj ? String(conversationIdObj) : null,
        platform: normalizedPlatform,
        occurredAt,
        riskScore,
        bestEffort: true,
        message: 'A screenshot-related event was detected in this conversation on a supported device.'
      });
      notifiedTarget = true;
    }
  }

  screenshotLog.notifiedTarget = notifiedTarget;
  screenshotLog.notificationSuppressed = notificationSuppressed;
  await screenshotLog.save();

  if (io) {
    sendAdminSecurityNotification(io, {
      type: 'screenshot_event',
      severity: suspicious ? 'high' : 'medium',
      message: `Screenshot event detected (${normalizedPlatform})`,
      actorUserId: normalizedActorId,
      targetUserId: targetIdObj ? String(targetIdObj) : null,
      screenshotLogId: screenshotLog._id,
      riskScore,
      suspicious
    });
  }

  await logActivity({
    user_id: actorIdObj,
    action: 'screenshot_event_logged',
    description: `Screenshot event logged on ${normalizedPlatform}`,
    target_user_id: targetIdObj || null,
    target_type: normalizedContextType,
    target_id: conversationIdObj || null,
    status: 'success',
    metadata: {
      platform: normalizedPlatform,
      supportedSignal: Boolean(supportedSignal),
      riskScore,
      suspicious,
      screenshotLogId: screenshotLog._id,
      detectionSignal
    },
    ...getClientInfo(req)
  });

  return res.status(201).json({
    success: true,
    message: 'Screenshot event captured (best effort)',
    data: {
      eventId: screenshotLog._id,
      riskScore,
      suspicious,
      notifiedTarget,
      notificationSuppressed,
      platform: normalizedPlatform,
      limitations: 'Screenshot detection and prevention are platform dependent and cannot be guaranteed on all devices.'
    }
  });
}));

export default router;
