import express from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import User from '../models/User.js';
import VerificationSubmission from '../models/VerificationSubmission.js';
import Subscription from '../models/Subscription.js';
import ActivityLog from '../models/ActivityLog.js';
import Match from '../models/Match.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';
import College from '../models/College.js';
import SupportTicket from '../models/SupportTicket.js';
import AppSetting from '../models/AppSetting.js';
import Like from '../models/Like.js';
<<<<<<< HEAD
import AdminSession from '../models/AdminSession.js';
import ImmutableAuditLog from '../models/ImmutableAuditLog.js';
import ModerationCase from '../models/ModerationCase.js';
import AppealRequest from '../models/AppealRequest.js';
import PrivacyEvent from '../models/PrivacyEvent.js';
import DataDeletionRequest from '../models/DataDeletionRequest.js';
import ScreenshotLog from '../models/ScreenshotLog.js';
import { verifyAdmin, verifyAdminRole, logActivity, getClientInfo, ADMIN_ROLES } from '../utils/auth.js';
=======
import CareerApplication from '../models/CareerApplication.js';
import { verifyAdmin, verifyAdminRole, logActivity, generateToken, getClientInfo, ADMIN_ROLES } from '../utils/auth.js';
>>>>>>> 8603a53246669d81d74718efbf0c3d1aa17377ae
import { sanitizeUser, errorResponse, successResponse } from '../utils/validation.js';
import { sendApprovalEmail, sendRejectionEmail } from '../utils/emailService.js';
import { requirePermission } from '../middleware/authorization.js';
import { adminCriticalLimiter, enforceAdminSessionSecurity, sanitizeRequestStrings } from '../middleware/adminSecurity.js';
import {
  buildStepUpToken,
  createAdminSession,
  rotateAdminSession,
  revokeSession,
  revokeAllSessionsForAdmin,
  getRefreshTokenFromRequest,
  setAdminAuthCookies,
  clearAdminAuthCookies,
  verifyStepUpToken
} from '../services/securityService.js';
import { resolveVerificationMediaPath } from '../utils/verificationStorage.js';
import ExcelJS from 'exceljs';

const router = express.Router();

const FINANCE_ROLES = ['admin', 'super_admin', 'finance_admin'];
const MODERATION_ROLES = ['admin', 'super_admin', 'moderator'];
const SUPER_ROLES = ['admin', 'super_admin'];
const CHAT_REVIEW_ROLES = ['super_admin', 'moderator', 'admin'];
const SUPPORT_ROLES = ['super_admin', 'admin', 'support_admin'];
const ANALYST_ROLES = ['super_admin', 'admin', 'analyst'];

const isAdminFullChatViewEnabled = () => String(process.env.ENABLE_ADMIN_FULL_CHAT_VIEW || '').toLowerCase() === 'true';

const requiresAdminPin = () => Boolean(process.env.ADMIN_PIN);

const verifyAdminPin = (req, res, next) => {
  if (!requiresAdminPin()) {
    return next();
  }

  const providedPin = req.headers['x-admin-pin'];
  if (!providedPin || providedPin !== process.env.ADMIN_PIN) {
    return res.status(403).json(errorResponse('Admin PIN verification required'));
  }

  next();
};

const requireSensitiveReason = (res, { reason, action, label = 'Reason' }) => {
  const needsReason = ['ban', 'suspend', 'delete', 'freeze_chat', 'revoke', 'escalated', 'rejected'].includes(String(action || '').toLowerCase());
  if (!needsReason) {
    return true;
  }

  const normalized = String(reason || '').trim();
  if (normalized.length < 5) {
    res.status(400).json(errorResponse(`${label} is required for this action (min 5 characters)`));
    return false;
  }

  return true;
};

const hasStepUpScope = (req, scope = 'critical:*') => {
  const pin = req.headers['x-admin-pin'];
  if (pin && process.env.ADMIN_PIN && pin === process.env.ADMIN_PIN) {
    return true;
  }

  const token = req.headers['x-step-up-token'] || req.body?.stepUpToken;
  if (!token) {
    return false;
  }

  const decoded = verifyStepUpToken(token);
  if (!decoded) {
    return false;
  }

  if (String(decoded.userId) !== String(req.user?._id || '')) {
    return false;
  }

  const scopes = Array.isArray(decoded.scopes) ? decoded.scopes : [];
  return scopes.includes('critical:*') || scopes.includes(scope);
};

const enforceStepUp = (req, res, scope, message = 'Step-up verification required') => {
  if (!hasStepUpScope(req, scope)) {
    res.status(403).json(errorResponse(message));
    return false;
  }
  return true;
};

// ===== ADMIN LOGIN =====
router.post('/login', async (req, res) => {
  console.log('\n========== ADMIN LOGIN ==========');
  
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(errorResponse('Email and password are required'));
    }

    const admin = await User.findOne({
      email: email.toLowerCase(),
      role: { $in: ADMIN_ROLES }
    });

    if (!admin) {
      return res.status(401).json(errorResponse('Invalid admin credentials'));
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json(errorResponse('Invalid admin credentials'));
    }

    // Update last login
    admin.last_login = new Date();
    await admin.save();

    // Log activity
    await logActivity({
      admin_id: admin._id,
      action: 'admin_login',
      description: 'Admin logged in',
      ...getClientInfo(req),
      status: 'success'
    });

    const { session, accessToken, refreshToken, csrfToken, suspicious } = await createAdminSession({
      admin,
      req,
      mfaVerified: false
    });

    setAdminAuthCookies(res, { refreshToken, csrfToken });

    console.log(`✓ Admin logged in: ${admin._id} (${email})`);

    res.json(
      successResponse('Admin login successful', {
        token: accessToken,
        accessToken,
        csrfToken,
        user: sanitizeUser(admin),
        session: {
          sessionId: session._id,
          expiresAt: session.expiresAt,
          ipAddress: session.ipAddress,
          deviceInfo: session.deviceInfo,
          suspicious
        }
      })
    );
  } catch (error) {
    console.error('❌ Admin Login Error:', error);
    res.status(500).json(errorResponse('Admin login failed: ' + error.message));
  }
});

// ===== OPTIONAL ADMIN PIN VERIFICATION =====
router.post('/verify-pin', verifyAdmin, async (req, res) => {
  try {
    if (!requiresAdminPin()) {
      return res.json(successResponse('Admin PIN is not enabled', { verified: true, enabled: false }));
    }

    const { pin } = req.body;
    if (!pin || pin !== process.env.ADMIN_PIN) {
      return res.status(403).json(errorResponse('Invalid admin PIN'));
    }

    await logActivity({
      admin_id: req.user._id,
      action: 'admin_pin_verify',
      description: 'Admin completed second-layer PIN verification',
      ...getClientInfo(req)
    });

    return res.json(successResponse('Admin PIN verified', { verified: true, enabled: true }));
  } catch (error) {
    console.error('❌ Verify PIN Error:', error);
    return res.status(500).json(errorResponse('Failed to verify admin PIN'));
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
      clearAdminAuthCookies(res);
      return res.status(401).json(errorResponse('Refresh token missing'));
    }

    const rotated = await rotateAdminSession({ refreshToken, req });
    if (!rotated) {
      clearAdminAuthCookies(res);
      return res.status(401).json(errorResponse('Refresh token invalid or expired'));
    }

    setAdminAuthCookies(res, {
      refreshToken: rotated.refreshToken,
      csrfToken: rotated.csrfToken
    });

    return res.json(successResponse('Admin token refreshed', {
      token: rotated.accessToken,
      accessToken: rotated.accessToken,
      csrfToken: rotated.csrfToken,
      sessionId: rotated.session._id
    }));
  } catch (error) {
    console.error('❌ Admin Refresh Error:', error);
    clearAdminAuthCookies(res);
    return res.status(500).json(errorResponse('Failed to refresh admin session'));
  }
});

router.post('/logout', verifyAdmin, async (req, res) => {
  try {
    if (req.authSessionId) {
      await revokeSession({ sessionId: req.authSessionId, reason: 'logout' });
    }
    clearAdminAuthCookies(res);
    return res.json(successResponse('Logged out from current session'));
  } catch (error) {
    console.error('❌ Admin Logout Error:', error);
    return res.status(500).json(errorResponse('Failed to logout admin session'));
  }
});

router.post('/logout-all', verifyAdmin, async (req, res) => {
  try {
    await revokeAllSessionsForAdmin({ adminId: req.user._id, reason: 'logout_all_by_admin' });
    clearAdminAuthCookies(res);

    await logActivity({
      admin_id: req.user._id,
      action: 'admin_logout_all_sessions',
      description: 'Admin logged out all active sessions',
      ...getClientInfo(req),
      status: 'success'
    });

    return res.json(successResponse('All sessions logged out successfully'));
  } catch (error) {
    console.error('❌ Admin Logout All Error:', error);
    return res.status(500).json(errorResponse('Failed to logout all sessions'));
  }
});

router.get('/sessions', verifyAdmin, async (req, res) => {
  try {
    const sessions = await AdminSession.find({ adminId: req.user._id })
      .sort({ lastActivityAt: -1 })
      .limit(100)
      .lean();

    return res.json(successResponse('Admin sessions fetched', {
      sessions: sessions.map((session) => ({
        sessionId: session._id,
        role: session.role,
        ipAddress: session.ipAddress,
        deviceInfo: session.deviceInfo,
        userAgent: session.userAgent,
        lastActivityAt: session.lastActivityAt,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
        suspicious: Boolean(session.suspicious),
        isCurrent: String(session._id) === String(req.authSessionId || '')
      }))
    }));
  } catch (error) {
    console.error('❌ Admin Sessions Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch admin sessions'));
  }
});

router.delete('/sessions/:sessionId', verifyAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await AdminSession.findOne({ _id: sessionId, adminId: req.user._id });
    if (!session) {
      return res.status(404).json(errorResponse('Session not found'));
    }

    await revokeSession({ sessionId, reason: 'manual_session_revoke' });
    return res.json(successResponse('Session revoked successfully'));
  } catch (error) {
    console.error('❌ Revoke Session Error:', error);
    return res.status(500).json(errorResponse('Failed to revoke session'));
  }
});

router.post('/step-up/verify', verifyAdmin, async (req, res) => {
  try {
    const { pin, password, scopes = [] } = req.body || {};
    const allowedScopes = [
      'critical:delete_user',
      'critical:ban_user',
      'critical:freeze_chat',
      'critical:pricing_change',
      'critical:payment_override',
      'critical:view_private_chat',
      'critical:settings_change',
      'critical:*'
    ];

    const requestedScopes = Array.isArray(scopes) && scopes.length
      ? scopes.filter((scope) => allowedScopes.includes(scope))
      : ['critical:*'];

    let verified = false;
    let method = 'none';

    if (pin && process.env.ADMIN_PIN && String(pin) === String(process.env.ADMIN_PIN)) {
      verified = true;
      method = 'pin';
    }

    if (!verified && password) {
      verified = await req.user.comparePassword(String(password));
      method = verified ? 'password' : 'none';
    }

    if (!verified) {
      return res.status(403).json(errorResponse('Step-up verification failed'));
    }

    const token = buildStepUpToken({
      userId: req.user._id.toString(),
      role: req.user.role,
      sessionId: req.authSessionId,
      scopes: requestedScopes
    });

    await logActivity({
      admin_id: req.user._id,
      action: 'admin_step_up_verified',
      description: `Admin completed step-up verification via ${method}`,
      metadata: { method, requestedScopes },
      ...getClientInfo(req),
      status: 'success'
    });

    return res.json(successResponse('Step-up verified', {
      token,
      method,
      scopes: requestedScopes,
      expiresInSeconds: 300
    }));
  } catch (error) {
    console.error('❌ Step-up Verify Error:', error);
    return res.status(500).json(errorResponse('Failed to complete step-up verification'));
  }
});

router.use(verifyAdmin, adminCriticalLimiter, sanitizeRequestStrings, enforceAdminSessionSecurity);

