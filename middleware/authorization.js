import { verifyStepUpToken } from '../services/securityService.js';

export const ADMIN_ROLE_PERMISSIONS = {
  super_admin: ['*'],
  admin: [
    'admin.dashboard.read',
    'admin.users.read',
    'admin.users.moderate',
    'admin.chat.read_metadata',
    'admin.chat.read_sensitive',
    'admin.chat.freeze',
    'admin.reports.read',
    'admin.reports.resolve',
    'admin.settings.read',
    'admin.settings.write',
    'admin.colleges.write',
    'admin.audit.read',
    'admin.audit.export',
    'admin.payments.read',
    'admin.payments.override',
    'admin.support.manage',
    'admin.appeals.manage',
    'admin.cases.assign'
  ],
  moderator: [
    'admin.dashboard.read',
    'admin.users.read',
    'admin.users.moderate',
    'admin.chat.read_metadata',
    'admin.chat.read_sensitive',
    'admin.chat.freeze',
    'admin.reports.read',
    'admin.reports.resolve',
    'admin.support.manage',
    'admin.cases.assign',
    'admin.audit.read'
  ],
  finance_admin: [
    'admin.dashboard.read',
    'admin.payments.read',
    'admin.payments.override',
    'admin.settings.read',
    'admin.audit.read',
    'admin.audit.export',
    'admin.users.read'
  ],
  support_admin: [
    'admin.dashboard.read',
    'admin.support.manage',
    'admin.users.read',
    'admin.reports.read',
    'admin.audit.read',
    'admin.appeals.manage'
  ],
  analyst: [
    'admin.dashboard.read',
    'admin.users.read',
    'admin.reports.read',
    'admin.payments.read',
    'admin.audit.read'
  ]
};

export const hasPermission = (role, permission) => {
  const permissions = ADMIN_ROLE_PERMISSIONS[String(role || '').toLowerCase()] || [];
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
};

export const requireRole = (roles = []) => {
  const allowedRoles = roles.map((r) => String(r || '').toLowerCase());
  return (req, res, next) => {
    const role = String(req.user?.role || '').toLowerCase();
    if (!role) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ success: false, message: 'Insufficient role access' });
    }
    return next();
  };
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    const role = String(req.user?.role || '').toLowerCase();
    if (!role) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!hasPermission(role, permission)) {
      return res.status(403).json({ success: false, message: `Missing permission: ${permission}` });
    }
    req.permission = permission;
    return next();
  };
};

export const requireStepUp = (scope) => {
  return (req, res, next) => {
    const legacyPin = req.headers['x-admin-pin'];
    if (legacyPin && process.env.ADMIN_PIN && legacyPin === process.env.ADMIN_PIN) {
      req.stepUp = { method: 'admin_pin', scope, legacy: true };
      return next();
    }

    const token = req.headers['x-step-up-token'] || req.body?.stepUpToken;
    if (!token) {
      return res.status(403).json({ success: false, message: 'Step-up verification required' });
    }

    const decoded = verifyStepUpToken(token);
    if (!decoded) {
      return res.status(403).json({ success: false, message: 'Invalid or expired step-up verification token' });
    }

    const scopes = Array.isArray(decoded.scopes) ? decoded.scopes : [];
    if (!scopes.includes(scope) && !scopes.includes('critical:*')) {
      return res.status(403).json({ success: false, message: 'Step-up token does not grant required scope' });
    }

    if (String(decoded.userId) !== String(req.user?._id || '')) {
      return res.status(403).json({ success: false, message: 'Step-up token does not match authenticated admin' });
    }

    req.stepUp = { method: 'token', scope, decoded };
    return next();
  };
};
