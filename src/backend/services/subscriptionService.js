// src/backend/services/subscriptionService.js
const Subscription = require('../models/Subscription');
const SubscriptionRequest = require('../models/SubscriptionRequest');
const PaymentsAudit = require('../models/PaymentsAudit');
const fraudDetection = require('./fraudDetection');
const notificationService = require('./notificationService');

class SubscriptionService {
  /**
   * Create new subscription request
   */
  async createSubscriptionRequest(user_id, plan_type, user_info) {
    try {
      // Check if user already has pending/active subscription
      const existingPending = await SubscriptionRequest.getPendingForUser(user_id);
      if (existingPending) {
        throw new Error('User already has a pending subscription request');
      }

      const existingActive = await Subscription.getActiveForUser(user_id);
      if (existingActive) {
        throw new Error('User already has an active subscription');
      }

      // Get plan details
      const planDetails = this.getPlanDetails(plan_type);
      if (!planDetails) {
        throw new Error('Invalid plan type');
      }

      // Create request
      const request = new SubscriptionRequest({
        user_id,
        plan_type,
        amount: planDetails.amount,
        currency: 'INR'
      });

      await request.save();

      // Create audit log
      await PaymentsAudit.createLog({
        request_id: request.request_id,
        user_id,
        admin_id: 'SYSTEM',
        action: 'created_request',
        status_after: 'pending_upload',
        changes: { plan_type, amount: planDetails.amount }
      });

      return {
        request_id: request.request_id,
        plan_type,
        amount: planDetails.amount,
        upi_id: planDetails.upi_id, // Will need to fetch from config
        status: 'pending_upload'
      };
    } catch (error) {
      console.error('Error creating subscription request:', error);
      throw error;
    }
  }

  /**
   * Get subscription plan details
   */
  getPlanDetails(plan_type) {
    const plans = {
      monthly: {
        name: 'Monthly Premium',
        amount: 4.99,
        duration_days: 30,
        upi_id: process.env.UPI_ID || 'campusconnect@upi'
      },
      yearly: {
        name: 'Yearly Premium',
        amount: 39.99,
        duration_days: 365,
        upi_id: process.env.UPI_ID || 'campusconnect@upi'
      }
    };

    return plans[plan_type] || null;
  }

  /**
   * Handle payment proof upload and fraud detection
   */
  async uploadPaymentProof(request_id, user_id, payment_id, screenshot_url, screenshot_info) {
    try {
      // Get request
      const request = await SubscriptionRequest.findOne({ request_id });
      if (!request) {
        throw new Error('Request not found');
      }

      if (request.user_id !== user_id) {
        throw new Error('Unauthorized: Request does not belong to user');
      }

      if (request.status !== 'pending_upload') {
        throw new Error('Request is not in pending_upload status');
      }

      // Validate payment ID format
      if (!fraudDetection.isValidUTR(payment_id)) {
        throw new Error('Invalid payment ID format. Must be 12 digits');
      }

      // Get plan details for expected amount
      const planDetails = this.getPlanDetails(request.plan_type);

      // Get user history
      const userHistory = await fraudDetection.getUserHistory(user_id);

      // Run fraud detection
      const fraudAssessment = await fraudDetection.calculateFraudScore({
        user_id,
        payment_id,
        amount: request.amount,
        expected_amount: planDetails.amount,
        payment_timestamp: new Date(),
        screenshot_info,
        user_history,
        device_info: {
          device_id: 'temp_device_id', // Will come from frontend
          location: { country: 'IN' } // Will come from frontend
        }
      });

      // Update request with payment info
      request.payment_id = payment_id;
      request.screenshot_url = screenshot_url;
      request.payment_timestamp = new Date();
      request.fraud_score = fraudAssessment.fraud_score;
      request.fraud_level = fraudAssessment.fraud_level;
      request.fraud_flags = fraudAssessment.fraud_flags;
      request.status = 'pending_review';

      await request.save();

      // Create audit log
      await PaymentsAudit.createLog({
        request_id,
        user_id,
        admin_id: 'SYSTEM',
        action: 'uploaded_proof',
        status_before: 'pending_upload',
        status_after: 'pending_review',
        fraud_score: fraudAssessment.fraud_score,
        changes: {
          payment_id,
          fraud_score: fraudAssessment.fraud_score,
          fraud_flags: fraudAssessment.fraud_flags
        }
      });

      // Send notification to user
      await notificationService.notifyPaymentSubmitted(user_id, request_id);

      // Send notification to admin if high fraud score
      if (fraudAssessment.fraud_score > 60) {
        await notificationService.notifyAdminHighFraudScore(request_id, fraudAssessment.fraud_score);
      }

      return {
        request_id,
        status: 'pending_review',
        fraud_score: fraudAssessment.fraud_score,
        fraud_level: fraudAssessment.fraud_level,
        message: 'Payment proof submitted. Admin will review within 24 hours.'
      };
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      throw error;
    }
  }