// ===== OVERVIEW STATS =====
router.get('/stats/overview', requirePermission('admin.dashboard.read'), async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      activeToday,
      newRegistrations,
      verifiedUsers,
      pendingProfileApprovals,
      pendingRegistrationApprovals,
      totalMatches,
      totalChats,
      activeReports,
      flaggedChats,
      suspiciousUsers,
      blockedAccounts,
      premiumUsers,
      pendingPaymentReviews,
      monthlyRevenueAgg,
      totalRevenueAgg,
      activeSubscriptions,
      recentActivity,
      openTickets
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', status: 'active' }),
      User.countDocuments({ role: 'user', $or: [{ last_active_at: { $gte: startOfToday } }, { last_login: { $gte: startOfToday } }, { updated_at: { $gte: startOfToday } }] }),
      User.countDocuments({ role: 'user', created_at: { $gte: startOfToday } }),
      User.countDocuments({ role: 'user', is_verified: true }),
      User.countDocuments({ role: 'user', profile_approval_status: { $in: ['pending', 'needs_correction'] } }),
      User.countDocuments({ role: 'user', status: 'pending' }),
      Match.countDocuments({ status: 'matched' }),
      Conversation.countDocuments({}),
      Report.countDocuments({ status: { $in: ['open', 'investigating'] } }),
      Report.countDocuments({ target_type: { $in: ['chat', 'conversation'] }, status: { $in: ['open', 'investigating'] } }),
      User.countDocuments({ role: 'user', $or: [{ warnings_count: { $gte: 2 } }, { status: { $in: ['banned', 'suspended'] } }] }),
      User.countDocuments({ role: 'user', status: { $in: ['banned', 'suspended'] } }),
      User.countDocuments({ role: 'user', subscription_status: { $in: ['active', 'approved'] } }),
      Subscription.countDocuments({ status: 'pending' }),
      Subscription.aggregate([
        { $match: { status: { $in: ['approved', 'active'] }, created_at: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Subscription.aggregate([
        { $match: { status: { $in: ['approved', 'active'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Subscription.countDocuments({ status: { $in: ['approved', 'active'] } }),
      ActivityLog.find({}).sort({ timestamp: -1 }).limit(12).lean(),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } })
    ]);

    const dbConnected = mongoose.connection.readyState === 1;
    const paymentsHealth = pendingPaymentReviews > 25 ? 'degraded' : 'healthy';
    const safetyHealth = activeReports > 20 ? 'degraded' : 'healthy';

    return res.json(successResponse('Overview statistics fetched', {
      totalUsers,
      activeUsers,
      activeToday,
      newRegistrations,
      verifiedUsers,
      pendingApprovals: pendingProfileApprovals,
      pendingProfileApprovals,
      pendingRegistrationApprovals,
      totalMatches,
      totalChats,
      reportsCount: activeReports,
      activeReports,
      flaggedChats,
      suspiciousUsers,
      blockedAccounts,
      premiumUsers,
      pendingPaymentReviews,
      monthlyRevenue: monthlyRevenueAgg[0]?.total || 0,
      totalRevenue: totalRevenueAgg[0]?.total || 0,
      activeSubscriptions,
      openTickets,
      liveQueue: {
        registration: pendingRegistrationApprovals,
        profiles: pendingProfileApprovals,
        payments: pendingPaymentReviews,
        reports: activeReports,
        support: openTickets
      },
      systemHealth: {
        api: 'healthy',
        database: dbConnected ? 'healthy' : 'outage',
        payments: paymentsHealth,
        storage: 'healthy',
        safety: safetyHealth
      },
      platformAlerts: [
        ...(activeReports > 0 ? [`${activeReports} unresolved safety reports`] : []),
        ...(pendingProfileApprovals > 0 ? [`${pendingProfileApprovals} profile approvals pending`] : []),
        ...(pendingRegistrationApprovals > 0 ? [`${pendingRegistrationApprovals} registration approvals pending`] : []),
        ...(pendingPaymentReviews > 0 ? [`${pendingPaymentReviews} payments awaiting review`] : []),
        ...(openTickets > 0 ? [`${openTickets} support tickets open`] : [])
      ],
      recentActivity
    }));
  } catch (error) {
    console.error('❌ Overview Stats Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch overview stats'));
  }
});

// ===== PROFILE APPROVAL QUEUE =====
router.get('/profile-approvals', requirePermission('admin.users.read'), async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const allowed = ['pending', 'approved', 'rejected', 'needs_correction', 'all'];
    if (!allowed.includes(status)) {
      return res.status(400).json(errorResponse('Invalid profile approval status filter'));
    }

    const filter = { role: 'user' };
    if (status !== 'all') {
      filter.profile_approval_status = status;
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ updated_at: -1 })
      .limit(100)
      .lean();

    return res.json(successResponse('Profile approval queue fetched', { data: users }));
  } catch (error) {
    console.error('❌ Profile Queue Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch profile approval queue'));
  }
});

// ===== GET PENDING REGISTRATIONS FOR APPROVAL =====
router.get('/registration-approvals', requirePermission('admin.users.read'), async (req, res) => {
  try {
    // Get users with status = 'pending' (pending signup approval)
    const pendingUsers = await User.find({ status: 'pending', role: 'user' })
      .select('-password -livePhoto -idCard')
      .sort({ created_at: -1 })
      .lean();

    const userIds = pendingUsers.map((item) => item._id);
    const submissions = await VerificationSubmission.find({ userId: { $in: userIds } })
      .select('userId status idProofType submittedAt reviewedAt reviewNotes rejectionReason updatedAt history documents.selfie documents.idProof')
      .lean();
    const submissionByUser = new Map(submissions.map((item) => [String(item.userId), item]));

    const data = pendingUsers.map((user) => {
      const submission = submissionByUser.get(String(user._id));
      if (!submission) {
        return {
          ...user,
          verificationSubmission: null
        };
      }

      return {
        ...user,
        verificationSubmission: {
          id: submission._id,
          status: submission.status,
          idProofType: submission.idProofType,
          submittedAt: submission.submittedAt,
          reviewedAt: submission.reviewedAt,
          reviewNotes: submission.reviewNotes,
          rejectionReason: submission.rejectionReason,
          updatedAt: submission.updatedAt,
          history: Array.isArray(submission.history) ? submission.history.slice(-12) : [],
          hasSelfie: Boolean(submission.documents?.selfie?.storageKey),
          hasIdProof: Boolean(submission.documents?.idProof?.storageKey)
        }
      };
    });

    return res.json(successResponse('Pending registrations fetched', { 
      data,
      count: data.length 
    }));
  } catch (error) {
    console.error('❌ Pending Registrations Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch pending registrations'));
  }
});

// ===== APPROVE PENDING USER REGISTRATION =====
router.put('/registrations/:userId/approve', requirePermission('admin.users.moderate'), verifyAdminPin, async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const beforeState = {
      status: user.status,
      suspended_until: user.suspended_until,
      warnings_count: user.warnings_count,
      chat_frozen: user.chat_frozen
    };

    if (user.status !== 'pending') {
      return res.status(400).json(errorResponse('User registration is not pending'));
    }

    // Update user status to 'active'
    user.status = 'active';
    user.is_verified = true;
    user.verification_status = 'approved';
    user.profile_approval_status = 'approved';
    user.updated_at = new Date();

    const submission = await VerificationSubmission.findOne({ userId: user._id });
    if (submission) {
      submission.status = 'approved';
      submission.reviewNotes = String(adminNotes || '').trim().slice(0, 1000);
      submission.rejectionReason = '';
      submission.reviewedAt = new Date();
      submission.reviewedBy = req.user?._id;
      submission.history.push({
        action: 'approved',
        byAdmin: req.user?._id,
        note: String(adminNotes || 'Registration approved').slice(0, 1000)
      });
      await submission.save();
    }

    await user.save();

    const afterState = {
      status: user.status,
      suspended_until: user.suspended_until,
      warnings_count: user.warnings_count,
      chat_frozen: user.chat_frozen
    };

    console.log(`✓ User registration approved: ${user.email}`);

    // Send approval email to user
    try {
      await sendApprovalEmail(user.email, user.name);
      console.log(`📧 Approval email sent to: ${user.email}`);
    } catch (emailError) {
      console.error('⚠️ Failed to send approval email:', emailError.message);
      // Don't reject the approval just because email failed
    }

    await logActivity({
      admin_id: req.user._id,
      action: 'registration_approved',
      description: `Approved pending registration for ${user.email}`,
      target_user_id: user._id,
      target_type: 'user',
      target_id: user._id,
      before_state: beforeState,
      after_state: afterState,
      metadata: { adminNotes },
      ...getClientInfo(req),
      status: 'success'
    });

    return res.json(successResponse('User registration approved', sanitizeUser(user)));
  } catch (error) {
    console.error('❌ Registration Approval Error:', error);
    return res.status(500).json(errorResponse('Failed to approve registration'));
  }
});

// ===== REJECT PENDING USER REGISTRATION =====
router.put('/registrations/:userId/reject', requirePermission('admin.users.moderate'), verifyAdminPin, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json(errorResponse('Rejection reason required'));
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const beforeState = {
      status: user.status,
      suspended_until: user.suspended_until,
      warnings_count: user.warnings_count,
      chat_frozen: user.chat_frozen
    };

    if (user.status !== 'pending') {
      return res.status(400).json(errorResponse('User registration is not pending'));
    }

    // Update user status to 'rejected'
    user.status = 'rejected';
    user.profile_approval_status = 'rejected';
    user.verification_status = 'rejected';
    user.is_verified = false;
    user.updated_at = new Date();

    const submission = await VerificationSubmission.findOne({ userId: user._id });
    if (submission) {
      submission.status = 'rejected';
      submission.reviewNotes = '';
      submission.rejectionReason = String(reason || '').trim().slice(0, 1000);
      submission.reviewedAt = new Date();
      submission.reviewedBy = req.user?._id;
      submission.history.push({
        action: 'rejected',
        byAdmin: req.user?._id,
        note: String(reason || 'Registration rejected').slice(0, 1000)
      });
      await submission.save();
    }

    await user.save();

    const afterState = {
      status: user.status,
      suspended_until: user.suspended_until,
      warnings_count: user.warnings_count,
      chat_frozen: user.chat_frozen
    };

    console.log(`✓ User registration rejected: ${user.email} - Reason: ${reason}`);

    // Send rejection email to user
    try {
      await sendRejectionEmail(user.email, user.name, reason);
      console.log(`📧 Rejection email sent to: ${user.email}`);
    } catch (emailError) {
      console.error('⚠️ Failed to send rejection email:', emailError.message);
      // Don't reject the operation just because email failed
    }

    await logActivity({
      admin_id: req.user._id,
      action: 'registration_rejected',
      description: `Rejected pending registration for ${user.email}. Reason: ${reason}`,
      target_user_id: user._id,
      target_type: 'user',
      target_id: user._id,
      before_state: beforeState,
      after_state: afterState,
      metadata: { reason },
      ...getClientInfo(req),
      status: 'success'
    });

    return res.json(successResponse('User registration rejected', sanitizeUser(user)));
  } catch (error) {
    console.error('❌ Registration Rejection Error:', error);
    return res.status(500).json(errorResponse('Failed to reject registration'));
  }
});

router.put('/registrations/:userId/resubmission', requirePermission('admin.users.moderate'), verifyAdminPin, async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim();
    if (reason.length < 5) {
      return res.status(400).json(errorResponse('Resubmission note is required (min 5 characters)'));
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const submission = await VerificationSubmission.findOne({ userId: user._id });
    if (!submission) {
      return res.status(404).json(errorResponse('Verification submission not found'));
    }

    submission.status = 'resubmission_required';
    submission.reviewNotes = reason.slice(0, 1000);
    submission.rejectionReason = '';
    submission.reviewedAt = new Date();
    submission.reviewedBy = req.user?._id;
    submission.history.push({
      action: 'resubmission_requested',
      byAdmin: req.user?._id,
      note: reason.slice(0, 1000)
    });
    await submission.save();

    user.verification_status = 'resubmission_required';
    user.profile_approval_status = 'needs_correction';
    user.status = 'pending';
    user.profile_admin_notes = reason.slice(0, 1000);
    user.updated_at = new Date();
    await user.save();

    await logActivity({
      admin_id: req.user._id,
      action: 'registration_resubmission_requested',
      description: `Requested verification resubmission for ${user.email}`,
      target_user_id: user._id,
      target_type: 'user',
      target_id: user._id,
      metadata: { reason: reason.slice(0, 1000) },
      ...getClientInfo(req),
      status: 'success'
    });

    return res.json(successResponse('Resubmission requested successfully'));
  } catch (error) {
    console.error('❌ Registration Resubmission Error:', error);
    return res.status(500).json(errorResponse('Failed to request resubmission'));
  }
});

router.get('/verification-files/:submissionId/:documentType', requirePermission('admin.users.read'), verifyAdminRole(MODERATION_ROLES), async (req, res) => {
  try {
    const { submissionId, documentType } = req.params;
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json(errorResponse('Invalid submission id'));
    }

    const submission = await VerificationSubmission.findById(submissionId)
      .select('userId documents')
      .lean();

    if (!submission) {
      return res.status(404).json(errorResponse('Verification submission not found'));
    }

    const key = documentType === 'selfie' ? 'selfie' : documentType === 'id-proof' ? 'idProof' : null;
    if (!key) {
      return res.status(400).json(errorResponse('Invalid document type'));
    }

    const document = submission.documents?.[key];
    if (!document?.storageKey) {
      return res.status(404).json(errorResponse('Verification file not found'));
    }

    const filePath = resolveVerificationMediaPath(document.storageKey);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(errorResponse('Verification file missing from storage'));
    }

    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(500).json(errorResponse('Failed to read verification file'));
      } else {
        res.destroy();
      }
    });
    stream.pipe(res);
  } catch (error) {
    console.error('❌ Verification File Fetch Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch verification file'));
  }
});

