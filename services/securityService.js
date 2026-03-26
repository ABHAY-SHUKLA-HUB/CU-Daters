import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import AdminSession from '../models/AdminSession.js';
import ImmutableAuditLog from '../models/ImmutableAuditLog.js';

const ACCESS_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
const STEP_UP_SECRET = process.env.STEP_UP_SECRET || `${ACCESS_SECRET}-step-up`;
const ACCESS_EXPIRES = process.env.ADMIN_ACCESS_EXPIRES || '15m';
const REFRESH_DAYS = Math.max(1, Number(process.env.ADMIN_REFRESH_DAYS || 14));
const INACTIVITY_MINUTES = Math.max(5, Number(process.env.ADMIN_INACTIVITY_MINUTES || 30));

const hash = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');

const parseCookies = (cookieHeader = '') => {
  const out = {};
  String(cookieHeader || '').split(';').forEach((chunk) => {
    const [k, ...rest] = chunk.split('=');
    if (!k) return;
    out[k.trim()] = decodeURIComponent(rest.join('=').trim());
  });
  return out;
};

const extractClientInfo = (req) => ({
  ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown',
  userAgent: req.get('User-Agent') || 'unknown',
  deviceInfo: req.get('sec-ch-ua-platform') || req.get('User-Agent') || 'unknown'
});

export const buildAccessToken = ({ userId, role, sessionId }) => jwt.sign({
  userId,
  role,
  sessionId,
  tokenType: 'admin_access'
}, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });

export const buildStepUpToken = ({ userId, role, sessionId, scopes = [] }) => jwt.sign({
  userId,
  role,
  sessionId,
  scopes,
  tokenType: 'step_up'
}, STEP_UP_SECRET, { expiresIn: '5m' });

export const verifyStepUpToken = (token) => {
  try {
    return jwt.verify(token, STEP_UP_SECRET);
  } catch {
    return null;
  }
};

export const createAdminSession = async ({ admin, req, mfaVerified = false }) => {
  const refreshToken = crypto.randomBytes(48).toString('hex');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const refreshTokenHash = hash(refreshToken);
  const csrfTokenHash = hash(csrfToken);
  const now = Date.now();
  const expiresAt = new Date(now + REFRESH_DAYS * 24 * 60 * 60 * 1000);

  const clientInfo = extractClientInfo(req);

  const recentSession = await AdminSession.findOne({ adminId: admin._id }).sort({ lastActivityAt: -1 }).lean();
  const suspicious = Boolean(recentSession && recentSession.ipAddress && recentSession.ipAddress !== clientInfo.ipAddress);

  const session = await AdminSession.create({
    adminId: admin._id,
    role: admin.role,
    refreshTokenHash,
    csrfTokenHash,
    ipAddress: clientInfo.ipAddress,
    userAgent: clientInfo.userAgent,
    deviceInfo: clientInfo.deviceInfo,
    lastActivityAt: new Date(),
    expiresAt,
    suspicious,
    metadata: {
      mfaVerifiedAt: mfaVerified ? new Date().toISOString() : null
    }
  });

  const accessToken = buildAccessToken({ userId: admin._id.toString(), role: admin.role, sessionId: session._id.toString() });

  return {
    session,
    accessToken,
    refreshToken,
    csrfToken,
    suspicious
  };
};

export const rotateAdminSession = async ({ refreshToken, req }) => {
  const hashed = hash(refreshToken);
  const session = await AdminSession.findOne({ refreshTokenHash: hashed, revokedAt: null });
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt.getTime() < now) {
    session.revokedAt = new Date();
    session.revokeReason = 'expired_refresh';
    await session.save();
    return null;
  }

  const inactivityCutoff = now - INACTIVITY_MINUTES * 60 * 1000;
  if (new Date(session.lastActivityAt).getTime() < inactivityCutoff) {
    session.revokedAt = new Date();
    session.revokeReason = 'inactive_timeout';
    await session.save();
    return null;
  }

  const newRefreshToken = crypto.randomBytes(48).toString('hex');
  const newCsrfToken = crypto.randomBytes(32).toString('hex');
  session.refreshTokenHash = hash(newRefreshToken);
  session.csrfTokenHash = hash(newCsrfToken);
  session.lastActivityAt = new Date();

  const clientInfo = extractClientInfo(req);
  session.ipAddress = clientInfo.ipAddress || session.ipAddress;
  session.userAgent = clientInfo.userAgent || session.userAgent;
  session.deviceInfo = clientInfo.deviceInfo || session.deviceInfo;

  await session.save();

  const accessToken = buildAccessToken({
    userId: session.adminId.toString(),
    role: session.role,
    sessionId: session._id.toString()
  });

  return {
    session,
    accessToken,
    refreshToken: newRefreshToken,
    csrfToken: newCsrfToken
  };
};

