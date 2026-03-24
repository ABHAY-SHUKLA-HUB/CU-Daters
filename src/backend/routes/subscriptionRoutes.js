// src/backend/routes/subscriptionRoutes.js
/**
 * Subscription Routes
 * User and Admin endpoints for subscription management
 */

const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const SubscriptionController = require('../controllers/subscriptionController');

// ============================================================================
// USER ROUTES
// ============================================================================

/**
 * POST /api/subscription/request
 * Submit a new subscription/payment request
 * Requires: auth
 * Body: planId, planName, amount, paymentId, senderName
 * File: screenshot
 */
router.post(
  '/request',
  auth,
  upload.single('screenshot'),
  SubscriptionController.createRequest
);

/**
 * GET /api/subscription/status
 * Get current user's subscription status
 * Requires: auth
 */
router.get(
  '/status',
  auth,
  SubscriptionController.getUserStatus
);

/**
 * GET /api/subscription/request/:id
 * Get specific subscription request details
 * Requires: auth
 */
router.get(
  '/request/:id',
  auth,
  SubscriptionController.getRequest
);

/**
 * GET /api/subscription/requests
 * Get all requests for current user
 * Requires: auth
 */
router.get(
  '/requests',
  auth,
  SubscriptionController.getUserRequests
);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * GET /api/admin/subscriptions
 * Get all pending subscription requests
 * Requires: adminAuth
 * Query: status, page, limit
 */
router.get(
  '/admin/subscriptions',
  adminAuth,
  SubscriptionController.getAllPendingRequests
);

/**
 * GET /api/admin/subscriptions/:id
 * Get specific subscription request for admin review
 * Requires: adminAuth
 */
router.get(
  '/admin/subscriptions/:id',
  adminAuth,
  SubscriptionController.getRequestForAdmin
);

/**
 * POST /api/admin/approve
 * Approve a subscription request
 * Requires: adminAuth
 * Body: requestId, notes
 */
router.post(
  '/admin/approve',
  adminAuth,
  SubscriptionController.approveRequest
);

/**
 * POST /api/admin/reject
 * Reject a subscription request
 * Requires: adminAuth
 * Body: requestId, reason
 */
router.post(
  '/admin/reject',
  adminAuth,
  SubscriptionController.rejectRequest
);

/**
 * GET /api/admin/stats
 * Get subscription statistics
 * Requires: adminAuth
 */
router.get(
  '/admin/stats',
  adminAuth,
  SubscriptionController.getStats
);

/**
 * GET /api/admin/analytics
 * Get detailed analytics
 * Requires: adminAuth
 */
router.get(
  '/admin/analytics',
  adminAuth,
  SubscriptionController.getAnalytics
);

module.exports = router;