router.put('/users/:userId/profile-approval', requirePermission('admin.users.moderate'), verifyAdminPin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['approved', 'rejected', 'needs_correction', 'pending'].includes(status)) {
      return res.status(400).json(errorResponse('Invalid profile approval status'));
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const beforeState = {
      status: user.status,
      suspended_until: user.suspended_until,
      warnings_count: user.warnings_count,
      chat_frozen: user.chat_frozen
    };

    user.profile_approval_status = status;
    user.profile_admin_notes = adminNotes || '';
    user.is_verified = status === 'approved';
    user.status = status === 'approved' ? 'active' : user.status;
    user.updated_at = new Date();
    await user.save();

    const afterState = {
      status: user.status,
      suspended_until: user.suspended_until,
      warnings_count: user.warnings_count,
      chat_frozen: user.chat_frozen
    };

    await logActivity({
      admin_id: req.user._id,
      action: 'profile_approval_update',
      description: `Updated profile approval for ${user.email} to ${status}`,
      target_user_id: user._id,
      target_type: 'user',
      target_id: user._id,
      before_state: beforeState,
      after_state: afterState,
      metadata: { status, adminNotes },
      ...getClientInfo(req)
    });

    return res.json(successResponse('Profile approval updated', sanitizeUser(user)));
  } catch (error) {
    console.error('❌ Profile Approval Update Error:', error);
    return res.status(500).json(errorResponse('Failed to update profile approval'));
  }
});

// ===== USER MODERATION ACTIONS =====
router.put('/users/:userId/moderation', requirePermission('admin.users.moderate'), verifyAdminPin, async (req, res) => {
  try {
    const { action, reason, suspendedUntil } = req.body;
    const allowed = ['ban', 'unban', 'suspend', 'unsuspend', 'warn', 'freeze_chat', 'unfreeze_chat', 'delete'];
    const criticalActions = new Set(['ban', 'suspend', 'freeze_chat', 'delete']);

    if (!allowed.includes(action)) {
      return res.status(400).json(errorResponse('Invalid moderation action'));
    }

    if (criticalActions.has(String(action))) {
      const actionScopeMap = {
        ban: 'critical:ban_user',
        suspend: 'critical:ban_user',
        freeze_chat: 'critical:freeze_chat',
        delete: 'critical:delete_user'
      };
      if (!enforceStepUp(req, res, actionScopeMap[action], `Step-up verification required for ${action}`)) {
        return;
      }
    }

    if (!requireSensitiveReason(res, { reason, action })) {
      return;
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const beforeState = {
      status: user.status,
      suspended_until: user.suspended_until,
      warnings_count: user.warnings_count,
      chat_frozen: user.chat_frozen
    };

    if (action === 'ban') user.status = 'banned';
    if (action === 'unban') user.status = 'active';
    if (action === 'suspend') {
      user.status = 'banned';
      user.suspended_until = suspendedUntil ? new Date(suspendedUntil) : null;
    }
    if (action === 'unsuspend') {
      user.status = 'active';
      user.suspended_until = null;
    }
    if (action === 'warn') user.warnings_count = (user.warnings_count || 0) + 1;
    if (action === 'freeze_chat') user.chat_frozen = true;
    if (action === 'unfreeze_chat') user.chat_frozen = false;
    if (action === 'delete') user.status = 'banned';

    user.updated_at = new Date();
    await user.save();

    const afterState = {
      status: user.status,
      suspended_until: user.suspended_until,
      warnings_count: user.warnings_count,
      chat_frozen: user.chat_frozen
    };

    await logActivity({
      admin_id: req.user._id,
      action: `admin_${action}`,
      description: `Admin ${action} applied to ${user.email}`,
      target_user_id: user._id,
      target_type: 'user',
      target_id: user._id,
      reason,
      before_state: beforeState,
      after_state: afterState,
      metadata: { reason, suspendedUntil },
      ...getClientInfo(req)
    });

    return res.json(successResponse('Moderation action completed', sanitizeUser(user)));
  } catch (error) {
    console.error('❌ Moderation Action Error:', error);
    return res.status(500).json(errorResponse('Failed to apply moderation action'));
  }
});

// ===== MATCH CONTROL =====
router.get('/matches', requirePermission('admin.users.read'), async (req, res) => {
  try {
    const matches = await Match.find({})
      .populate('users', 'name email status')
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    return res.json(successResponse('Matches fetched', { data: matches }));
  } catch (error) {
    console.error('❌ Match Fetch Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch matches'));
  }
});

router.delete('/matches/:matchId', requirePermission('admin.users.moderate'), verifyAdminPin, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json(errorResponse('Match not found'));
    }

    match.status = 'unmatched';
    match.unmatchedBy = req.user._id;
    match.unmatchedAt = new Date();
    await match.save();

    await logActivity({
      admin_id: req.user._id,
      action: 'admin_remove_match',
      description: `Admin removed match ${match._id}`,
      target_type: 'match',
      target_id: match._id.toString(),
      ...getClientInfo(req)
    });

    return res.json(successResponse('Match removed')); 
  } catch (error) {
    console.error('❌ Match Remove Error:', error);
    return res.status(500).json(errorResponse('Failed to remove match'));
  }
});

// ===== CHAT METADATA / MODERATION =====
router.get('/chats/metadata', requirePermission('admin.chat.read_metadata'), async (req, res) => {
  try {
    const chats = await Conversation.find({})
      .populate('participants', 'name email status chat_frozen')
      .sort({ updatedAt: -1 })
      .limit(150)
      .lean();

    const ids = chats.map((chat) => chat._id);
    const messageCounts = await Message.aggregate([
      { $match: { conversationId: { $in: ids } } },
      { $group: { _id: '$conversationId', totalMessages: { $sum: 1 }, lastAt: { $max: '$createdAt' } } }
    ]);

    const countMap = new Map(messageCounts.map((item) => [item._id.toString(), item]));
    const data = chats.map((chat) => {
      const metrics = countMap.get(chat._id.toString());
      return {
        ...chat,
        totalMessages: metrics?.totalMessages || 0,
        lastMessageAt: metrics?.lastAt || chat.lastMessageTime || chat.updatedAt
      };
    });

    return res.json(successResponse('Chat metadata fetched', { data }));
  } catch (error) {
    console.error('❌ Chat Metadata Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch chat metadata'));
  }
});

// ===== PAYMENTS / SUBSCRIPTION CONTROL =====
router.get('/payments', requirePermission('admin.payments.read'), verifyAdminRole(FINANCE_ROLES), async (req, res) => {
  try {
    const { status, plan, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (plan) filter.plan = plan;
    if (from || to) {
      filter.created_at = {};
      if (from) filter.created_at.$gte = new Date(from);
      if (to) filter.created_at.$lte = new Date(to);
    }

    const payments = await Subscription.find(filter)
      .populate('user_id', 'name email college')
      .sort({ created_at: -1 })
      .limit(300)
      .lean();

    return res.json(successResponse('Payments fetched', { data: payments }));
  } catch (error) {
    console.error('❌ Payments Fetch Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch payments'));
  }
});

router.get('/payments/summary', requirePermission('admin.payments.read'), verifyAdminRole(FINANCE_ROLES), async (req, res) => {
  try {
    const [summary] = await Subscription.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          approvedPayments: {
            $sum: {
              $cond: [{ $in: ['$status', ['approved', 'active']] }, 1, 0]
            }
          },
          failedPayments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0]
            }
          }
        }
      }
    ]);

    return res.json(successResponse('Payment summary fetched', summary || {
      totalRevenue: 0,
      totalPayments: 0,
      approvedPayments: 0,
      failedPayments: 0
    }));
  } catch (error) {
    console.error('❌ Payment Summary Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch payment summary'));
  }
});

router.post('/payments/membership-action', requirePermission('admin.payments.override'), verifyAdminRole(FINANCE_ROLES), verifyAdminPin, async (req, res) => {
  try {
    if (!enforceStepUp(req, res, 'critical:payment_override', 'Step-up verification required for payment override')) {
      return;
    }

    const {
      userId,
      action = 'grant',
      plan = 'Premium',
      durationDays = 30,
      note = '',
      amount = 0
    } = req.body;

    if (!userId) {
      return res.status(400).json(errorResponse('userId is required'));
    }

    if (!['grant', 'extend', 'revoke'].includes(action)) {
      return res.status(400).json(errorResponse('Invalid membership action'));
    }

    if (!requireSensitiveReason(res, { reason: note, action, label: 'Admin note' })) {
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const beforeState = {
      subscription_status: user.subscription_status,
      subscription_plan: user.subscription_plan,
      subscription_start_date: user.subscription_start_date,
      subscription_expiry_date: user.subscription_expiry_date
    };

    let nextStatus = user.subscription_status || 'none';
    let nextStartDate = user.subscription_start_date || null;
    let nextExpiryDate = user.subscription_expiry_date || null;
    let nextPlan = user.subscription_plan || null;

    if (action === 'revoke') {
      nextStatus = 'none';
      nextStartDate = null;
      nextExpiryDate = null;
      nextPlan = null;
    } else {
      const now = new Date();
      const baseDate = action === 'extend' && user.subscription_expiry_date && user.subscription_expiry_date > now
        ? new Date(user.subscription_expiry_date)
        : now;

      const computedExpiry = new Date(baseDate);
      computedExpiry.setDate(computedExpiry.getDate() + Math.max(1, Number(durationDays) || 30));

      nextStatus = 'active';
      nextPlan = plan;
      nextStartDate = action === 'extend' && user.subscription_start_date ? user.subscription_start_date : now;
      nextExpiryDate = computedExpiry;

      const manualPaymentId = `MANUAL-${Date.now()}-${String(user._id).slice(-6)}`;
      await Subscription.create({
        user_id: user._id,
        plan,
        amount: Number(amount) || 0,
        payment_id: manualPaymentId,
        status: 'approved',
        start_date: nextStartDate,
        expiry_date: nextExpiryDate,
        approved_at: now,
        approved_by: req.user._id,
        admin_notes: note || `Manual ${action} by finance admin`
      });
    }

    user.subscription_status = nextStatus;
    user.subscription_plan = nextPlan;
    user.subscription_start_date = nextStartDate;
    user.subscription_expiry_date = nextExpiryDate;
    user.updated_at = new Date();
    await user.save();

    const afterState = {
      subscription_status: user.subscription_status,
      subscription_plan: user.subscription_plan,
      subscription_start_date: user.subscription_start_date,
      subscription_expiry_date: user.subscription_expiry_date
    };

    await logActivity({
      admin_id: req.user._id,
      action: `membership_${action}`,
      description: `Finance action ${action} applied to ${user.email}`,
      target_type: 'user',
      target_id: user._id.toString(),
      target_user_id: user._id,
      reason: note,
      before_state: beforeState,
      after_state: afterState,
      metadata: {
        action,
        plan,
        durationDays,
        amount,
        note
      },
      ...getClientInfo(req),
      status: 'success'
    });

    return res.json(successResponse('Membership action applied', {
      userId: user._id,
      subscription_status: user.subscription_status,
      subscription_plan: user.subscription_plan,
      subscription_start_date: user.subscription_start_date,
      subscription_expiry_date: user.subscription_expiry_date
    }));
  } catch (error) {
    console.error('❌ Membership Action Error:', error);
    return res.status(500).json(errorResponse('Failed to apply membership action'));
  }
});

// ===== REPORTS & SAFETY =====
router.get('/reports', requirePermission('admin.reports.read'), verifyAdminRole(MODERATION_ROLES), async (req, res) => {
  try {
    const { status, priority, targetType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (targetType) filter.target_type = targetType;

    const reports = await Report.find(filter)
      .populate('reporter_id', 'name email')
      .populate('target_user_id', 'name email')
      .populate('resolved_by', 'name email')
      .sort({ created_at: -1 })
      .limit(200)
      .lean();

    return res.json(successResponse('Reports fetched', { data: reports }));
  } catch (error) {
    console.error('❌ Reports Fetch Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch reports'));
  }
});

router.post('/reports/:reportId/resolve', requirePermission('admin.reports.resolve'), verifyAdminRole(MODERATION_ROLES), verifyAdminPin, async (req, res) => {
  try {
    const { status = 'resolved', moderationNotes = '' } = req.body;
    if (!requireSensitiveReason(res, { reason: moderationNotes, action: status, label: 'Moderation note' })) {
      return;
    }

    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json(errorResponse('Report not found'));
    }

    report.status = status;
    report.moderation_notes = moderationNotes;
    report.resolved_by = req.user._id;
    report.resolved_at = new Date();
    await report.save();

    await logActivity({
      admin_id: req.user._id,
      action: 'admin_report_resolution',
      description: `Report ${report._id} marked as ${status}`,
      target_type: 'report',
      target_id: report._id.toString(),
      metadata: { moderationNotes },
      ...getClientInfo(req)
    });

    return res.json(successResponse('Report status updated', report));
  } catch (error) {
    console.error('❌ Resolve Report Error:', error);
    return res.status(500).json(errorResponse('Failed to resolve report'));
  }
});

