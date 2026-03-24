import User from '../models/User.js';
import { verifyToken } from '../utils/auth.js';
import { verifyFirebaseIdToken, isFirebaseReady } from '../utils/firebaseAdmin.js';

const getBearerToken = (headerValue = '') => {
  if (!headerValue || !headerValue.startsWith('Bearer ')) {
    return null;
  }
  return headerValue.replace('Bearer ', '').trim();
};

const resolveUserFromFirebase = async (decodedFirebaseToken) => {
  if (!decodedFirebaseToken) {
    return null;
  }

  const firebaseUid = decodedFirebaseToken.uid;
  const email = decodedFirebaseToken.email?.toLowerCase();

  let user = await User.findOne({ firebase_uid: firebaseUid });
  if (user) {
    return user;
  }

  user = await User.findOne({
    $or: [
      ...(email ? [{ email }, { collegeEmail: email }, { personalEmail: email }] : [])
    ]
  }).sort({ created_at: 1 });

  // Link known email identity to firebase UID once to avoid repeated duplicate-user flows.
  if (user && !user.firebase_uid && firebaseUid) {
    try {
      user.firebase_uid = firebaseUid;
      await user.save();
    } catch {
      // If concurrent request linked it already, just continue with resolved user.
      const resolved = await User.findOne({ firebase_uid: firebaseUid });
      if (resolved) {
        return resolved;
      }
    }
  }

  return user;
};

const resolveUserFromJwt = async (decodedJwt) => {
  if (!decodedJwt?.userId) {
    return null;
  }
  return await User.findById(decodedJwt.userId);
};

export const verifyFirebaseOrJwtAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ success: false, message: 'No authentication token provided' });
    }

    const decodedFirebase = await verifyFirebaseIdToken(token);
    if (decodedFirebase) {
      const user = await resolveUserFromFirebase(decodedFirebase);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authenticated user not found' });
      }

      req.user = user;
      req.userId = user._id;
      req.authProvider = 'firebase';
      return next();
    }

    const allowJwtFallback = process.env.ALLOW_JWT_AUTH_FALLBACK !== 'false';
    if (!allowJwtFallback) {
      const authMode = isFirebaseReady() ? 'firebase-only' : 'firebase-config-missing';
      return res.status(401).json({
        success: false,
        message: 'Invalid Firebase token',
        details: { authMode }
      });
    }

    const decodedJwt = verifyToken(token);
    if (!decodedJwt) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const user = await resolveUserFromJwt(decodedJwt);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    req.userId = user._id;
    req.authProvider = 'jwt';
    next();
  } catch (error) {
    console.error('[Auth Error]:', error.message);
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

export default verifyFirebaseOrJwtAuth;