export const revokeSession = async ({ sessionId, reason = 'manual_logout' }) => {
  await AdminSession.findByIdAndUpdate(sessionId, {
    $set: {
      revokedAt: new Date(),
      revokeReason: reason
    }
  });
};

export const revokeAllSessionsForAdmin = async ({ adminId, exceptSessionId = null, reason = 'logout_all' }) => {
  const filter = { adminId, revokedAt: null };
  if (exceptSessionId) {
    filter._id = { $ne: exceptSessionId };
  }

  await AdminSession.updateMany(filter, {
    $set: {
      revokedAt: new Date(),
      revokeReason: reason
    }
  });
};

export const getRefreshTokenFromRequest = (req) => {
  const cookies = parseCookies(req.headers.cookie || '');
  return req.body?.refreshToken || req.headers['x-refresh-token'] || cookies.admin_refresh || '';
};

export const getCsrfTokenFromRequest = (req) => {
  const cookies = parseCookies(req.headers.cookie || '');
  return {
    requestToken: req.headers['x-csrf-token'] || req.body?.csrfToken || '',
    cookieToken: cookies.admin_csrf || ''
  };
};

export const setAdminAuthCookies = (res, { refreshToken, csrfToken }) => {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = REFRESH_DAYS * 24 * 60 * 60 * 1000;

  res.setHeader('Set-Cookie', [
    `admin_refresh=${encodeURIComponent(refreshToken)}; HttpOnly; Path=/; Max-Age=${Math.floor(maxAge / 1000)}; SameSite=Strict${isProd ? '; Secure' : ''}`,
    `admin_csrf=${encodeURIComponent(csrfToken)}; Path=/; Max-Age=${Math.floor(maxAge / 1000)}; SameSite=Strict${isProd ? '; Secure' : ''}`
  ]);
};

export const clearAdminAuthCookies = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', [
    `admin_refresh=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${isProd ? '; Secure' : ''}`,
    `admin_csrf=; Path=/; Max-Age=0; SameSite=Strict${isProd ? '; Secure' : ''}`
  ]);
};

export const ensureActiveAdminSession = async ({ sessionId, req, enforceCsrf = false }) => {
  if (!sessionId) return null;
  const session = await AdminSession.findById(sessionId);
  if (!session || session.revokedAt) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    session.revokedAt = new Date();
    session.revokeReason = 'session_expired';
    await session.save();
    return null;
  }

  const inactivityCutoff = Date.now() - INACTIVITY_MINUTES * 60 * 1000;
  if (new Date(session.lastActivityAt).getTime() < inactivityCutoff) {
    session.revokedAt = new Date();
    session.revokeReason = 'inactivity_timeout';
    await session.save();
    return null;
  }

  if (enforceCsrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const { requestToken, cookieToken } = getCsrfTokenFromRequest(req);
    const valid = requestToken && cookieToken && hash(requestToken) === session.csrfTokenHash && requestToken === cookieToken;
    if (!valid) return null;
  }

  session.lastActivityAt = new Date();
  await session.save();
  return session;
};

export const appendImmutableAuditLog = async ({
  actorId,
  role,
  action,
  targetId = '',
  targetType = '',
  reason = '',
  beforeState = null,
  afterState = null,
  status = 'success',
  ipAddress = 'unknown',
  userAgent = 'unknown',
  requestId = '',
  metadata = {}
}) => {
  const last = await ImmutableAuditLog.findOne({}).sort({ occurredAt: -1, _id: -1 }).lean();
  const prevHash = last?.hash || 'GENESIS';

  const basePayload = {
    actorId: String(actorId || ''),
    role: String(role || ''),
    action: String(action || ''),
    targetId: String(targetId || ''),
    targetType: String(targetType || ''),
    reason: String(reason || ''),
    beforeState,
    afterState,
    status,
    ipAddress,
    userAgent,
    requestId,
    metadata,
    prevHash,
    occurredAt: new Date().toISOString()
  };

  const hashValue = ImmutableAuditLog.computeHash(basePayload);

  return ImmutableAuditLog.create({
    actorId,
    role,
    action,
    targetId,
    targetType,
    reason,
    beforeState,
    afterState,
    status,
    ipAddress,
    userAgent,
    requestId,
    metadata,
    prevHash,
    hash: hashValue,
    occurredAt: new Date(basePayload.occurredAt)
  });
};