// ===== CONTENT MODERATION =====
router.get('/moderation/photos', requirePermission('admin.reports.read'), verifyAdminRole(MODERATION_ROLES), async (req, res) => {
  try {
    const users = await User.find({ role: 'user', verification_submission: { $exists: true, $ne: null } })
      .select('name email profile_approval_status profile_admin_notes updated_at verification_submission verification_status')
      .sort({ updated_at: -1 })
      .limit(150)
      .lean();

    const submissionIds = users
      .map((item) => item.verification_submission)
      .filter(Boolean);

    const submissions = await VerificationSubmission.find({ _id: { $in: submissionIds } })
      .select('status idProofType reviewedAt submittedAt reviewNotes rejectionReason documents')
      .lean();
    const submissionById = new Map(submissions.map((item) => [String(item._id), item]));

    const data = users.map((user) => {
      const submission = submissionById.get(String(user.verification_submission));
      return {
        ...user,
        verificationSubmission: submission
          ? {
              id: submission._id,
              status: submission.status,
              idProofType: submission.idProofType,
              submittedAt: submission.submittedAt,
              reviewedAt: submission.reviewedAt,
              reviewNotes: submission.reviewNotes,
              rejectionReason: submission.rejectionReason,
              hasSelfie: Boolean(submission.documents?.selfie?.storageKey),
              hasIdProof: Boolean(submission.documents?.idProof?.storageKey)
            }
          : null
      };
    });

    return res.json(successResponse('Photo moderation queue fetched', { data }));
  } catch (error) {
    console.error('❌ Photo Moderation Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch photo moderation queue'));
  }
});

// ===== COLLEGE / CAMPUS MANAGEMENT =====
router.get('/colleges', requirePermission('admin.settings.read'), async (req, res) => {
  try {
    const colleges = await College.find({}).sort({ name: 1 }).lean();
    return res.json(successResponse('Colleges fetched', { data: colleges }));
  } catch (error) {
    console.error('❌ Colleges Fetch Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch colleges'));
  }
});

router.post('/colleges', requirePermission('admin.colleges.write'), verifyAdminRole(SUPER_ROLES), verifyAdminPin, async (req, res) => {
  try {
    const { name, domain, verification_required = true, onboarding_enabled = true, campus_notes = '' } = req.body;
    if (!name || !domain) {
      return res.status(400).json(errorResponse('Name and domain are required'));
    }

    const college = await College.create({ name, domain, verification_required, onboarding_enabled, campus_notes });

    await logActivity({
      admin_id: req.user._id,
      action: 'admin_college_create',
      description: `College ${name} (${domain}) added`,
      target_type: 'college',
      target_id: college._id.toString(),
      ...getClientInfo(req)
    });

    return res.status(201).json(successResponse('College created', college));
  } catch (error) {
    console.error('❌ College Create Error:', error);
    return res.status(500).json(errorResponse('Failed to create college'));
  }
});

router.put('/colleges/:collegeId', requirePermission('admin.colleges.write'), verifyAdminRole(SUPER_ROLES), verifyAdminPin, async (req, res) => {
  try {
    const updated = await College.findByIdAndUpdate(req.params.collegeId, req.body, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json(errorResponse('College not found'));
    }

    await logActivity({
      admin_id: req.user._id,
      action: 'admin_college_update',
      description: `College ${updated.name} updated`,
      target_type: 'college',
      target_id: updated._id.toString(),
      ...getClientInfo(req)
    });

    return res.json(successResponse('College updated', updated));
  } catch (error) {
    console.error('❌ College Update Error:', error);
    return res.status(500).json(errorResponse('Failed to update college'));
  }
});

// ===== SUPPORT / OPS =====
router.get('/support/tickets', requirePermission('admin.support.manage'), verifyAdminRole([...MODERATION_ROLES, ...SUPPORT_ROLES]), async (req, res) => {
  try {
    const { status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tickets = await SupportTicket.find(filter)
      .populate('user_id', 'name email')
      .populate('assigned_to', 'name email')
      .sort({ updated_at: -1 })
      .limit(200)
      .lean();

    return res.json(successResponse('Support tickets fetched', { data: tickets }));
  } catch (error) {
    console.error('❌ Support Ticket Fetch Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch support tickets'));
  }
});

router.put('/support/tickets/:ticketId', requirePermission('admin.support.manage'), verifyAdminRole([...MODERATION_ROLES, ...SUPPORT_ROLES]), verifyAdminPin, async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.ticketId, req.body, { new: true, runValidators: true });
    if (!ticket) {
      return res.status(404).json(errorResponse('Support ticket not found'));
    }

    await logActivity({
      admin_id: req.user._id,
      action: 'admin_support_update',
      description: `Support ticket ${ticket._id} updated`,
      target_type: 'support_ticket',
      target_id: ticket._id.toString(),
      metadata: req.body,
      ...getClientInfo(req)
    });

    return res.json(successResponse('Support ticket updated', ticket));
  } catch (error) {
    console.error('❌ Support Ticket Update Error:', error);
    return res.status(500).json(errorResponse('Failed to update support ticket'));
  }
});

// ===== ANALYTICS =====
router.get('/analytics/engagement', requirePermission('admin.dashboard.read'), async (req, res) => {
  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [dailyActiveUsers, weeklyActiveUsers, monthlyActiveUsers, newSignups, totalMessages, totalMatches] = await Promise.all([
      User.countDocuments({ last_login: { $gte: dayAgo }, role: 'user' }),
      User.countDocuments({ last_login: { $gte: weekAgo }, role: 'user' }),
      User.countDocuments({ last_login: { $gte: monthAgo }, role: 'user' }),
      User.countDocuments({ created_at: { $gte: monthAgo }, role: 'user' }),
      Message.countDocuments({ createdAt: { $gte: monthAgo } }),
      Match.countDocuments({ matchedAt: { $gte: monthAgo } })
    ]);

    const premiumUsers = await User.countDocuments({ subscription_status: { $in: ['approved', 'active'] }, role: 'user' });
    const totalUsers = await User.countDocuments({ role: 'user' });

    return res.json(successResponse('Engagement analytics fetched', {
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      newSignups,
      premiumConversionRate: totalUsers ? Number(((premiumUsers / totalUsers) * 100).toFixed(2)) : 0,
      matchRate: totalUsers ? Number(((totalMatches / totalUsers) * 100).toFixed(2)) : 0,
      messageActivity: totalMessages,
      retentionHint: weeklyActiveUsers ? Number(((dailyActiveUsers / weeklyActiveUsers) * 100).toFixed(2)) : 0
    }));
  } catch (error) {
    console.error('❌ Analytics Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch analytics'));
  }
});

// ===== PLATFORM SETTINGS =====
router.get('/settings', requirePermission('admin.settings.read'), async (req, res) => {
  try {
    const settings = await AppSetting.find({}).sort({ key: 1 }).lean();
    return res.json(successResponse('Platform settings fetched', { data: settings }));
  } catch (error) {
    console.error('❌ Settings Fetch Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch settings'));
  }
});

router.put('/settings', requirePermission('admin.settings.write'), verifyAdminRole(SUPER_ROLES), verifyAdminPin, async (req, res) => {
  try {
    if (!enforceStepUp(req, res, 'critical:settings_change', 'Step-up verification required for settings updates')) {
      return;
    }

    const { key, value, description } = req.body;
    if (!key) {
      return res.status(400).json(errorResponse('Setting key is required'));
    }

    const existing = await AppSetting.findOne({ key }).lean();

    const setting = await AppSetting.findOneAndUpdate(
      { key },
      { value, description, updated_by: req.user._id },
      { upsert: true, new: true, runValidators: true }
    );

    await logActivity({
      admin_id: req.user._id,
      action: 'admin_setting_update',
      description: `Platform setting ${key} updated`,
      target_type: 'setting',
      target_id: setting._id.toString(),
      reason: description || 'admin_setting_change',
      before_state: existing ? { value: existing.value, description: existing.description } : null,
      after_state: { value: setting.value, description: setting.description },
      metadata: { key, value },
      ...getClientInfo(req)
    });

    return res.json(successResponse('Setting updated', setting));
  } catch (error) {
    console.error('❌ Settings Update Error:', error);
    return res.status(500).json(errorResponse('Failed to update setting'));
  }
});

// ===== GET ALL USERS =====
router.get('/users', requirePermission('admin.users.read'), async (req, res) => {
  try {
    const { status, role, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let filter = { role: 'user' }; // Get only regular users

    if (status) filter.status = status;
    if (role) filter.role = role;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password -livePhoto -idCard')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    res.json(
      successResponse('Users fetched', {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        data: users.map(sanitizeUser)
      })
    );
  } catch (error) {
    console.error('❌ Get Users Error:', error);
    res.status(500).json(errorResponse('Failed to fetch users: ' + error.message));
  }
});

// ===== GET USER DETAIL =====
router.get('/users/:userId', requirePermission('admin.users.read'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password');

    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    // Get user's subscriptions
    const subscriptions = await Subscription.find({ user_id: user._id })
      .sort({ created_at: -1 });

    // Get user's activity
    const activities = await ActivityLog.find({ user_id: user._id })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(
      successResponse('User detail fetched', {
        user: sanitizeUser(user),
        subscriptions,
        activities
      })
    );
  } catch (error) {
    console.error('❌ Get User Detail Error:', error);
    res.status(500).json(errorResponse('Failed to fetch user detail: ' + error.message));
  }
});

// ===== USER ACTIVITY (MATCHES, PENDING LIKES, CHATS) =====
router.get('/users/:userId/activity', requirePermission('admin.users.read'), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('_id name email role status');
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const [matches, pendingLikes, conversations] = await Promise.all([
      Match.find({ users: userId, status: 'matched' })
        .populate('users', 'name email role status')
        .sort({ updatedAt: -1 })
        .lean(),
      Match.find({ users: userId, status: 'pending', requestedBy: userId })
        .populate('users', 'name email role status')
        .sort({ updatedAt: -1 })
        .lean(),
      Conversation.find({ participants: userId })
        .populate('participants', 'name email role status')
        .sort({ updatedAt: -1 })
        .lean()
    ]);

    const mappedMatches = matches.map((m) => ({
      _id: m._id,
      matchedAt: m.matchedAt,
      withUser: m.users.find((u) => u._id.toString() !== userId) || null
    }));

    const mappedPendingLikes = pendingLikes.map((m) => ({
      _id: m._id,
      requestedAt: m.updatedAt,
      targetUser: m.users.find((u) => u._id.toString() !== userId) || null
    }));

    const conversationIds = conversations.map((c) => c._id);
    const messageCounts = await Message.aggregate([
      { $match: { conversationId: { $in: conversationIds } } },
      { $group: { _id: '$conversationId', totalMessages: { $sum: 1 }, lastMessageAt: { $max: '$createdAt' } } }
    ]);
    const countByConversation = new Map(messageCounts.map((m) => [m._id.toString(), m]));

    const activeChats = conversations.map((c) => ({
      _id: c._id,
      withUser: c.participants.find((p) => p._id.toString() !== userId) || null,
      isBlocked: c.isBlocked,
      updatedAt: c.updatedAt,
      totalMessages: countByConversation.get(c._id.toString())?.totalMessages || 0,
      lastMessageAt: countByConversation.get(c._id.toString())?.lastMessageAt || c.lastMessageTime || c.updatedAt
    }));

    return res.json(successResponse('User activity fetched', {
      user,
      matches: mappedMatches,
      pendingLikes: mappedPendingLikes,
      activeChats
    }));
  } catch (error) {
    console.error('❌ User Activity Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch user activity'));
  }
});

// ===== CONVERSATION SAFETY METADATA (NO MESSAGE BODIES) =====
router.get('/chats/read-only', requirePermission('admin.chat.read_metadata'), async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const conversations = await Conversation.find({})
      .populate('participants', 'name email role status')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    const conversationIds = conversations.map((c) => c._id);

    const messageStats = await Message.aggregate([
      { $match: { conversationId: { $in: conversationIds } } },
      {
        $group: {
          _id: '$conversationId',
          totalMessages: { $sum: 1 },
          lastMessageAt: { $max: '$createdAt' }
        }
      }
    ]);

    const reportStats = await Report.aggregate([
      {
        $match: {
          target_type: { $in: ['chat', 'message'] },
          target_id: { $in: conversationIds.map((id) => id.toString()) }
        }
      },
      {
        $group: {
          _id: '$target_id',
          reportCount: { $sum: 1 },
          openCount: {
            $sum: {
              $cond: [{ $in: ['$status', ['open', 'investigating']] }, 1, 0]
            }
          }
        }
      }
    ]);

    const messageMap = new Map(messageStats.map((item) => [item._id.toString(), item]));
    const reportMap = new Map(reportStats.map((item) => [item._id.toString(), item]));

    const data = conversations.map((conversation) => {
      const metrics = messageMap.get(conversation._id.toString());
      const reports = reportMap.get(conversation._id.toString());
      const totalMessages = metrics?.totalMessages || 0;
      const reportCount = reports?.reportCount || 0;
      const riskScore = Math.min(100, Math.round((reportCount * 26) + Math.min(totalMessages / 10, 30)));

      return {
        _id: conversation._id,
        participants: conversation.participants,
        isBlocked: Boolean(conversation.isBlocked),
        blockedBy: conversation.blockedBy || null,
        totalMessages,
        reportCount,
        riskScore,
        moderationStatus: reports?.openCount > 0 || riskScore >= 75 ? 'open' : 'resolved',
        lastMessageAt: metrics?.lastMessageAt || conversation.lastMessageTime || conversation.updatedAt,
        updatedAt: conversation.updatedAt,
        createdAt: conversation.createdAt
      };
    });

    return res.json(successResponse('Conversation safety metadata fetched', {
      conversations: data,
      mode: 'metadata',
      fullVisibilityEnabled: isAdminFullChatViewEnabled()
    }));
  } catch (error) {
    console.error('❌ Read-only Chat Fetch Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch conversation safety metadata'));
  }
});

