// src/backend/middleware/auth.js
const admin = require('firebase-admin');

/**
 * Verify Firebase ID token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'missing_token',
        message: 'Authorization token is required'
      });
    }

    // Verify token with Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;

    next();
  } catch (error) {
    console.error('Authentication error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'token_expired',
        message: 'Authorization token has expired'
      });
    }

    res.status(401).json({
      error: 'invalid_token',
      message: 'Invalid authorization token'
    });
  }
};

/**
 * Check if user has admin role
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'not_authenticated',
        message: 'User is not authenticated'
      });
    }

    // Check custom claims for admin role
    if (req.user.admin !== true && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'insufficient_permissions',
        message: 'User does not have admin privileges'
      });
    }

    next();
  } catch (error) {
    console.error('Admin authorization error:', error);

    res.status(403).json({
      error: 'authorization_error',
      message: 'Failed to verify admin status'
    });
  }
};

/**
 * Validate request payload
 */
const validatePayload = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: 'validation_failed',
        message: error.details[0].message,
        details: error.details
      });
    }

    req.validatedBody = value;
    next();
  };
};

module.exports = {
  authenticate,
  requireAdmin,
  validatePayload
};
