// src/backend/controllers/subscriptionController.js
/**
 * Subscription Controller
 * Business logic for subscription management
 */

const SubscriptionModel = require('../models/SubscriptionModel');
const UserModel = require('../models/User');
const fs = require('fs');
const sendEmail = require('../utils/emailService');

// ============================================================================
// USER CONTROLLERS
// ============================================================================

/**
 * Create subscription request
 * POST /api/subscription/request
 */
exports.createRequest = async (req, res) => {
  try {
    const { planId, planName, amount, paymentId, senderName } = req.body;
    const userId = req.user.id;
    const file = req.file;

    // Validation
    if (!planId || !planName || !amount || !paymentId || !senderName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!file) {
      return res.status(400).json({ message: 'Screenshot file is required' });
    }

    // Check if user already has pending request
    const existingPending = await SubscriptionModel.findOne({
      userId,
      status: 'pending'
    });

    if (existingPending) {
      // Delete uploaded file
      fs.unlinkSync(file.path);
      return res.status(400).json({
        message: 'You already have a pending subscription request. Please wait for admin review.'
      });
    }

    // Get user email
    const user = await UserModel.findById(userId);
    if (!user) {
      fs.unlinkSync(file.path);
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate payment ID format (UTR: 12 alphanumeric)
    const utrRegex = /^[A-Z0-9]{12}$/;
    if (!utrRegex.test(paymentId.toUpperCase())) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        message: 'Invalid payment ID format. Must be 12 alphanumeric characters.'
      });
    }

    // Create subscription request
    const subscription = new SubscriptionModel({
      userId,
      userEmail: user.email,
      planId,
      planName,
      amount: parseFloat(amount),
      paymentId: paymentId.toUpperCase(),
      senderName,
      screenshotUrl: `/uploads/screenshots/${file.filename}`,
      screenshotFileName: file.filename,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await subscription.save();

    // Send confirmation email to user
    try {
      await sendEmail({
        to: user.email,
        subject: `Payment Request Received - ${planName}`,
        template: 'paymentConfirmation',
        data: {
          userName: user.userName,
          planName,
          amount,
          requestId: subscription._id,
          requestDate: new Date().toLocaleDateString()
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: 'Payment request submitted successfully',
      requestId: subscription._id,
      status: 'pending'
    });

  } catch (error) {
    console.error('Error creating subscription request:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        // Ignore cleanup failures during error handling.
      }
    }

    res.status(500).json({
      message: 'Failed to submit payment request',
      error: error.message
    });
  }
};

/**
 * Get user's subscription status
 * GET /api/subscription/status
 */
exports.getUserStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await SubscriptionModel.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();

    if (!subscription) {
      return res.status(200).json({
        status: 'inactive',
        message: 'No active subscription'
      });
    }

    // Check if subscription is still valid
    if (subscription.status === 'approved') {
      const now = new Date();
      const hasExpired = subscription.expiryDate && subscription.expiryDate < now;

      return res.status(200).json({
        status: hasExpired ? 'expired' : 'active',
        planName: subscription.planName,
        startDate: subscription.startDate,
        expiryDate: subscription.expiryDate,
        daysRemaining: subscription.expiryDate 
          ? Math.ceil((subscription.expiryDate - now) / (1000 * 60 * 60 * 24))
          : 0
      });
    }

    res.status(200).json({
      status: subscription.status,
      planName: subscription.planName,
      requestId: subscription._id,
      submittedAt: subscription.createdAt,
      reviewedAt: subscription.reviewedAt,
      rejectionReason: subscription.rejectionReason
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: 'Failed to fetch subscription status' });
  }
};

/**
 * Get specific subscription request
 * GET /api/subscription/request/:id
 */
exports.getRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const subscription = await SubscriptionModel.findById(id);

    if (!subscription) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check ownership
    if (subscription.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.status(200).json(subscription);

  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ message: 'Failed to fetch request' });
  }
};

/**
 * Get all user's requests
 * GET /api/subscription/requests
 */