// ===== TEST MODE FULL CONVERSATION VISIBILITY (FEATURE FLAGGED) =====
router.get('/chats/full-view', requirePermission('admin.chat.read_sensitive'), verifyAdminRole(MODERATION_ROLES), async (req, res) => {
  try {
    if (!enforceStepUp(req, res, 'critical:view_private_chat', 'Step-up verification required to view private chats')) {
      return;
    }

    const accessReason = String(req.query.reason || '').trim();
    if (!accessReason || accessReason.length < 5) {
      return res.status(400).json(errorResponse('Reason is required to access private chat full view (min 5 chars)'));
    }

    if (!isAdminFullChatViewEnabled()) {
      return res.status(403).json(errorResponse('Full chat visibility is disabled. Set ENABLE_ADMIN_FULL_CHAT_VIEW=true for test environments only.'));
    }

    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 30)));
    const messageLimit = Math.min(300, Math.max(20, Number(req.query.messageLimit || 120)));

    const conversations = await Conversation.find({})
      .populate('participants', 'name email role status')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    const conversationIds = conversations.map((c) => c._id);

    const [messageStats, reportStats] = await Promise.all([
      Message.aggregate([
        { $match: { conversationId: { $in: conversationIds } } },
        { $sort: { createdAt: 1 } },
        {
          $group: {
            _id: '$conversationId',
            totalMessages: { $sum: 1 },
            lastMessageAt: { $max: '$createdAt' },
            messages: {
              $push: {
                _id: '$_id',
                senderId: '$senderId',
                receiverId: '$receiverId',
                text: '$text',
                messageType: '$messageType',
                delivered: '$delivered',
                seen: '$seen',
                createdAt: '$createdAt'
              }
            }
          }
        },
        {
          $project: {
            totalMessages: 1,
            lastMessageAt: 1,
            messages: { $slice: ['$messages', -messageLimit] }
          }
        }
      ]),
      Report.aggregate([
        {
          $match: {
            target_type: { $in: ['chat', 'message'] },
            target_id: { $in: conversationIds.map((id) => id.toString()) }
          }
        },
        {
          $group: {
            _id: '$target_id',
            reportCount: { $sum: 1 },
            openCount: {
              $sum: {
                $cond: [{ $in: ['$status', ['open', 'investigating']] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    const messageMap = new Map(messageStats.map((item) => [item._id.toString(), item]));
    const reportMap = new Map(reportStats.map((item) => [item._id.toString(), item]));

    const data = conversations.map((conversation) => {
      const metrics = messageMap.get(conversation._id.toString());
      const reports = reportMap.get(conversation._id.toString());
      const totalMessages = metrics?.totalMessages || 0;
      const reportCount = reports?.reportCount || 0;
      const riskScore = Math.min(100, Math.round((reportCount * 26) + Math.min(totalMessages / 10, 30)));
      const messages = Array.isArray(metrics?.messages) ? metrics.messages : [];

      return {
        _id: conversation._id,
        participants: conversation.participants,
        isBlocked: Boolean(conversation.isBlocked),
        blockedBy: conversation.blockedBy || null,
        totalMessages,
        reportCount,
        riskScore,
        moderationStatus: reports?.openCount > 0 || riskScore >= 75 ? 'open' : 'resolved',
        lastMessageAt: metrics?.lastMessageAt || conversation.lastMessageTime || conversation.updatedAt,
        updatedAt: conversation.updatedAt,
        createdAt: conversation.createdAt,
        latestMessagePreview: messages.length ? messages[messages.length - 1]?.text || '' : '',
        messages
      };
    });

    await logActivity({
      admin_id: req.user._id,
      action: 'conversation_full_view_test_mode',
      description: `Admin opened full conversation visibility in test mode (${data.length} conversations)` ,
      target_type: 'chat',
      metadata: {
        mode: 'full',
        reason: accessReason,
        limit,
        messageLimit,
        featureFlag: 'ENABLE_ADMIN_FULL_CHAT_VIEW'
      },
      ...getClientInfo(req),
      status: 'success'
    });

    return res.json(successResponse('Conversation full view fetched (test mode)', {
      conversations: data,
      mode: 'full',
      fullVisibilityEnabled: true,
      testMode: true,
      featureFlag: 'ENABLE_ADMIN_FULL_CHAT_VIEW'
    }));
  } catch (error) {
    console.error('❌ Full Chat View Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch full conversation view'));
  }
});

// ===== SENSITIVE CONVERSATION REVIEW (ROLE + REASON + AUDIT REQUIRED) =====
router.post('/chats/review-access', requirePermission('admin.chat.read_sensitive'), verifyAdminRole(CHAT_REVIEW_ROLES), async (req, res) => {
  try {
    const { conversationId, reason, notes } = req.body;

    if (!enforceStepUp(req, res, 'critical:view_private_chat', 'Step-up verification required for sensitive conversation review')) {
      return;
    }

    if (!conversationId) {
      return res.status(400).json(errorResponse('conversationId is required'));
    }

    const allowedReasons = ['user_report', 'abuse_signal', 'fraud_alert', 'legal_request'];
    if (!reason || !allowedReasons.includes(reason)) {
      return res.status(400).json(errorResponse('A valid moderation reason is required for sensitive access'));
    }

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name email role status')
      .lean();

    if (!conversation) {
      return res.status(404).json(errorResponse('Conversation not found'));
    }

    const relatedReports = await Report.find({
      target_type: { $in: ['chat', 'message'] },
      target_id: conversationId.toString(),
      status: { $in: ['open', 'investigating', 'resolved'] }
    })
      .sort({ created_at: -1 })
      .limit(20)
      .lean();

    const messageCount = await Message.countDocuments({ conversationId });
    const hasTrigger = relatedReports.length > 0 || messageCount >= 40 || conversation.isBlocked;

    if (!hasTrigger) {
      return res.status(403).json(errorResponse('Conversation is not eligible for sensitive review without moderation triggers'));
    }

    const messages = await Message.find({ conversationId })
      .select('senderId receiverId text messageType createdAt')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    await logActivity({
      admin_id: req.user._id,
      action: 'conversation_sensitive_review_access',
      description: `Sensitive conversation review granted for ${conversationId} (${reason})`,
      target_type: 'chat',
      target_id: conversationId.toString(),
      ...getClientInfo(req),
      status: 'success',
      metadata: {
        reason,
        notes: notes || '',
        role: req.user.role,
        reportCount: relatedReports.length,
        messageCount
      }
    });

    return res.json(successResponse('Sensitive review access granted', {
      conversation: {
        _id: conversation._id,
        participants: conversation.participants,
        isBlocked: conversation.isBlocked,
        updatedAt: conversation.updatedAt
      },
      reportCount: relatedReports.length,
      messageCount,
      messages: messages.reverse(),
      accessGrantedBy: {
        adminId: req.user._id,
        role: req.user.role,
        at: new Date().toISOString()
      },
      auditLogged: true
    }));
  } catch (error) {
    console.error('❌ Conversation Review Access Error:', error);
    return res.status(500).json(errorResponse('Failed to authorize conversation review access'));
  }
});

// ===== BAN/UNBAN USER =====
router.put('/users/:userId/ban', requirePermission('admin.users.moderate'), async (req, res) => {
  try {
    const { action, reason } = req.body; // action: 'ban' or 'unban'

    if (action === 'ban' && !enforceStepUp(req, res, 'critical:ban_user', 'Step-up verification required before banning user')) {
      return;
    }

    if (!['ban', 'unban'].includes(action)) {
      return res.status(400).json(errorResponse('Invalid action'));
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const beforeState = { status: user.status };

    user.status = action === 'ban' ? 'banned' : 'active';
    user.updated_at = new Date();
    await user.save();

    const afterState = { status: user.status };

    // Log activity
    await logActivity({
      admin_id: req.user._id,
      action: action === 'ban' ? 'user_ban' : 'user_unban',
      description: `Admin ${action}ned user: ${user.name} (${reason || 'No reason provided'})`,
      target_user_id: user._id,
      target_type: 'user',
      target_id: user._id,
      reason: reason || `${action}_user`,
      before_state: beforeState,
      after_state: afterState,
      ...getClientInfo(req),
      status: 'success',
      metadata: { reason }
    });

    res.json(
      successResponse(`User ${action}ned successfully`, sanitizeUser(user))
    );
  } catch (error) {
    console.error('❌ Ban User Error:', error);
    res.status(500).json(errorResponse('Failed to ban/unban user: ' + error.message));
  }
});

// ===== DELETE USER (PERMANENT HARD DELETE WITH CASCADE) =====
router.delete('/users/:userId', requirePermission('admin.users.moderate'), verifyAdminPin, async (req, res) => {
  try {
    if (!enforceStepUp(req, res, 'critical:delete_user', 'Step-up verification required before deleting user')) {
      return;
    }

    const { reason } = req.body;
    const userId = req.params.userId;

    // Find user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    console.log(`\n🗑️  STARTING HARD DELETE FOR USER: ${user.email} (${userId})`);

    // ===== CASCADING DELETE - All related data =====

    // 1. Delete Likes (both directions)
    console.log(`  - Deleting likes...`);
    await Like.deleteMany({ $or: [{ likedBy: userId }, { likedUser: userId }] });

    // 2. Delete Matches
    console.log(`  - Deleting matches...`);
    await Match.deleteMany({ users: userId });

    // 3. Delete Conversations (will cascade to messages)
    console.log(`  - Deleting conversations and messages...`);
    const conversations = await Conversation.find({ participants: userId });
    const convIds = conversations.map(c => c._id);
    await Message.deleteMany({ conversation_id: { $in: convIds } });
    await Conversation.deleteMany({ participants: userId });

    // 4. Delete Subscriptions
    console.log(`  - Deleting subscriptions...`);
    await Subscription.deleteMany({ user_id: userId });

    // 5. Delete Reports (as both reporter and target)
    console.log(`  - Deleting reports...`);
    await Report.deleteMany({ $or: [{ reporter_id: userId }, { target_user_id: userId }] });

    // 6. Delete Support Tickets
    console.log(`  - Deleting support tickets...`);
    await SupportTicket.deleteMany({ $or: [{ user_id: userId }, { assigned_to: userId }] });

    // 7. Delete Activity Logs referencing this user
    console.log(`  - Deleting activity logs...`);
    await ActivityLog.deleteMany({
      $or: [
        { user_id: userId },
        { admin_id: userId },
        { target_user_id: userId }
      ]
    });

    // 8. Log the deletion action (BEFORE deleting the user)
    console.log(`  - Logging admin action...`);
    await logActivity({
      admin_id: req.user._id,
      action: 'user_permanent_delete',
      description: `Admin permanently deleted user: ${user.name} (${user.email})`,
      target_user_id: user._id,
      target_type: 'user',
      target_id: user._id,
      reason: reason || 'No reason provided',
      before_state: {
        email: user.email,
        name: user.name,
        phone: user.phone,
        status: user.status,
        role: user.role,
        warnings_count: user.warnings_count,
        chat_frozen: user.chat_frozen,
        subscription_status: user.subscription_status
      },
      after_state: null,
      ...getClientInfo(req),
      status: 'success',
      metadata: {
        reason: reason || 'No reason provided',
        email: user.email,
        phone: user.phone,
        deleted_at: new Date(),
        permanent_delete: true
      }
    });

    // 9. Finally, delete the user document
    console.log(`  - Deleting user document...`);
    await User.findByIdAndDelete(userId);

    console.log(`✅ USER HARD DELETE COMPLETE: ${user.email}`);
    console.log(`   Status: All related data cascaded and deleted\n`);

    res.json(successResponse(
      'User permanently deleted with all related data',
      {
        deleted_user: {
          id: userId,
          email: user.email,
          name: user.name
        },
        cascaded_deletions: {
          likes: 'Deleted',
          matches: 'Deleted',
          conversations: 'Deleted',
          messages: 'Deleted',
          subscriptions: 'Deleted',
          reports: 'Deleted',
          support_tickets: 'Deleted',
          audit_logs: 'Deleted',
          user: 'Deleted'
        },
        note: 'User can now register again with same email/phone'
      }
    ));
  } catch (error) {
    console.error('❌ HARD DELETE USER ERROR:', error);
    res.status(500).json(errorResponse('Failed to delete user: ' + error.message));
  }
});

// ===== GET ALL SUBSCRIPTIONS =====
router.get('/subscriptions', requirePermission('admin.payments.read'), verifyAdminRole(FINANCE_ROLES), async (req, res) => {
  try {
    const { status, plan } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) filter.status = status;
    if (plan) filter.plan = plan;

    const total = await Subscription.countDocuments(filter);
    const subscriptions = await Subscription.find(filter)
      .populate('user_id', 'name email phone')
      .populate('approved_by', 'name email')
      .populate('rejected_by', 'name email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    res.json(
      successResponse('Subscriptions fetched', {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        data: subscriptions
      })
    );
  } catch (error) {
    console.error('❌ Get Subscriptions Error:', error);
    res.status(500).json(errorResponse('Failed to fetch subscriptions: ' + error.message));
  }
});

// ===== APPROVE SUBSCRIPTION =====
router.put('/subscriptions/:subscriptionId/approve', requirePermission('admin.payments.override'), verifyAdminRole(FINANCE_ROLES), async (req, res) => {
  try {
    if (!enforceStepUp(req, res, 'critical:payment_override', 'Step-up verification required for manual premium approval')) {
      return;
    }

    const { adminNotes } = req.body;

    const subscription = await Subscription.findById(req.params.subscriptionId);
    if (!subscription) {
      return res.status(404).json(errorResponse('Subscription not found'));
    }

    if (subscription.status !== 'pending') {
      return res.status(409).json(errorResponse('Subscription is not pending'));
    }

    // Calculate dates
    const startDate = new Date();
    const expiryDate = new Date();
    if (subscription.plan === 'monthly') {
      expiryDate.setDate(expiryDate.getDate() + 30);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    subscription.status = 'approved';
    subscription.start_date = startDate;
    subscription.expiry_date = expiryDate;
    subscription.approved_at = new Date();
    subscription.approved_by = req.user._id;
    subscription.admin_notes = adminNotes;
    subscription.updated_at = new Date();
    await subscription.save();

    // Update user
    await User.findByIdAndUpdate(subscription.user_id, {
      subscription_status: 'approved',
      subscription_start_date: startDate,
      subscription_expiry_date: expiryDate,
      updated_at: new Date()
    });

    // Log activity
    await logActivity({
      admin_id: req.user._id,
      action: 'subscription_approve',
      description: `Admin approved subscription: ${subscription.payment_id}`,
      target_user_id: subscription.user_id,
      target_type: 'subscription',
      target_id: subscription._id,
      ...getClientInfo(req),
      status: 'success',
      metadata: { plan: subscription.plan, amount: subscription.amount }
    });

    res.json(successResponse('Subscription approved', subscription));
  } catch (error) {
    console.error('❌ Approve Subscription Error:', error);
    res.status(500).json(errorResponse('Failed to approve subscription: ' + error.message));
  }
});

// ===== REJECT SUBSCRIPTION =====
router.put('/subscriptions/:subscriptionId/reject', requirePermission('admin.payments.override'), verifyAdminRole(FINANCE_ROLES), async (req, res) => {
  try {
    if (!enforceStepUp(req, res, 'critical:payment_override', 'Step-up verification required for subscription rejection')) {
      return;
    }

    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason) {
      return res.status(400).json(errorResponse('Rejection reason is required'));
    }

    const subscription = await Subscription.findById(req.params.subscriptionId);
    if (!subscription) {
      return res.status(404).json(errorResponse('Subscription not found'));
    }

    if (subscription.status !== 'pending') {
      return res.status(409).json(errorResponse('Subscription is not pending'));
    }

    subscription.status = 'rejected';
    subscription.rejection_reason = rejectionReason;
    subscription.rejected_at = new Date();
    subscription.rejected_by = req.user._id;
    subscription.admin_notes = adminNotes;
    subscription.updated_at = new Date();
    await subscription.save();

    // Update user
    await User.findByIdAndUpdate(subscription.user_id, {
      subscription_status: 'rejected',
      updated_at: new Date()
    });

    // Log activity
    await logActivity({
      admin_id: req.user._id,
      action: 'subscription_reject',
      description: `Admin rejected subscription: ${subscription.payment_id} (${rejectionReason})`,
      target_user_id: subscription.user_id,
      target_type: 'subscription',
      target_id: subscription._id,
      ...getClientInfo(req),
      status: 'success',
      metadata: { reason: rejectionReason }
    });

    res.json(successResponse('Subscription rejected', subscription));
  } catch (error) {
    console.error('❌ Reject Subscription Error:', error);
    res.status(500).json(errorResponse('Failed to reject subscription: ' + error.message));
  }
});

// ===== GET ACTIVITY LOGS =====
router.get('/activity-logs', requirePermission('admin.audit.read'), async (req, res) => {
  try {
    const { action, userId, adminId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    let filter = {};
    if (action) filter.action = action;
    if (userId) filter.user_id = userId;
    if (adminId) filter.admin_id = adminId;

    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .populate('user_id', 'name email')
      .populate('admin_id', 'name email')
      .populate('target_user_id', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.json(
      successResponse('Activity logs fetched', {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        data: logs
      })
    );
  } catch (error) {
    console.error('❌ Get Activity Logs Error:', error);
    res.status(500).json(errorResponse('Failed to fetch activity logs: ' + error.message));
  }
});

router.get('/privacy-events/screenshots', requirePermission('admin.audit.read'), async (req, res) => {
  try {
    const {
      actorUserId,
      targetUserId,
      conversationId,
      platform,
      suspicious,
      from,
      to,
      page = 1,
      limit = 50
    } = req.query;

    const safeLimit = Math.min(200, Math.max(1, Number(limit)));
    const safePage = Math.max(1, Number(page));
    const skip = (safePage - 1) * safeLimit;

    const filter = {};
    if (actorUserId) filter.actorUserId = actorUserId;
    if (targetUserId) filter.targetUserId = targetUserId;
    if (conversationId) filter.conversationId = conversationId;
    if (platform) filter.platform = String(platform).toLowerCase();
    if (suspicious !== undefined) {
      filter.suspicious = String(suspicious).toLowerCase() === 'true';
    }
    if (from || to) {
      filter.occurredAt = {};
      if (from) filter.occurredAt.$gte = new Date(from);
      if (to) filter.occurredAt.$lte = new Date(to);
    }

    const [total, rows] = await Promise.all([
      ScreenshotLog.countDocuments(filter),
      ScreenshotLog.find(filter)
        .populate('actorUserId', 'name email role')
        .populate('targetUserId', 'name email status')
        .sort({ occurredAt: -1, _id: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean()
    ]);

    const actorIds = [...new Set(rows.map((row) => String(row.actorUserId?._id || row.actorUserId || '')).filter(Boolean))];
    const frequencyRows = actorIds.length
      ? await ScreenshotLog.aggregate([
          {
            $match: {
              actorUserId: { $in: actorIds.map((id) => new mongoose.Types.ObjectId(id)) },
              occurredAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: '$actorUserId',
              count7d: { $sum: 1 }
            }
          }
        ])
      : [];

    const frequencyMap = new Map(frequencyRows.map((row) => [String(row._id), Number(row.count7d || 0)]));
    const data = rows.map((row) => ({
      ...row,
      frequency7d: frequencyMap.get(String(row.actorUserId?._id || row.actorUserId || '')) || 0
    }));

    return res.json(successResponse('Screenshot privacy events fetched', {
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit),
      data
    }));
  } catch (error) {
    console.error('❌ Screenshot Events Fetch Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch screenshot privacy events'));
  }
});

router.get('/privacy-events/screenshots/risk', requirePermission('admin.audit.read'), async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 100)));
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [grouped, perTarget] = await Promise.all([
      ScreenshotLog.aggregate([
        {
          $group: {
            _id: '$actorUserId',
            totalScreenshots: { $sum: 1 },
            uniqueTargets: { $addToSet: '$targetUserId' },
            screenshots24h: {
              $sum: {
                $cond: [{ $gte: ['$occurredAt', since24h] }, 1, 0]
              }
            },
            averageRiskScore: { $avg: '$riskScore' },
            suspiciousCount: {
              $sum: {
                $cond: ['$suspicious', 1, 0]
              }
            },
            lastOccurredAt: { $max: '$occurredAt' }
          }
        },
        {
          $project: {
            totalScreenshots: 1,
            screenshots24h: 1,
            uniqueTargets: {
              $size: {
                $filter: {
                  input: '$uniqueTargets',
                  as: 'targetId',
                  cond: { $ne: ['$$targetId', null] }
                }
              }
            },
            averageRiskScore: { $round: ['$averageRiskScore', 2] },
            suspiciousCount: 1,
            lastOccurredAt: 1
          }
        }
      ]),
      ScreenshotLog.aggregate([
        {
          $group: {
            _id: { actorUserId: '$actorUserId', targetUserId: '$targetUserId' },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.actorUserId',
            maxTargetCount: { $max: '$count' }
          }
        }
      ])
    ]);

    const maxTargetMap = new Map(perTarget.map((row) => [String(row._id), Number(row.maxTargetCount || 0)]));

    const actorIds = grouped
      .map((row) => row._id)
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

    const actorUsers = actorIds.length
      ? await User.find({ _id: { $in: actorIds } }).select('name email role status').lean()
      : [];

    const actorMap = new Map(actorUsers.map((user) => [String(user._id), user]));

    const withRisk = grouped.map((row) => {
      const actorId = String(row._id || '');
      const maxTargetCount = maxTargetMap.get(actorId) || 0;
      const computedRiskScore = Math.min(
        100,
        (Number(row.totalScreenshots || 0) * 8)
          + (Number(row.uniqueTargets || 0) * 12)
          + (Number(row.screenshots24h || 0) * 15)
          + (maxTargetCount * 10)
          + Math.round(Number(row.averageRiskScore || 0) * 0.35)
      );

      return {
        actorUserId: actorId,
        actor: actorMap.get(actorId) || null,
        totalScreenshots: Number(row.totalScreenshots || 0),
        screenshots24h: Number(row.screenshots24h || 0),
        uniqueTargets: Number(row.uniqueTargets || 0),
        suspiciousCount: Number(row.suspiciousCount || 0),
        averageRiskScore: Number(row.averageRiskScore || 0),
        maxTargetCount,
        riskScore: computedRiskScore,
        suspicious: computedRiskScore >= 65 || Number(row.screenshots24h || 0) >= 3 || maxTargetCount >= 4,
        lastOccurredAt: row.lastOccurredAt || null
      };
    });

    withRisk.sort((a, b) => b.riskScore - a.riskScore);

    return res.json(successResponse('Screenshot risk profiles fetched', {
      data: withRisk.slice(0, limit)
    }));
  } catch (error) {
    console.error('❌ Screenshot Risk Summary Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch screenshot risk profiles'));
  }
});

router.get('/privacy-events/screenshots/export', requirePermission('admin.audit.export'), async (req, res) => {
  try {
    const limit = Math.min(10000, Math.max(1, Number(req.query.limit || 5000)));
    const rows = await ScreenshotLog.find({})
      .populate('actorUserId', 'name email role')
      .populate('targetUserId', 'name email status')
      .sort({ occurredAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    await logActivity({
      admin_id: req.user._id,
      action: 'screenshot_privacy_events_export',
      description: `Exported ${rows.length} screenshot privacy events`,
      ...getClientInfo(req),
      status: 'success',
      metadata: { count: rows.length }
    });

    res.setHeader('Content-Disposition', `attachment; filename="screenshot-privacy-events-${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({ success: true, data: rows }, null, 2));
  } catch (error) {
    console.error('❌ Screenshot Events Export Error:', error);
    return res.status(500).json(errorResponse('Failed to export screenshot privacy events'));
  }
});

router.get('/audit-logs/immutable', requirePermission('admin.audit.read'), async (req, res) => {
  try {
    const {
      action,
      actorId,
      targetId,
      status,
      from,
      to,
      page = 1,
      limit = 50
    } = req.query;

    const safeLimit = Math.min(200, Math.max(1, Number(limit)));
    const safePage = Math.max(1, Number(page));
    const skip = (safePage - 1) * safeLimit;

    const filter = {};
    if (action) filter.action = String(action).toLowerCase();
    if (actorId) filter.actorId = actorId;
    if (targetId) filter.targetId = String(targetId);
    if (status) filter.status = status;
    if (from || to) {
      filter.occurredAt = {};
      if (from) filter.occurredAt.$gte = new Date(from);
      if (to) filter.occurredAt.$lte = new Date(to);
    }

    const [total, rows] = await Promise.all([
      ImmutableAuditLog.countDocuments(filter),
      ImmutableAuditLog.find(filter)
        .populate('actorId', 'name email role')
        .sort({ occurredAt: -1, _id: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean()
    ]);

    return res.json(successResponse('Immutable audit logs fetched', {
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit),
      data: rows
    }));
  } catch (error) {
    console.error('❌ Immutable Audit Fetch Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch immutable audit logs'));
  }
});

router.get('/audit-logs/immutable/export', requirePermission('admin.audit.export'), async (req, res) => {
  try {
    const safeLimit = Math.min(5000, Math.max(1, Number(req.query.limit || 2000)));
    const rows = await ImmutableAuditLog.find({})
      .sort({ occurredAt: -1, _id: -1 })
      .limit(safeLimit)
      .lean();

    await logActivity({
      admin_id: req.user._id,
      action: 'immutable_audit_export',
      description: `Exported ${rows.length} immutable audit logs`,
      ...getClientInfo(req),
      status: 'success',
      metadata: { count: rows.length }
    });

    res.setHeader('Content-Disposition', `attachment; filename="immutable-audit-${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({ success: true, data: rows }, null, 2));
  } catch (error) {
    console.error('❌ Immutable Audit Export Error:', error);
    return res.status(500).json(errorResponse('Failed to export immutable audit logs'));
  }
});

router.get('/trust-safety/cases', requirePermission('admin.reports.read'), async (req, res) => {
  try {
    const severity = req.query.severity ? String(req.query.severity) : '';
    const status = req.query.status ? String(req.query.status) : '';
    const assignedTo = req.query.assignedTo ? String(req.query.assignedTo) : '';
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));

    const filter = {};
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    const cases = await ModerationCase.find(filter)
      .populate('targetUserId', 'name email status warnings_count')
      .populate('assignedTo', 'name email role')
      .sort({ severity: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json(successResponse('Moderation cases fetched', { data: cases }));
  } catch (error) {
    console.error('❌ Moderation Cases Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch moderation cases'));
  }
});

router.post('/trust-safety/cases/:caseId/assign', requirePermission('admin.cases.assign'), async (req, res) => {
  try {
    const { caseId } = req.params;
    const { assignedTo, note = '' } = req.body || {};

    if (!assignedTo) {
      return res.status(400).json(errorResponse('assignedTo is required'));
    }

    const caseDoc = await ModerationCase.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json(errorResponse('Moderation case not found'));
    }

    caseDoc.assignedTo = assignedTo;
    caseDoc.status = 'in_review';
    caseDoc.lastActionAt = new Date();
    if (note) {
      caseDoc.notes.push({ actorId: req.user._id, body: note });
    }
    await caseDoc.save();

    await logActivity({
      admin_id: req.user._id,
      action: 'moderation_case_assigned',
      description: `Assigned moderation case ${caseDoc._id} to ${assignedTo}`,
      target_type: 'moderation_case',
      target_id: caseDoc._id.toString(),
      metadata: { assignedTo, note },
      ...getClientInfo(req),
      status: 'success'
    });

    return res.json(successResponse('Case assigned', caseDoc));
  } catch (error) {
    console.error('❌ Case Assign Error:', error);
    return res.status(500).json(errorResponse('Failed to assign case'));
  }
});

router.post('/trust-safety/cases/:caseId/escalate', requirePermission('admin.cases.assign'), async (req, res) => {
  try {
    if (!enforceStepUp(req, res, 'critical:*', 'Step-up verification required for escalation')) {
      return;
    }

    const { caseId } = req.params;
    const { reason } = req.body || {};
    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json(errorResponse('Escalation reason is required (min 5 chars)'));
    }

    const caseDoc = await ModerationCase.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json(errorResponse('Moderation case not found'));
    }

    caseDoc.status = 'escalated';
    caseDoc.escalationLevel = Math.min(5, Number(caseDoc.escalationLevel || 0) + 1);
    caseDoc.lastActionAt = new Date();
    caseDoc.notes.push({ actorId: req.user._id, body: `Escalated: ${String(reason).trim()}` });
    await caseDoc.save();

    await logActivity({
      admin_id: req.user._id,
      action: 'moderation_case_escalated',
      description: `Escalated moderation case ${caseDoc._id}`,
      target_type: 'moderation_case',
      target_id: caseDoc._id.toString(),
      metadata: { reason, escalationLevel: caseDoc.escalationLevel },
      ...getClientInfo(req),
      status: 'success'
    });

    return res.json(successResponse('Case escalated', caseDoc));
  } catch (error) {
    console.error('❌ Case Escalate Error:', error);
    return res.status(500).json(errorResponse('Failed to escalate case'));
  }
});

router.get('/appeals', requirePermission('admin.appeals.manage'), verifyAdminRole([...SUPER_ROLES, ...SUPPORT_ROLES]), async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status) : '';
    const filter = status ? { status } : {};

    const appeals = await AppealRequest.find(filter)
      .populate('userId', 'name email status')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.json(successResponse('Appeals fetched', { data: appeals }));
  } catch (error) {
    console.error('❌ Appeals Fetch Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch appeals'));
  }
});

