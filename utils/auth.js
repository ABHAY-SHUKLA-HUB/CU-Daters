import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import AdminSession from '../models/AdminSession.js';
import { appendImmutableAuditLog } from '../services/securityService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
export const ADMIN_ROLES = ['admin', 'super_admin', 'moderator', 'finance_admin', 'support_admin', 'analyst'];
const ALLOW_LEGACY_ADMIN_TOKEN = String(process.env.ALLOW_LEGACY_ADMIN_TOKEN || 'false').toLowerCase() === 'true';
const ADMIN_MAX_INACTIVITY_MINUTES = Math.max(5, Number(process.env.ADMIN_INACTIVITY_MINUTES || 30));

// Generate JWT Token
export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// Verify JWT Token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

// Middleware: Verify Auth
export const verifyAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token provided' 
      });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error('[Auth Error]:', error.message);
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

// Middleware: Verify Admin
export const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token provided' 
      });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    
    const user = await User.findById(decoded.userId);
    if (!user || !ADMIN_ROLES.includes(user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const sessionId = decoded.sessionId ? String(decoded.sessionId) : '';
    if (!sessionId && !ALLOW_LEGACY_ADMIN_TOKEN) {
      return res.status(401).json({
        success: false,
        message: 'Legacy admin token denied. Please sign in again.'
      });
    }

    if (sessionId) {
      const session = await AdminSession.findById(sessionId);
      if (!session || session.revokedAt) {
        return res.status(401).json({
          success: false,
          message: 'Admin session revoked or invalid'
        });
      }

      if (new Date(session.expiresAt).getTime() < Date.now()) {
        session.revokedAt = new Date();
        session.revokeReason = 'token_expired';
        await session.save();
        return res.status(401).json({
          success: false,
          message: 'Admin session expired'
        });
      }

      const inactivityCutoff = Date.now() - ADMIN_MAX_INACTIVITY_MINUTES * 60 * 1000;
      if (new Date(session.lastActivityAt).getTime() < inactivityCutoff) {
        session.revokedAt = new Date();
        session.revokeReason = 'inactive_timeout';
        await session.save();
        return res.status(401).json({
          success: false,
          message: 'Admin session timed out due to inactivity'
        });
      }

      session.lastActivityAt = new Date();
      await session.save();
      req.authSessionId = sessionId;
      req.adminSession = session;
    }
    
    req.user = user;
    req.userId = user._id;
    req.user.sessionId = sessionId || null;
    next();
  } catch (error) {
    console.error('[Admin Auth Error]:', error.message);
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

export const verifyAdminRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient admin permission for this action'
      });
    }

    next();
  };
};

// Log Activity
export const logActivity = async (params) => {
  try {
    const {
      user_id,
      admin_id,
      actor_role,
      action,
      description,
      target_user_id,
      target_type,
      target_id,
      reason,
      before_state,
      after_state,
      ip_address,
      device_info,
      user_agent,
      request_id,
      status = 'success',
      error_message,
      metadata
    } = params;
    
    const log = new ActivityLog({
      user_id,
      admin_id,
      action,
      description,
      target_user_id,
      target_type,
      target_id,
      ip_address,
      device_info,
      user_agent,
      status,
      error_message,
      metadata,
      timestamp: new Date()
    });
    
    await log.save();

    const actorId = admin_id || user_id;
    if (actorId) {
      await appendImmutableAuditLog({
        actorId,
        role: actor_role || (admin_id ? 'admin' : 'user'),
        action,
        targetId: String(target_id || target_user_id || ''),
        targetType: String(target_type || ''),
        reason: String(reason || metadata?.reason || ''),
        beforeState: before_state || metadata?.beforeState || null,
        afterState: after_state || metadata?.afterState || null,
        status,
        ipAddress: ip_address || 'unknown',
        userAgent: user_agent || 'unknown',
        requestId: request_id || '',
        metadata: metadata || {}
      });
    }

    console.log(`✓ Activity logged: ${action} (${user_id || admin_id})`);
    return log;
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Get IP and Device Info
export const getClientInfo = (req) => {
  return {
    ip_address: req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown',
    user_agent: req.get('User-Agent') || 'unknown',
    device_info: req.get('sec-ch-ua-platform') || req.get('User-Agent')?.split(' ')[0] || 'unknown',
    request_id: req.requestId || req.headers['x-request-id'] || ''
  };
};
