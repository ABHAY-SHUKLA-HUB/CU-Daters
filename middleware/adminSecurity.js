import rateLimit from 'express-rate-limit';
import { ensureActiveAdminSession } from '../services/securityService.js';

export const adminCriticalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 80 : 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many admin actions. Please slow down.'
  }
});

const ADMIN_MUTATING_ALLOWLIST = new Set(['/login', '/refresh', '/logout']);

export const enforceAdminSessionSecurity = async (req, res, next) => {
  try {
    const sessionId = req.user?.sessionId || req.authSessionId;
    if (!sessionId) {
      return res.status(401).json({ success: false, message: 'Re-authentication required (missing admin session)' });
    }

    // In development, skip CSRF validation to allow easier testing
    const enforceCsrf = process.env.NODE_ENV !== 'development' && !ADMIN_MUTATING_ALLOWLIST.has(req.path);
    const session = await ensureActiveAdminSession({ sessionId, req, enforceCsrf });

    if (!session) {
      return res.status(401).json({ success: false, message: 'Admin session expired or invalid. Please sign in again.' });
    }

    req.adminSession = session;
    next();
  } catch (error) {
    console.error('Admin session security error:', error.message);
    return res.status(500).json({ success: false, message: 'Session security check failed' });
  }
};

export const sanitizeRequestStrings = (req, _res, next) => {
  const sanitize = (value) => {
    if (typeof value === 'string') {
      return value.replace(/[<>]/g, '').trim();
    }
    if (Array.isArray(value)) {
      return value.map((entry) => sanitize(entry));
    }
    if (value && typeof value === 'object') {
      return Object.entries(value).reduce((acc, [key, val]) => {
        acc[key] = sanitize(val);
        return acc;
      }, {});
    }
    return value;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitize(req.query);
  }

  next();
};