router.put('/appeals/:appealId', requirePermission('admin.appeals.manage'), verifyAdminRole([...SUPER_ROLES, ...SUPPORT_ROLES]), async (req, res) => {
  try {
    const { appealId } = req.params;
    const { status, resolutionNote = '' } = req.body || {};

    if (!['pending', 'in_review', 'approved', 'rejected'].includes(String(status))) {
      return res.status(400).json(errorResponse('Invalid appeal status'));
    }

    const appeal = await AppealRequest.findById(appealId);
    if (!appeal) {
      return res.status(404).json(errorResponse('Appeal not found'));
    }

    appeal.status = status;
    appeal.assignedTo = req.user._id;
    appeal.resolutionNote = resolutionNote;
    appeal.resolvedAt = ['approved', 'rejected'].includes(status) ? new Date() : null;
    await appeal.save();

    await logActivity({
      admin_id: req.user._id,
      action: 'appeal_status_update',
      description: `Appeal ${appeal._id} moved to ${status}`,
      target_type: 'appeal',
      target_id: appeal._id.toString(),
      metadata: { status, resolutionNote },
      ...getClientInfo(req),
      status: 'success'
    });

    return res.json(successResponse('Appeal updated', appeal));
  } catch (error) {
    console.error('❌ Appeal Update Error:', error);
    return res.status(500).json(errorResponse('Failed to update appeal'));
  }
});

