// src/backend/routes/admin/subscription.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const subscriptionService = require('../../services/subscriptionService');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const SubscriptionRequest = require('../../models/SubscriptionRequest');
const PaymentsAudit = require('../../models/PaymentsAudit');

/**
 * Admin rate limiter (more generous)
 */
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
});

/**
 * GET /admin/subscription/requests
 * Get all subscription requests (filtered and paginated)
 * Query params:
 *   - status: pending_review, approved, rejected, all
 *   - limit: default 50
 *   - skip: default 0
 *   - sort: created_at, fraud_score, amount
 *   - order: asc, desc
 */
router.get('/requests',
  authenticate,
  requireAdmin,
  adminLimiter,
  async (req, res) => {
    try {
      const { status = 'pending_review', limit = 50, skip = 0, sort = 'created_at', order = 'desc' } = req.query;

      // Validation
      const limit_num = Math.min(parseInt(limit) || 50, 100); // Max 100
      const skip_num = Math.max(parseInt(skip) || 0, 0);

      // Build query
      let query = {};
      if (status !== 'all') {
        query.status = status;
      }

      // Build sort
      const sortObj = {};
      sortObj[sort] = order === 'asc' ? 1 : -1;

      // Get requests
      const requests = await SubscriptionRequest.find(query)
        .sort(sortObj)
        .limit(limit_num)
        .skip(skip_num);

      // Get total count
      const total = await SubscriptionRequest.countDocuments(query);

      // Format response
      const formattedRequests = requests.map(req => ({
        request_id: req.request_id,
        user_id: req.user_id,
        user_name: req.user_name,
        user_email: req.user_email,
        plan_type: req.plan_type,
        amount: req.amount,
        status: req.status,
        payment_id: req.payment_id,
        fraud_score: req.fraud_score,
        fraud_level: req.fraud_level,
        fraud_flags: req.fraud_flags,
        submitted_at: req.created_at,
        approved_at: req.approved_at,
        rejected_at: req.rejected_at
      }));

      res.json({
        success: true,
        data: {
          requests: formattedRequests,
          total,
          limit: limit_num,
          skip: skip_num,
          hasMore: skip_num + limit_num < total
        }
      });
    } catch (error) {
      console.error('Error getting admin requests:', error);

      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to retrieve requests'
      });
    }
  }
);

/**
 * GET /admin/subscription/requests/:request_id
 * Get full details of a subscription request (admin view)
 */
router.get('/requests/:request_id',
  authenticate,
  requireAdmin,
  adminLimiter,
  async (req, res) => {
    try {
      const { request_id } = req.params;

      const request = await SubscriptionRequest.findOne({ request_id });

      if (!request) {
        return res.status(404).json({
          error: 'request_not_found',
          message: 'Request not found'
        });
      }

      // Get user details
      const userDetails = {
        user_id: request.user_id,
        user_name: request.user_name,
        user_email: request.user_email,
        user_phone: request.user_phone,
        user_avatar: request.user_avatar,
        join_date: request.user_info?.join_date,
        previous_subscriptions: request.user_info?.previous_subscriptions || 0
      };

      // Get S3 signed URL if screenshot exists
      let screenshot_signed_url = null;
      if (request.screenshot_url) {
        // Would generate signed URL from S3Service
        screenshot_signed_url = request.screenshot_url;
      }

      // Get audit trail
      const auditTrail = await PaymentsAudit.getTrailForRequest(request_id);

      res.json({
        success: true,
        data: {
          request_id: request.request_id,
          user_info: userDetails,
          payment_info: {
            plan_type: request.plan_type,
            amount: request.amount,
            currency: request.currency,
            payment_id: request.payment_id,
            payment_timestamp: request.payment_timestamp
          },
          fraud_info: {
            fraud_score: request.fraud_score,
            fraud_level: request.fraud_level,
            fraud_flags: request.fraud_flags,
            fraud_details: request.fraud_details
          },
          status: request.status,
          screenshot_url: screenshot_signed_url,
          submitted_at: request.created_at,
          approved_at: request.approved_at,
          approved_by: request.approved_by,
          rejected_at: request.rejected_at,
          rejected_by: request.rejected_by,
          rejection_reason: request.rejection_reason,
          admin_note: request.admin_note,
          retry_count: request.retry_count,
          audit_trail: auditTrail
        }
      });
    } catch (error) {
      console.error('Error getting request details:', error);

      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to retrieve request details'
      });
    }
  }
);

/**
 * POST /admin/subscription/approve
 * Approve a subscription request
 * 
 * Body:
 *   - request_id: string
 *   - admin_note: string (optional)
 */