exports.getUserRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const requests = await SubscriptionModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await SubscriptionModel.countDocuments({ userId });

    res.status(200).json({
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
};

// ============================================================================
// ADMIN CONTROLLERS
// ============================================================================

/**
 * Get all pending subscription requests
 * GET /api/admin/subscriptions
 */
exports.getAllPendingRequests = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = status === 'all' ? {} : { status };

    const subscriptions = await SubscriptionModel.find(query)
      .populate('userId', 'email userName')
      .populate('reviewedBy', 'email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await SubscriptionModel.countDocuments(query);

    res.status(200).json({
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
};

/**
 * Get specific request for admin review
 * GET /api/admin/subscriptions/:id
 */
exports.getRequestForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await SubscriptionModel.findById(id)
      .populate('userId', 'email userName fullName phone')
      .populate('reviewedBy', 'email');

    if (!subscription) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.status(200).json(subscription);

  } catch (error) {
    console.error('Error fetching admin request:', error);
    res.status(500).json({ message: 'Failed to fetch request' });
  }
};

/**
 * Approve subscription request
 * POST /api/admin/approve
 */
exports.approveRequest = async (req, res) => {
  try {
    const { requestId, notes } = req.body;
    const adminId = req.user.id;

    if (!requestId) {
      return res.status(400).json({ message: 'Request ID is required' });
    }

    const subscription = await SubscriptionModel.findById(requestId);

    if (!subscription) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (subscription.status !== 'pending') {
      return res.status(400).json({
        message: `Cannot approve. Request status is ${subscription.status}`
      });
    }

    // Approve subscription
    await subscription.approve(adminId);
    subscription.adminNotes = notes || '';
    await subscription.save();

    // Send approval email to user
    try {
      const user = await UserModel.findById(subscription.userId);
      await sendEmail({
        to: user.email,
        subject: `Subscription Approved - ${subscription.planName}`,
        template: 'subscriptionApproved',
        data: {
          userName: user.userName,
          planName: subscription.planName,
          expiryDate: subscription.expiryDate.toLocaleDateString(),
          amount: subscription.amount
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(200).json({
      message: 'Subscription approved successfully',
      subscription
    });

  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ message: 'Failed to approve request' });
  }
};

/**
 * Reject subscription request
 * POST /api/admin/reject
 */
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId, reason } = req.body;
    const adminId = req.user.id;

    if (!requestId || !reason) {
      return res.status(400).json({
        message: 'Request ID and rejection reason are required'
      });
    }

    const subscription = await SubscriptionModel.findById(requestId);

    if (!subscription) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (subscription.status !== 'pending') {
      return res.status(400).json({
        message: `Cannot reject. Request status is ${subscription.status}`
      });
    }

    // Reject subscription
    await subscription.reject(adminId, reason);

    // Send rejection email to user
    try {
      const user = await UserModel.findById(subscription.userId);
      await sendEmail({
        to: user.email,
        subject: `Subscription Request Rejected`,
        template: 'subscriptionRejected',
        data: {
          userName: user.userName,
          planName: subscription.planName,
          reason,
          supportEmail: 'support@seeudaters.in'
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(200).json({
      message: 'Subscription rejected successfully',
      subscription
    });

  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Failed to reject request' });
  }
};

/**
 * Get subscription statistics
 * GET /api/admin/stats
 */
exports.getStats = async (req, res) => {
  try {
    const total = await SubscriptionModel.countDocuments();
    const pending = await SubscriptionModel.countDocuments({ status: 'pending' });
    const approved = await SubscriptionModel.countDocuments({ status: 'approved' });
    const rejected = await SubscriptionModel.countDocuments({ status: 'rejected' });

    // Get total revenue
    const revenueData = await SubscriptionModel.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalRevenue = revenueData[0]?.total || 0;

    res.status(200).json({
      stats: {
        total,
        pending,
        approved,
        rejected,
        approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) : 0,
        totalRevenue
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
};

/**
 * Get detailed analytics
 * GET /api/admin/analytics
 */
exports.getAnalytics = async (req, res) => {
  try {
    // Plan-wise breakdown
    const planStats = await SubscriptionModel.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$planId',
          count: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Daily submissions
    const dailyStats = await SubscriptionModel.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          submissions: { $sum: 1 },
          approvals: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);

    res.status(200).json({
      analytics: {
        planStats,
        dailyStats
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};

module.exports = exports;