router.get('/security/alerts', requirePermission('admin.audit.read'), async (req, res) => {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const previous24h = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const [suspiciousSessions, privacyEvents24h, privacyEventsPrev24h, newReports24h, newReportsPrev24h, massMessagingSignals] = await Promise.all([
      AdminSession.countDocuments({ suspicious: true, createdAt: { $gte: since24h } }),
      PrivacyEvent.countDocuments({ createdAt: { $gte: since24h } }),
      PrivacyEvent.countDocuments({ createdAt: { $gte: previous24h, $lt: since24h } }),
      Report.countDocuments({ created_at: { $gte: since24h } }),
      Report.countDocuments({ created_at: { $gte: previous24h, $lt: since24h } }),
      Message.aggregate([
        { $match: { createdAt: { $gte: since24h } } },
        {
          $group: {
            _id: '$senderId',
            totalMessages: { $sum: 1 },
            uniqueReceivers: { $addToSet: '$receiverId' }
          }
        },
        {
          $project: {
            totalMessages: 1,
            uniqueReceiverCount: { $size: '$uniqueReceivers' }
          }
        },
        {
          $match: {
            totalMessages: { $gte: 80 },
            uniqueReceiverCount: { $gte: 25 }
          }
        },
        { $limit: 100 }
      ])
    ]);

    const reportSpike = newReportsPrev24h > 0
      ? Number((((newReports24h - newReportsPrev24h) / newReportsPrev24h) * 100).toFixed(2))
      : (newReports24h > 0 ? 100 : 0);

    const privacySpike = privacyEventsPrev24h > 0
      ? Number((((privacyEvents24h - privacyEventsPrev24h) / privacyEventsPrev24h) * 100).toFixed(2))
      : (privacyEvents24h > 0 ? 100 : 0);

    return res.json(successResponse('Security alerts calculated', {
      suspiciousSessions,
      massMessagingSignals: massMessagingSignals.length,
      privacyEvents24h,
      privacySpike,
      reportVolume24h: newReports24h,
      reportSpike,
      severity: {
        suspiciousLogins: suspiciousSessions > 5 ? 'high' : suspiciousSessions > 0 ? 'medium' : 'low',
        reportSpike: reportSpike > 70 ? 'high' : reportSpike > 25 ? 'medium' : 'low',
        privacySpike: privacySpike > 70 ? 'high' : privacySpike > 25 ? 'medium' : 'low',
        massMessaging: massMessagingSignals.length > 5 ? 'high' : massMessagingSignals.length > 0 ? 'medium' : 'low'
      }
    }));
  } catch (error) {
    console.error('❌ Security Alerts Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch security alerts'));
  }
});

router.get('/flagged-users', requirePermission('admin.users.read'), async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 100)));

    const users = await User.aggregate([
      { $match: { role: 'user' } },
      {
        $lookup: {
          from: 'reports',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$target_user_id', '$$userId'] } } },
            { $group: { _id: null, reportCount: { $sum: 1 }, openCount: { $sum: { $cond: [{ $in: ['$status', ['open', 'investigating']] }, 1, 0] } } } }
          ],
          as: 'reportAgg'
        }
      },
      {
        $addFields: {
          reportCount: { $ifNull: [{ $arrayElemAt: ['$reportAgg.reportCount', 0] }, 0] },
          openReportCount: { $ifNull: [{ $arrayElemAt: ['$reportAgg.openCount', 0] }, 0] },
          riskScore: {
            $min: [100, { $add: [
              { $multiply: [{ $ifNull: ['$warnings_count', 0] }, 18] },
              { $multiply: [{ $ifNull: [{ $arrayElemAt: ['$reportAgg.reportCount', 0] }, 0] }, 14] },
              { $cond: [{ $eq: ['$status', 'banned'] }, 40, 0] }
            ] }]
          }
        }
      },
      { $match: { $or: [{ riskScore: { $gte: 50 } }, { openReportCount: { $gte: 1 } }, { status: 'banned' }] } },
      { $project: { name: 1, email: 1, status: 1, warnings_count: 1, reportCount: 1, openReportCount: 1, riskScore: 1, last_login: 1 } },
      { $sort: { riskScore: -1, openReportCount: -1, updated_at: -1 } },
      { $limit: limit }
    ]);

    return res.json(successResponse('Flagged users fetched', { data: users }));
  } catch (error) {
    console.error('❌ Flagged Users Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch flagged users'));
  }
});

router.get('/deletion-requests', requirePermission('admin.appeals.manage'), verifyAdminRole([...SUPER_ROLES, ...SUPPORT_ROLES]), async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status) : '';
    const filter = status ? { status } : {};
    const rows = await DataDeletionRequest.find(filter)
      .populate('userId', 'name email status')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.json(successResponse('Deletion requests fetched', { data: rows }));
  } catch (error) {
    console.error('❌ Deletion Request Fetch Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch deletion requests'));
  }
});

router.put('/deletion-requests/:requestId', requirePermission('admin.appeals.manage'), verifyAdminRole([...SUPER_ROLES, ...SUPPORT_ROLES]), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, reviewNote = '', retentionDays } = req.body || {};

    if (!['pending', 'approved', 'rejected', 'completed'].includes(String(status))) {
      return res.status(400).json(errorResponse('Invalid deletion request status'));
    }

    const row = await DataDeletionRequest.findById(requestId);
    if (!row) {
      return res.status(404).json(errorResponse('Deletion request not found'));
    }

    row.status = status;
    row.reviewedBy = req.user._id;
    row.reviewNote = reviewNote;
    if (retentionDays !== undefined) {
      row.retentionDays = Math.max(0, Math.min(365, Number(retentionDays) || row.retentionDays));
    }
    row.scheduledFor = status === 'approved'
      ? new Date(Date.now() + row.retentionDays * 24 * 60 * 60 * 1000)
      : row.scheduledFor;
    row.completedAt = status === 'completed' ? new Date() : row.completedAt;
    await row.save();

    await logActivity({
      admin_id: req.user._id,
      action: 'data_deletion_request_update',
      description: `Data deletion request ${row._id} moved to ${status}`,
      target_type: 'data_deletion_request',
      target_id: row._id.toString(),
      metadata: { status, reviewNote, retentionDays: row.retentionDays },
      ...getClientInfo(req),
      status: 'success'
    });

    return res.json(successResponse('Deletion request updated', row));
  } catch (error) {
    console.error('❌ Deletion Request Update Error:', error);
    return res.status(500).json(errorResponse('Failed to update deletion request'));
  }
});

