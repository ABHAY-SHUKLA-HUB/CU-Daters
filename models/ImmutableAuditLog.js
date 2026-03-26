import mongoose from 'mongoose';
import crypto from 'crypto';

const ImmutableAuditLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  targetId: {
    type: String,
    default: '',
    index: true
  },
  targetType: {
    type: String,
    default: '',
    lowercase: true,
    trim: true,
    index: true
  },
  reason: {
    type: String,
    default: '',
    trim: true
  },
  beforeState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  afterState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'pending'],
    default: 'success',
    index: true
  },
  ipAddress: {
    type: String,
    default: 'unknown'
  },
  userAgent: {
    type: String,
    default: 'unknown'
  },
  requestId: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  prevHash: {
    type: String,
    required: true,
    index: true
  },
  hash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  occurredAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

ImmutableAuditLogSchema.pre('findOneAndDelete', function () {
  throw new Error('Immutable audit logs cannot be deleted');
});

ImmutableAuditLogSchema.pre('deleteOne', function () {
  throw new Error('Immutable audit logs cannot be deleted');
});

ImmutableAuditLogSchema.pre('deleteMany', function () {
  throw new Error('Immutable audit logs cannot be deleted');
});

ImmutableAuditLogSchema.pre('updateOne', function () {
  throw new Error('Immutable audit logs cannot be updated');
});

ImmutableAuditLogSchema.pre('updateMany', function () {
  throw new Error('Immutable audit logs cannot be updated');
});

ImmutableAuditLogSchema.statics.computeHash = function (payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
};

const ImmutableAuditLog = mongoose.model('ImmutableAuditLog', ImmutableAuditLogSchema);

export default ImmutableAuditLog;
