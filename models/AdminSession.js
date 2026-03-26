import mongoose from 'mongoose';

const AdminSessionSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  refreshTokenHash: {
    type: String,
    required: true,
    index: true
  },
  csrfTokenHash: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    default: 'unknown'
  },
  userAgent: {
    type: String,
    default: 'unknown'
  },
  deviceInfo: {
    type: String,
    default: 'unknown'
  },
  lastActivityAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  revokedAt: {
    type: Date,
    default: null,
    index: true
  },
  revokeReason: {
    type: String,
    trim: true,
    default: ''
  },
  suspicious: {
    type: Boolean,
    default: false,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

AdminSessionSchema.index({ adminId: 1, revokedAt: 1, expiresAt: 1, lastActivityAt: -1 });

const AdminSession = mongoose.model('AdminSession', AdminSessionSchema);

export default AdminSession;
