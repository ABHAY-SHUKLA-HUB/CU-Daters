import mongoose from 'mongoose';

const AppealRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  relatedAction: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  relatedEntityId: {
    type: String,
    default: '',
    index: true
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 5000
  },
  status: {
    type: String,
    enum: ['pending', 'in_review', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  resolutionNote: {
    type: String,
    default: '',
    trim: true
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const AppealRequest = mongoose.model('AppealRequest', AppealRequestSchema);

export default AppealRequest;
