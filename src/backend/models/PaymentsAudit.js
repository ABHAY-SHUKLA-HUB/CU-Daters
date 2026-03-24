// src/backend/models/PaymentsAudit.js
const mongoose = require('mongoose');

const paymentsAuditSchema = new mongoose.Schema({
  audit_id: {
    type: String,
    unique: true,
    required: true,
    default: () => 'AUD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  },
  request_id: {
    type: String,
    required: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  admin_id: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: [
      'created_request',
      'uploaded_proof',
      'fraud_detection_run',
      'approved',
      'rejected',
      'retry_allowed',
      'manual_review',
      'script_processed',
      'renewal_created'
    ],
    required: true,
    index: true
  },
  status_before: {
    type: String,
    default: null
  },
  status_after: {
    type: String,
    default: null
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  reason: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  fraud_score: {
    type: Number,
    default: null
  },
  ip_address: {
    type: String,
    default: null
  },
  user_agent: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { collection: 'payments_audit', timestamps: false });

// Compound indexes
paymentsAuditSchema.index({ request_id: 1, timestamp: -1 });
paymentsAuditSchema.index({ user_id: 1, timestamp: -1 });
paymentsAuditSchema.index({ admin_id: 1, timestamp: -1 });
paymentsAuditSchema.index({ action: 1, timestamp: -1 });

// Static method to create audit log
paymentsAuditSchema.statics.createLog = function(data) {
  const audit = new this(data);
  return audit.save();
};

// Static method to get audit trail for request
paymentsAuditSchema.statics.getTrailForRequest = function(request_id) {
  return this.find({ request_id })
    .sort({ timestamp: 1 });
};

// Static method to get audit trail for user
paymentsAuditSchema.statics.getTrailForUser = function(user_id, limit = 100) {
  return this.find({ user_id })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get admin actions
paymentsAuditSchema.statics.getAdminActions = function(admin_id, limit = 50) {
  return this.find({ admin_id })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Export model
module.exports = mongoose.model('PaymentsAudit', paymentsAuditSchema);
