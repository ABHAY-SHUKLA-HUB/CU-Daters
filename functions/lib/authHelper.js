/**
 * Authentication & JWT utilities
 */

import { ResponseHelper } from './responseHelper.js';

const ALGORITHM = 'HS256';
const ENCODING = 'utf-8';

/**
 * Parse Bearer token from Authorization header
 */
export function getBearerToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Simple JWT verification (basic implementation)
 * For production, use a library like jsonwebtoken or jose
 */
export async function verifyJWT(token, secret) {
  try {
    // NOTE: This is a simplified verification
    // In production, use proper JWT library (jose.js)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode payload (not verifying signature for now - add proper verification)
    const payload = JSON.parse(atob(parts[1]));

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }

    return { valid: true, payload };
  } catch (error) {
    console.error('[JWT] Verification failed:', error.message);
    return { valid: false, payload: null, error: error.message };
  }
}

/**
 * Verify admin PIN header (for admin operations)
 */
export function verifyAdminPIN(request, correctPIN) {
  const pin = request.headers.get('X-Admin-PIN');
  return pin === correctPIN;
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(request, context) {
  const token = getBearerToken(request);

  if (!token) {
    return ResponseHelper.unauthorized('No authentication token provided');
  }

  const jwtSecret = context.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET not configured in environment');
    return ResponseHelper.internalError('Server configuration error');
  }

  const { valid, payload, error } = await verifyJWT(token, jwtSecret);

  if (!valid) {
    return ResponseHelper.unauthorized(`Authentication failed: ${error}`);
  }

  // Attach user info to request for use in handler
  context.user = payload;
  return null; // No error - proceed
}

/**
 * Middleware to require admin role
 */
export async function requireAdmin(request, context) {
  // First verify authentication
  const authError = await requireAuth(request, context);
  if (authError) {
    return authError;
  }

  // Then check admin role
  const ADMIN_ROLES = ['admin', 'super_admin', 'moderator', 'finance_admin'];
  if (!context.user || !ADMIN_ROLES.includes(context.user.role)) {
    return ResponseHelper.forbidden('Admin access required');
  }

  return null; // No error - proceed
}

export default {
  getBearerToken,
  verifyJWT,
  verifyAdminPIN,
  requireAuth,
  requireAdmin
};