router.post('/approve',
  authenticate,
  requireAdmin,
  adminLimiter,
  async (req, res) => {
    try {
      const { request_id, admin_note } = req.body;
      const admin_id = req.user.uid;

      // Validation
      if (!request_id) {
        return res.status(400).json({
          error: 'missing_request_id',
          message: 'request_id is required'
        });
      }

      // Approve subscription
      const result = await subscriptionService.approveSubscription(
        request_id,
        admin_id,
        admin_note
      );

      res.json({
        success: true,
        data: result,
        message: 'Subscription approved successfully'
      });
    } catch (error) {
      console.error('Error approving subscription:', error);

      if (error.message === 'Request not found') {
        return res.status(404).json({
          error: 'request_not_found',
          message: 'Request not found'
        });
      }

      if (error.message.includes('not in pending_review status')) {
        return res.status(409).json({
          error: 'invalid_request_status',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to approve subscription'
      });
    }
  }
);

/**
 * POST /admin/subscription/reject
 * Reject a subscription request
 * 
 * Body:
 *   - request_id: string
 *   - rejection_reason: string (required)
 *   - admin_note: string (optional)
 */
router.post('/reject',
  authenticate,
  requireAdmin,
  adminLimiter,
  async (req, res) => {
    try {
      const { request_id, rejection_reason, admin_note } = req.body;
      const admin_id = req.user.uid;

      // Validation
      if (!request_id) {
        return res.status(400).json({
          error: 'missing_request_id',
          message: 'request_id is required'
        });
      }

      if (!rejection_reason) {
        return res.status(400).json({
          error: 'missing_rejection_reason',
          message: 'rejection_reason is required'
        });
      }

      const validReasons = [
        'payment_amount_mismatch',
        'duplicate_payment_id',
        'invalid_screenshot',
        'suspicious_activity',
        'payment_id_invalid',
        'user_account_suspicious',
        'screenshot_unclear',
        'other'
      ];

      if (!validReasons.includes(rejection_reason)) {
        return res.status(400).json({
          error: 'invalid_rejection_reason',
          message: 'Invalid rejection reason'
        });
      }

      // Reject subscription
      const result = await subscriptionService.rejectSubscription(
        request_id,
        admin_id,
        rejection_reason,
        admin_note
      );

      res.json({
        success: true,
        data: result,
        message: 'Subscription rejected successfully'
      });
    } catch (error) {
      console.error('Error rejecting subscription:', error);

      if (error.message === 'Request not found') {
        return res.status(404).json({
          error: 'request_not_found',
          message: 'Request not found'
        });
      }

      if (error.message.includes('not in pending_review status')) {
        return res.status(409).json({
          error: 'invalid_request_status',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to reject subscription'
      });
    }
  }
);

/**
 * GET /admin/subscription/stats
 * Get subscription statistics
 */
router.get('/stats',
  authenticate,
  requireAdmin,
  adminLimiter,
  async (req, res) => {
    try {
      const pending = await SubscriptionRequest.countDocuments({ status: 'pending_review' });
      const approved = await SubscriptionRequest.countDocuments({ status: 'approved' });
      const rejected = await SubscriptionRequest.countDocuments({ status: 'rejected' });
      const total = pending + approved + rejected;

      // Get total revenue
      const approvedRequests = await SubscriptionRequest.find({ status: 'approved' });
      const total_revenue = approvedRequests.reduce((sum, req) => sum + req.amount, 0);

      res.json({
        success: true,
        data: {
          pending_review: pending,
          approved,
          rejected,
          total,
          total_revenue: parseFloat(total_revenue.toFixed(2)),
          avg_approval_time: '2 hours' // Would calculate from audit logs
        }
      });
    } catch (error) {
      console.error('Error getting stats:', error);

      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to retrieve statistics'
      });
    }
  }
);

/**
 * GET /admin/subscription/audit-logs
 * Get audit logs for requests
 */
router.get('/audit-logs',
  authenticate,
  requireAdmin,
  adminLimiter,
  async (req, res) => {
    try {
      const { request_id, user_id, admin_id, limit = 50, skip = 0 } = req.query;

      let query = {};
      if (request_id) query.request_id = request_id;
      if (user_id) query.user_id = user_id;
      if (admin_id) query.admin_id = admin_id;

      const logs = await PaymentsAudit.find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit) || 50)
        .skip(parseInt(skip) || 0);

      const total = await PaymentsAudit.countDocuments(query);

      res.json({
        success: true,
        data: {
          logs,
          total,
          limit: parseInt(limit) || 50,
          skip: parseInt(skip) || 0
        }
      });
    } catch (error) {
      console.error('Error getting audit logs:', error);

      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to retrieve audit logs'
      });
    }
  }
);

module.exports = router;
