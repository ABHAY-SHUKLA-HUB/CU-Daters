// src/backend/routes/subscription.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const subscriptionService = require('../services/subscriptionService');
const fraudDetection = require('../services/fraudDetection');
const { authenticate } = require('../middleware/auth');
const s3Service = require('../services/s3Service');

/**
 * Rate limiters
 */
const createRequestLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1, // 1 request per 24 hours
  message: 'You can only create one subscription request per 24 hours'
});

const uploadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3, // 3 uploads per 24 hours
  message: 'Maximum 3 upload attempts per 24 hours'
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30
});

/**
 * Multer configuration for file uploads
 */
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Only allow JPEG and PNG
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      cb(new Error('Only JPEG and PNG files are allowed'));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * POST /api/v1/subscription/create-request
 * Create a new subscription request
 */
router.post('/create-request', 
  authenticate, 
  generalLimiter,
  createRequestLimiter,
  async (req, res) => {
    try {
      const { plan_type } = req.body;
      const user_id = req.user.uid;

      // Validation
      if (!plan_type || !['monthly', 'yearly'].includes(plan_type)) {
        return res.status(400).json({
          error: 'invalid_plan_type',
          message: 'plan_type must be "monthly" or "yearly"'
        });
      }

      // Create request
      const result = await subscriptionService.createSubscriptionRequest(
        user_id,
        plan_type,
        req.user
      );

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error creating subscription request:', error);

      if (error.message.includes('already has')) {
        return res.status(409).json({
          error: 'duplicate_subscription',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to create subscription request'
      });
    }
  }
);

/**
 * GET /api/v1/subscription/status
 * Get current subscription status for user
 */
router.get('/status',
  authenticate,
  generalLimiter,
  async (req, res) => {
    try {
      const user_id = req.user.uid;

      const status = await subscriptionService.getSubscriptionStatus(user_id);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error getting subscription status:', error);

      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to get subscription status'
      });
    }
  }
);

/**
 * POST /api/v1/subscription/upload-proof
 * Upload payment proof (screenshot + payment ID)
 * 
 * Form data:
 *   - screenshot: file (image)
 *   - payment_id: string (12-digit UTR)
 *   - request_id: string
 */
router.post('/upload-proof',
  authenticate,
  uploadLimiter,
  upload.single('screenshot'),
  async (req, res) => {
    try {
      const { request_id, payment_id } = req.body;
      const user_id = req.user.uid;

      // Validation
      if (!request_id) {
        return res.status(400).json({
          error: 'missing_request_id',
          message: 'request_id is required'
        });
      }

      if (!payment_id) {
        return res.status(400).json({
          error: 'missing_payment_id',
          message: 'payment_id is required'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'missing_screenshot',
          message: 'screenshot file is required'
        });
      }

      // Validate payment ID format
      if (!/^\d{12}$/.test(payment_id)) {
        return res.status(400).json({
          error: 'invalid_payment_id_format',
          message: 'Payment ID must be 12 digits'
        });
      }

      // Check for duplicate payment ID
      const isDuplicate = await fraudDetection.isDuplicatePaymentId(payment_id);
      if (isDuplicate) {
        return res.status(409).json({
          error: 'duplicate_payment_id',
          message: 'This payment ID has already been submitted'
        });
      }

      // Upload screenshot to S3
      const s3Key = `payments/${user_id}/${request_id}/${Date.now()}-${req.file.originalname}`;
      const screenshot_url = await s3Service.uploadFile(
        req.file.buffer,
        s3Key,
        req.file.mimetype
      );

      // Prepare screenshot info for fraud detection
      const screenshot_info = {
        width: req.body.width || 720,
        height: req.body.height || 1280,
        size: req.file.size,
        mime_type: req.file.mimetype,
        name: req.file.originalname
      };

      // Process payment proof
      const result = await subscriptionService.uploadPaymentProof(
        request_id,
        user_id,
        payment_id,
        screenshot_url,
        screenshot_info
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Payment proof submitted successfully'
      });
    } catch (error) {
      console.error('Error uploading payment proof:', error);

      // Handle specific errors
      if (error.message.includes('Request not found')) {
        return res.status(404).json({
          error: 'request_not_found',
          message: error.message
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          error: 'unauthorized',
          message: error.message
        });
      }

      if (error.message.includes('not in pending_upload status')) {
        return res.status(409).json({
          error: 'invalid_request_status',
          message: error.message
        });
      }

      if (error.message.includes('Invalid payment ID')) {
        return res.status(400).json({
          error: 'invalid_payment_id',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to upload payment proof'
      });
    }
  }
);

/**
 * GET /api/v1/subscription/details/:request_id
 * Get full details of a subscription request
 */
router.get('/details/:request_id',
  authenticate,
  generalLimiter,
  async (req, res) => {
    try {
      const { request_id } = req.params;
      const user_id = req.user.uid;

      const details = await subscriptionService.getRequestDetails(request_id, user_id);

      res.json({
        success: true,
        data: details
      });
    } catch (error) {
      console.error('Error getting request details:', error);

      if (error.message === 'Request not found') {
        return res.status(404).json({
          error: 'request_not_found',
          message: 'Request not found'
        });
      }

      if (error.message === 'Unauthorized') {
        return res.status(403).json({
          error: 'unauthorized',
          message: 'You do not have access to this request'
        });
      }

      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to get request details'
      });
    }
  }
);

/**
 * POST /api/v1/subscription/retry
 * Retry a rejected subscription request
 */
router.post('/retry',
  authenticate,
  generalLimiter,
  async (req, res) => {
    try {
      const { request_id } = req.body;
      const user_id = req.user.uid;

      if (!request_id) {
        return res.status(400).json({
          error: 'missing_request_id',
          message: 'request_id is required'
        });
      }

      const result = await subscriptionService.retrySubmission(request_id, user_id);

      res.json({
        success: true,
        data: result,
        message: 'Request reset for retry'
      });
    } catch (error) {
      console.error('Error retrying submission:', error);

      if (error.message === 'Request not found') {
        return res.status(404).json({
          error: 'request_not_found',
          message: 'Request not found'
        });
      }

      if (error.message === 'Unauthorized') {
        return res.status(403).json({
          error: 'unauthorized',
          message: 'Unauthorized'
        });
      }

      if (error.message === 'Can only retry rejected requests') {
        return res.status(409).json({
          error: 'invalid_request_state',
          message: error.message
        });
      }

      if (error.message === 'Maximum retry attempts exceeded') {
        return res.status(429).json({
          error: 'max_retries_exceeded',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to retry submission'
      });
    }
  }
);

module.exports = router;