// ===== EXPORT USERS TO EXCEL =====
router.get('/export/users', requirePermission('admin.audit.export'), verifyAdminRole(SUPER_ROLES), async (req, res) => {
  try {
    const { status } = req.query;

    let filter = { role: 'user' };
    if (status) filter.status = status;

    const users = await User.find(filter)
      .sort({ created_at: -1 })
      .select('name email collegeEmail phone gender course year status subscription_status subscription_plan created_at');

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    // Add headers
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'College Email', key: 'collegeEmail', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Course', key: 'course', width: 15 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Account Status', key: 'status', width: 15 },
      { header: 'Subscription Status', key: 'subscription_status', width: 18 },
      { header: 'Plan', key: 'subscription_plan', width: 12 },
      { header: 'Created Date', key: 'created_at', width: 18 }
    ];

    // Add data
    users.forEach(user => {
      worksheet.addRow({
        name: user.name,
        email: user.email,
        collegeEmail: user.collegeEmail || '-',
        phone: user.phone || '-',
        gender: user.gender || '-',
        course: user.course || '-',
        year: user.year || '-',
        status: user.status,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan || '-',
        created_at: user.created_at?.toLocaleDateString()
      });
    });

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } };

    // Generate file
    const filename = `seeu-daters-users-${Date.now()}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    await workbook.xlsx.write(res);

    // Log activity
    await logActivity({
      admin_id: req.user._id,
      action: 'user_export',
      description: `Admin exported ${users.length} users to Excel`,
      ...getClientInfo(req),
      status: 'success',
      metadata: { count: users.length, filter }
    });

    res.end();
  } catch (error) {
    console.error('❌ Export Users Error:', error);
    res.status(500).json(errorResponse('Failed to export users: ' + error.message));
  }
});

// ===== EXPORT SUBSCRIPTIONS TO EXCEL =====
router.get('/export/subscriptions', requirePermission('admin.audit.export'), verifyAdminRole(FINANCE_ROLES), async (req, res) => {
  try {
    const { status } = req.query;

    let filter = {};
    if (status) filter.status = status;

    const subscriptions = await Subscription.find(filter)
      .populate('user_id', 'name email phone')
      .sort({ created_at: -1 });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Subscriptions');

    // Add headers
    worksheet.columns = [
      { header: 'User Name', key: 'userName', width: 20 },
      { header: 'Email', key: 'userEmail', width: 25 },
      { header: 'Phone', key: 'userPhone', width: 15 },
      { header: 'Plan', key: 'plan', width: 12 },
      { header: 'Amount', key: 'amount', width: 10 },
      { header: 'Payment ID (UTR)', key: 'payment_id', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Start Date', key: 'start_date', width: 15 },
      { header: 'Expiry Date', key: 'expiry_date', width: 15 },
      { header: 'Submitted Date', key: 'created_at', width: 18 },
      { header: 'Notes', key: 'admin_notes', width: 25 }
    ];

    // Add data
    subscriptions.forEach(sub => {
      worksheet.addRow({
        userName: sub.user_id?.name || '-',
        userEmail: sub.user_id?.email || '-',
        userPhone: sub.user_id?.phone || '-',
        plan: sub.plan,
        amount: sub.amount,
        payment_id: sub.payment_id,
        status: sub.status,
        start_date: sub.start_date?.toLocaleDateString() || '-',
        expiry_date: sub.expiry_date?.toLocaleDateString() || '-',
        created_at: sub.created_at?.toLocaleDateString(),
        admin_notes: sub.admin_notes || '-'
      });
    });

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } };

    // Generate file
    const filename = `seeu-daters-subscriptions-${Date.now()}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    await workbook.xlsx.write(res);

    // Log activity
    await logActivity({
      admin_id: req.user._id,
      action: 'subscription_export',
      description: `Admin exported ${subscriptions.length} subscriptions to Excel`,
      ...getClientInfo(req),
      status: 'success',
      metadata: { count: subscriptions.length, filter }
    });

    res.end();
  } catch (error) {
    console.error('❌ Export Subscriptions Error:', error);
    res.status(500).json(errorResponse('Failed to export subscriptions: ' + error.message));
  }
});

// ===== ADMIN CHAT MONITORING =====
router.get('/monitor-chats', requirePermission('admin.chat.read_sensitive'), async (req, res) => {
  try {
    // Get all conversations with participant details
    const conversations = await Conversation.find()
      .populate('participants', 'name email college course')
      .sort({ lastMessageTime: -1 })
      .lean();

    // Log activity
    await logActivity({
      admin_id: req.user._id,
      action: 'viewed_chat_list',
      description: 'Admin accessed chat monitoring dashboard',
      ...getClientInfo(req),
      status: 'success',
      metadata: { count: conversations.length }
    });

    return res.json(successResponse('Conversations fetched', {
      data: conversations,
      total: conversations.length
    }));
  } catch (error) {
    console.error('❌ Monitor Chats Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch conversations: ' + error.message));
  }
});

// ===== GET CHAT MESSAGES (for monitoring) =====
router.get('/monitor-chats/:conversationId', requirePermission('admin.chat.read_sensitive'), async (req, res) => {
  try {
    const { conversationId } = req.params;
    const accessReason = String(req.query.reason || req.body?.reason || '').trim();

    if (!accessReason || accessReason.length < 5) {
      return res.status(400).json(errorResponse('Reason is required before viewing private conversations (min 5 chars)'));
    }

    if (!enforceStepUp(req, res, 'critical:view_private_chat', 'Step-up verification required for chat monitoring')) {
      return;
    }

    // Get conversation details
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name email college course');

    if (!conversation) {
      return res.status(404).json(errorResponse('Conversation not found'));
    }

    // Get all messages in the conversation
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Log activity
    await logActivity({
      admin_id: req.user._id,
      action: 'viewed_chat_messages',
      description: `Admin viewed ${messages.length} messages in conversation`,
      target_id: conversationId,
      target_type: 'conversation',
      ...getClientInfo(req),
      status: 'success',
      metadata: {
        conversationId,
        reason: accessReason,
        messageCount: messages.length,
        participants: conversation.participants.map(p => p.name)
      }
    });

    return res.json(successResponse('Messages fetched', {
      data: messages,
      conversation: {
        _id: conversation._id,
        participants: conversation.participants
      },
      total: messages.length
    }));
  } catch (error) {
    console.error('❌ Fetch Messages Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch messages: ' + error.message));
  }
});

// ===== CLEANUP: DELETE USER BY EMAIL (DEV/TEST) =====
/**
 * Delete a user and all related data (for testing/cleanup)
 * POST /api/admin/cleanup/delete-user
 * Body: { email: "test@example.com" }
 * 
 * Deletes:
 * - User document
 * - All Likes
 * - All Conversations & Messages
 * - All Subscriptions
 * - All Activity Logs
 */
router.post('/cleanup/delete-user', requirePermission('admin.users.moderate'), async (req, res) => {
  try {
    if (!enforceStepUp(req, res, 'critical:delete_user', 'Step-up verification required for hard user deletion')) {
      return;
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json(errorResponse('Email is required'));
    }

    const emailLower = email.toLowerCase().trim();
    console.log(`\n🗑️ [CLEANUP] Attempting to delete user: ${emailLower}`);

    // Find user first
    const user = await User.findOne({ email: emailLower });

    if (!user) {
      return res.status(404).json(errorResponse(`User not found: ${emailLower}`));
    }

    const userId = user._id;
    console.log(`Found user: ${user.name} (ID: ${userId})`);

    // Delete all related data
    const deletionStats = {
      user: 0,
      likes: 0,
      conversations: 0,
      messages: 0,
      subscriptions: 0,
      activityLogs: 0,
      matches: 0,
      reports: 0
    };

    try {
      // Delete user
      const userDelete = await User.deleteOne({ _id: userId });
      deletionStats.user = userDelete.deletedCount;
      console.log(`✓ User deleted`);

      // Delete likes by this user
      const likeDelete = await Like.deleteMany({ $or: [{ userId }, { targetUserId: userId }] });
      deletionStats.likes = likeDelete.deletedCount;
      console.log(`✓ ${likeDelete.deletedCount} likes deleted`);

      // Delete conversations involving this user
      const convDelete = await Conversation.deleteMany({ participants: userId });
      deletionStats.conversations = convDelete.deletedCount;
      console.log(`✓ ${convDelete.deletedCount} conversations deleted`);

      // Delete messages from this user
      const msgDelete = await Message.deleteMany({ senderId: userId });
      deletionStats.messages = msgDelete.deletedCount;
      console.log(`✓ ${msgDelete.deletedCount} messages deleted`);

      // Delete subscriptions by this user
      const subDelete = await Subscription.deleteMany({ userId });
      deletionStats.subscriptions = subDelete.deletedCount;
      console.log(`✓ ${subDelete.deletedCount} subscriptions deleted`);

      // Delete activity logs by this user
      const logDelete = await ActivityLog.deleteMany({ user_id: userId });
      deletionStats.activityLogs = logDelete.deletedCount;
      console.log(`✓ ${logDelete.deletedCount} activity logs deleted`);

      // Delete matches involving this user
      const matchDelete = await Match.deleteMany({ $or: [{ userId }, { targetUserId: userId }] });
      deletionStats.matches = matchDelete.deletedCount;
      console.log(`✓ ${matchDelete.deletedCount} matches deleted`);

      // Delete reports by this user
      const reportDelete = await Report.deleteMany({ reportedBy: userId });
      deletionStats.reports = reportDelete.deletedCount;
      console.log(`✓ ${reportDelete.deletedCount} reports deleted`);

    } catch (deleteError) {
      console.error('Error during cleanup:', deleteError);
      return res.status(500).json(errorResponse('Cleanup failed: ' + deleteError.message));
    }

    console.log(`\n✅ [CLEANUP COMPLETE] User ${emailLower} and all data removed`);

    // Log this action
    await logActivity({
      admin_id: req.user._id,
      action: 'user_cleanup_delete',
      description: `Deleted user: ${emailLower}`,
      ...getClientInfo(req),
      details: deletionStats,
      status: 'success'
    });

    res.json(
      successResponse(`User ${emailLower} and all related data permanently deleted`, {
        deletedEmail: emailLower,
        stats: deletionStats,
        timestamp: new Date()
      })
    );
  } catch (error) {
    console.error('❌ Cleanup Delete User Error:', error);
    res.status(500).json(errorResponse('Failed to cleanup user: ' + error.message));
  }
});

// ===== CAREER APPLICATIONS =====

// SUBMIT CAREER APPLICATION (Public)
router.post('/career-applications/submit', async (req, res) => {
  try {
    const { fullName, email, phone, campus, whyYou, instagram, linkedin, experience } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !campus || !whyYou || !instagram || !linkedin || !experience) {
      return res.status(400).json(errorResponse('All fields are required'));
    }

    // Validate campus
    if (!['CU Mohali', 'CU UP'].includes(campus)) {
      return res.status(400).json(errorResponse('Invalid campus selected'));
    }

    // Validate whyYou length
    if (whyYou.length < 50 || whyYou.length > 2000) {
      return res.status(400).json(errorResponse('Your reason must be between 50 and 2000 characters'));
    }

    // Validate experience length
    if (experience.length < 20 || experience.length > 1000) {
      return res.status(400).json(errorResponse('Experience must be between 20 and 1000 characters'));
    }

    // Validate LinkedIn URL
    if (!/^https?:\/\/.+/i.test(linkedin)) {
      return res.status(400).json(errorResponse('LinkedIn profile must be a valid URL'));
    }

    // Check if already applied from this email
    const existingApp = await CareerApplication.findOne({ email: email.toLowerCase() });
    if (existingApp) {
      return res.status(400).json(errorResponse('You have already submitted an application'));
    }

    // Create new application
    const application = new CareerApplication({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      campus,
      whyYou,
      instagram: instagram.trim(),
      linkedin: linkedin.trim(),
      experience: experience.trim()
    });

    await application.save();

    console.log(`✅ Career application submitted: ${email} for ${campus}`);

    res.json(successResponse('Application submitted successfully! We\'ll review and reach out soon.', {
      applicationId: application._id,
      email: application.email
    }));
  } catch (error) {
    console.error('❌ Career Application Submit Error:', error);
    res.status(500).json(errorResponse('Failed to submit application: ' + error.message));
  }
});

// GET ALL CAREER APPLICATIONS (Admin only)
router.get('/career-applications', verifyAdmin, async (req, res) => {
  try {
    const { status, campus, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) filter.status = status;
    if (campus) filter.campus = campus;

    if (search) {
      const searchTerm = search.trim();
      filter.$or = [
        { fullName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const total = await CareerApplication.countDocuments(filter);
    const applications = await CareerApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(successResponse('Career applications retrieved', {
      data: applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }));
  } catch (error) {
    console.error('❌ Get Career Applications Error:', error);
    res.status(500).json(errorResponse('Failed to fetch applications: ' + error.message));
  }
});

// UPDATE CAREER APPLICATION STATUS (Admin only)
router.patch('/career-applications/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    // Validate status
    if (!['pending', 'contacted', 'rejected', 'approved'].includes(status)) {
      return res.status(400).json(errorResponse('Invalid status'));
    }

    const application = await CareerApplication.findByIdAndUpdate(
      id,
      { status, adminNotes: adminNotes || null, updatedAt: Date.now() },
      { new: true }
    );

    if (!application) {
      return res.status(404).json(errorResponse('Application not found'));
    }

    console.log(`✅ Career application updated: ${application.email} - Status: ${status}`);

    res.json(successResponse('Application updated successfully', { data: application }));
  } catch (error) {
    console.error('❌ Update Career Application Error:', error);
    res.status(500).json(errorResponse('Failed to update application: ' + error.message));
  }
});

// GET SINGLE CAREER APPLICATION (Admin only)
router.get('/career-applications/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const application = await CareerApplication.findById(id);

    if (!application) {
      return res.status(404).json(errorResponse('Application not found'));
    }

    res.json(successResponse('Application retrieved', { data: application }));
  } catch (error) {
    console.error('❌ Get Career Application Error:', error);
    res.status(500).json(errorResponse('Failed to fetch application: ' + error.message));
  }
});

export default router;