  /**
   * Get subscription status for user
   */
  async getSubscriptionStatus(user_id) {
    try {
      // Check for active subscription
      const activeSubscription = await Subscription.getActiveForUser(user_id);
      
      if (activeSubscription) {
        return {
          has_subscription: true,
          status: 'active',
          plan_type: activeSubscription.plan_type,
          expiry_date: activeSubscription.expiry_date,
          days_remaining: Math.ceil((activeSubscription.expiry_date - new Date()) / (1000 * 60 * 60 * 24)),
          features: activeSubscription.features
        };
      }

      // Check for pending request
      const pending = await SubscriptionRequest.getPendingForUser(user_id);
      
      if (pending) {
        const returnData = {
          has_subscription: false,
          status: pending.status,
          plan_type: pending.plan_type,
          request_id: pending.request_id,
          submitted_at: pending.created_at
        };

        if (pending.status === 'rejected') {
          returnData.rejection_reason = pending.rejection_reason;
          returnData.admin_note = pending.admin_note;
        }

        return returnData;
      }

      // No subscription or request
      return {
        has_subscription: false,
        status: 'none'
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw error;
    }
  }

  /**
   * Approve subscription (admin)
   */
  async approveSubscription(request_id, admin_id, admin_note = null) {
    try {
      // Get request
      const request = await SubscriptionRequest.findOne({ request_id });
      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status !== 'pending_review') {
        throw new Error('Request is not in pending_review status');
      }

      // Approve request
      await request.approve(admin_id, admin_note);

      // Create subscription
      const planDetails = this.getPlanDetails(request.plan_type);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + planDetails.duration_days);

      const subscription = new Subscription({
        user_id: request.user_id,
        request_id,
        plan_type: request.plan_type,
        amount: request.amount,
        expiry_date: expiryDate
      });

      await subscription.save();

      // Create audit log
      await PaymentsAudit.createLog({
        request_id,
        user_id: request.user_id,
        admin_id,
        action: 'approved',
        status_before: 'pending_review',
        status_after: 'approved',
        notes: admin_note
      });

      // Send notification to user
      await notificationService.notifyPaymentApproved(request.user_id, request_id, expiryDate);

      return {
        request_id,
        subscription_id: subscription.subscription_id,
        status: 'approved',
        expiry_date: expiryDate,
        message: 'Subscription approved and activated'
      };
    } catch (error) {
      console.error('Error approving subscription:', error);
      throw error;
    }
  }

  /**
   * Reject subscription (admin)
   */
  async rejectSubscription(request_id, admin_id, rejection_reason, admin_note = null) {
    try {
      // Get request
      const request = await SubscriptionRequest.findOne({ request_id });
      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status !== 'pending_review') {
        throw new Error('Request is not in pending_review status');
      }

      // Reject request
      await request.reject(admin_id, rejection_reason, admin_note);

      // Create audit log
      await PaymentsAudit.createLog({
        request_id,
        user_id: request.user_id,
        admin_id,
        action: 'rejected',
        status_before: 'pending_review',
        status_after: 'rejected',
        reason: rejection_reason,
        notes: admin_note
      });

      // Send notification to user
      await notificationService.notifyPaymentRejected(
        request.user_id,
        request_id,
        rejection_reason,
        admin_note
      );

      return {
        request_id,
        status: 'rejected',
        rejection_reason,
        message: 'Subscription request rejected. User can retry.'
      };
    } catch (error) {
      console.error('Error rejecting subscription:', error);
      throw error;
    }
  }

  /**
   * Get request details (user can view their request)
   */
  async getRequestDetails(request_id, user_id) {
    try {
      const request = await SubscriptionRequest.findOne({ request_id });
      
      if (!request) {
        throw new Error('Request not found');
      }

      if (request.user_id !== user_id) {
        throw new Error('Unauthorized'); 
      }

      return this.formatRequestForUser(request);
    } catch (error) {
      console.error('Error getting request details:', error);
      throw error;
    }
  }

  /**
   * Format request data for user view
   */
  formatRequestForUser(request) {
    return {
      request_id: request.request_id,
      plan_type: request.plan_type,
      amount: request.amount,
      status: request.status,
      submitted_at: request.created_at,
      payment_id: request.status !== 'pending_upload' ? request.payment_id : null,
      fraud_score: request.status !== 'pending_upload' ? request.fraud_score : null,
      approved_at: request.approved_at,
      rejected_at: request.rejected_at,
      rejection_reason: request.rejection_reason,
      admin_note: request.admin_note
    };
  }

  /**
   * Retry failed submission
   */
  async retrySubmission(request_id, user_id) {
    try {
      const request = await SubscriptionRequest.findOne({ request_id });
      
      if (!request) {
        throw new Error('Request not found');
      }

      if (request.user_id !== user_id) {
        throw new Error('Unauthorized');
      }

      if (request.status !== 'rejected') {
        throw new Error('Can only retry rejected requests');
      }

      if (request.retry_count >= 5) {
        throw new Error('Maximum retry attempts exceeded');
      }

      // Reset request to pending_upload
      request.status = 'pending_upload';
      request.payment_id = null;
      request.screenshot_url = null;
      request.fraud_score = 0;
      request.fraud_flags = [];
      request.retry_count += 1;
      request.rejected_at = null;
      request.rejection_reason = null;

      await request.save();

      // Create audit log
      await PaymentsAudit.createLog({
        request_id,
        user_id,
        admin_id: 'SYSTEM',
        action: 'retry_allowed',
        status_before: 'rejected',
        status_after: 'pending_upload',
        changes: { retry_count: request.retry_count }
      });

      return {
        request_id,
        status: 'pending_upload',
        retry_count: request.retry_count,
        message: 'Request reset for retry'
      };
    } catch (error) {
      console.error('Error retrying submission:', error);
      throw error;
    }
  }
}

module.exports = new SubscriptionService();
