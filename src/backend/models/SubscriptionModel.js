// src/backend/models/Subscription.js
/**
 * Subscription Request Model
 * Stores subscription/payment requests
 */

const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    // User Information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userEmail: {
      type: String,
      required: true
    },

    // Plan Information
    planId: {
      type: String,
      required: true,
      enum: ['basic', 'pro', 'premium'],
      default: 'basic'
    },
    planName: {
      type: String,
      required: true
    },

    // Payment Information
    amount: {
      type: Number,
      required: true
    },
    paymentId: {
      type: String,
      required: true,
      index: true // For quick lookup
    },
    senderName: {
      type: String,
      required: true
    },

    // Screenshot/Proof
    screenshotUrl: {
      type: String,
      required: true
    },
    screenshotFileName: {
      type: String
    },

    // Status Tracking
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },

    // Admin Review
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    adminNotes: {
      type: String,
      default: null
    },

    // Subscription Dates
    startDate: {
      type: Date,
      default: null
    },
    expiryDate: {
      type: Date,
      default: null
    },

    // Activity Log
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },

    // Security
    ipAddress: String,
    userAgent: String,
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Indexes for performance
subscriptionSchema.index({ userId: 1, createdAt: -1 });
subscriptionSchema.index({ status: 1, createdAt: -1 });
subscriptionSchema.index({ paymentId: 1 });

// Method to approve subscription
subscriptionSchema.methods.approve = async function(adminId) {
  this.status = 'approved';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  
  // Set subscription dates
  this.startDate = new Date();
  this.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  return this.save();
};

// Method to reject subscription
subscriptionSchema.methods.reject = async function(adminId, reason) {
  this.status = 'rejected';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  
  return this.save();
};

// Static method to get pending requests
subscriptionSchema.statics.getPending = function(limit = 10, skip = 0) {
  return this.find({ status: 'pending' })
    .populate('userId', 'email userName')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

// Static method to get user subscription status
subscriptionSchema.statics.getUserStatus = async function(userId) {
  const latest = await this.findOne({ userId })
    .sort({ createdAt: -1 })
    .lean();
  
  return latest || null;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
