// src/backend/models/Subscription.js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  subscription_id: {
    type: String,
    unique: true,
    required: true,
    default: () => 'SUB_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  request_id: {
    type: String,
    required: true,
    ref: 'SubscriptionRequest'
  },
  plan_type: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'suspended'],
    default: 'active',
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  start_date: {
    type: Date,
    default: Date.now
  },
  expiry_date: {
    type: Date,
    required: true,
    index: true
  },
  auto_renew: {
    type: Boolean,
    default: true
  },
  renewal_attempts: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  cancelled_at: {
    type: Date,
    default: null
  },
  cancelled_reason: {
    type: String,
    default: null
  },
  features: {
    unlimited_chats: { type: Boolean, default: true },
    no_ads: { type: Boolean, default: true },
    verified_badge: { type: Boolean, default: true },
    priority_matching: { type: Boolean, default: true },
    advanced_filters: { type: Boolean, default: false }
  },
  notes: {
    type: String,
    default: null
  }
}, { collection: 'subscriptions', timestamps: false });

// Index for common queries
subscriptionSchema.index({ user_id: 1, status: 1 });
subscriptionSchema.index({ user_id: 1, expiry_date: 1 });
subscriptionSchema.index({ status: 1, expiry_date: 1 });
subscriptionSchema.index({ expiry_date: 1 }, { expireAfterSeconds: 2592000 }); // TTL index

// Middleware to update updated_at
subscriptionSchema.pre('save', async function() {
  this.updated_at = new Date();
});

// Instance method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && new Date() < this.expiry_date;
};

// Instance method to cancel subscription
subscriptionSchema.methods.cancel = function(reason = null) {
  this.status = 'cancelled';
  this.cancelled_at = new Date();
  this.cancelled_reason = reason;
  return this.save();
};

// Static method to get active subscription for user
subscriptionSchema.statics.getActiveForUser = function(user_id) {
  return this.findOne({
    user_id: user_id,
    status: 'active',
    expiry_date: { $gt: new Date() }
  });
};

// Static method to find expiring subscriptions (within 7 days)
subscriptionSchema.statics.findExpiringSubscriptions = function(days = 7) {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return this.find({
    status: 'active',
    expiry_date: { $gte: now, $lte: future }
  });
};

// Export model
module.exports = mongoose.model('Subscription', subscriptionSchema);
