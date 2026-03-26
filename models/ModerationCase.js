import mongoose from 'mongoose';

const ModerationCaseSchema = new mongoose.Schema({
  sourceType: {
    type: String,
    enum: ['report', 'appeal', 'system_alert', 'privacy_event'],
    required: true,
    index: true
  },
  sourceId: {
    type: String,
    required: true,
    index: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'in_review', 'escalated', 'resolved', 'rejected'],
    default: 'open',
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  escalationLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  dueAt: {
    type: Date,
    default: null,
    index: true
  },
  summary: {
    type: String,
    default: '',
    trim: true
  },
  notes: [{
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now }
  }],
  lastActionAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

ModerationCaseSchema.index({ status: 1, severity: 1, createdAt: -1 });

const ModerationCase = mongoose.model('ModerationCase', ModerationCaseSchema);

export default ModerationCase;
