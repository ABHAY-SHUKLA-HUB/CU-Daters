import mongoose from 'mongoose';

const DataDeletionRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
    index: true
  },
  reason: {
    type: String,
    default: '',
    trim: true,
    maxlength: 3000
  },
  retentionDays: {
    type: Number,
    default: 30,
    min: 0,
    max: 365
  },
  scheduledFor: {
    type: Date,
    default: null,
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewNote: {
    type: String,
    default: '',
    trim: true
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const DataDeletionRequest = mongoose.model('DataDeletionRequest', DataDeletionRequestSchema);

export default DataDeletionRequest;
