// src/backend/models/SubscriptionRequest.js
const mongoose = require('mongoose');

const subscriptionRequestSchema = new mongoose.Schema({
  request_id: {
    type: String,
    unique: true,
    required: true,
    default: () => 'REQ_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  plan_type: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending_upload', 'pending_review', 'approved', 'rejected'],
    default: 'pending_upload',
    index: true
  },
  payment_id: {
    type: String,
    unique: true,
    sparse: true, // Allow null values for unique index
    index: true
  },
  screenshot_url: {
    type: String,
    default: null
  },
  payment_timestamp: {
    type: Date,
    default: null
  },
  fraud_score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    index: true
  },
  fraud_level: {
    type: String,
    enum: ['low', 'medium', 'high', 'very_high'],
    default: 'low'
  },
  fraud_flags: {
    type: [String],
    default: [],
    enum: [
      'first_time_user',
      'amount_mismatch',
      'duplicate_payment_id',
      'unusual_payment_time',
      'old_timestamp',
      'high_velocity',
      'device_change',
      'low_screenshot_quality',
      'suspicious_device',
      'multiple_failures'
    ]
  },
  fraud_details: {
    device_info: { type: String, default: null },
    ip_address: { type: String, default: null },
    location: { type: String, default: null },
    user_agent: { type: String, default: null },
    previous_attempts: { type: Number, default: 0 }
  },
  approved_at: {
    type: Date,
    default: null
  },
  approved_by: {
    type: String, // Admin user ID
    default: null
  },
  rejected_at: {
    type: Date,
    default: null
  },
  rejected_by: {
    type: String, // Admin user ID
    default: null
  },
  rejection_reason: {
    type: String,
    enum: [
      'payment_amount_mismatch',
      'duplicate_payment_id',
      'invalid_screenshot',
      'suspicious_activity',
      'payment_id_invalid',
      'user_account_suspicious',
      'screenshot_unclear',
      'other'
    ],
    default: null
  },
  admin_note: {
    type: String,
    default: null
  },
  user_note: {
    type: String,
    default: null
  },
  retry_count: {
    type: Number,
    default: 0,
    max: 5
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  email_notified: {
    type: Boolean,
    default: false
  },
  push_notified: {
    type: Boolean,
    default: false
  }
}, { collection: 'subscription_requests', timestamps: false });

// Compound indexes
subscriptionRequestSchema.index({ user_id: 1, created_at: -1 });
subscriptionRequestSchema.index({ status: 1, created_at: -1 });
subscriptionRequestSchema.index({ fraud_score: -1, status: 1 });

// Pre-save middleware
subscriptionRequestSchema.pre('save', function(next) {
  this.updated_at = new Date();
  
  // Calculate fraud level based on score
  if (this.fraud_score < 30) {
    this.fraud_level = 'low';
  } else if (this.fraud_score < 60) {
    this.fraud_level = 'medium';
  } else if (this.fraud_score < 85) {
    this.fraud_level = 'high';
  } else {
    this.fraud_level = 'very_high';
  }
  
  next();
});

// Instance method to calculate fraud score
subscriptionRequestSchema.methods.calculateFraudScore = function(userHistory) {
  let score = 0;
  this.fraud_flags = [];
  
  // First-time user
  if (!userHistory || userHistory.total_requests === 0) {
    score += 10;
    this.fraud_flags.push('first_time_user');
  }
  
  // High velocity (multiple submissions in 1 hour)
  if (userHistory && userHistory.recent_attempts > 2) {
    score += 25;
    this.fraud_flags.push('high_velocity');
  }
  
  // Device change
  if (userHistory && userHistory.device_change) {
    score += 15;
    this.fraud_flags.push('device_change');
  }
  
  // Multiple previous failures
  if (userHistory && userHistory.failed_attempts > 2) {
    score += 20;
    this.fraud_flags.push('multiple_failures');
  }
  
  this.fraud_score = Math.min(score, 100);
  return this.fraud_score;
};

// Instance method to approve request
subscriptionRequestSchema.methods.approve = function(adminId, note = null) {
  this.status = 'approved';
  this.approved_at = new Date();
  this.approved_by = adminId;
  if (note) this.admin_note = note;
  return this.save();
};

// Instance method to reject request
subscriptionRequestSchema.methods.reject = function(adminId, reason, note = null) {
  this.status = 'rejected';
  this.rejected_at = new Date();
  this.rejected_by = adminId;
  this.rejection_reason = reason;
  if (note) this.admin_note = note;
  return this.save();
};

// Static method to get pending requests for user
subscriptionRequestSchema.statics.getPendingForUser = function(user_id) {
  return this.findOne({
    user_id: user_id,
    status: { $in: ['pending_upload', 'pending_review'] }
  }).sort({ created_at: -1 });
};

// Static method to get requests by status for admin
subscriptionRequestSchema.statics.getByStatus = function(status, limit = 50, skip = 0) {
  return this.find({ status })
    .sort({ fraud_score: -1, created_at: -1 })
    .limit(limit)
    .skip(skip);
};

// Export model
module.exports = mongoose.model('SubscriptionRequest', subscriptionRequestSchema);
