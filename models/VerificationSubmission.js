import mongoose from 'mongoose';

const VerificationDocumentSchema = new mongoose.Schema(
  {
    storageKey: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 1 },
    originalName: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const VerificationHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['submitted', 'approved', 'rejected', 'resubmission_requested', 'resubmitted'],
      required: true
    },
    byAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, trim: true, maxlength: 1000, default: '' },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const VerificationSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'resubmission_required'],
    default: 'pending',
    index: true
  },
  idProofType: {
    type: String,
    enum: ['government_id', 'employee_id', 'student_id', 'other'],
    default: 'government_id'
  },
  documents: {
    selfie: { type: VerificationDocumentSchema, required: true },
    idProof: { type: VerificationDocumentSchema, required: true }
  },
  reviewNotes: { type: String, trim: true, maxlength: 1000, default: '' },
  rejectionReason: { type: String, trim: true, maxlength: 1000, default: '' },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  history: { type: [VerificationHistorySchema], default: [] },
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

VerificationSubmissionSchema.pre('save', function onSave(next) {
  this.updatedAt = new Date();
  next();
});

VerificationSubmissionSchema.index({ status: 1, updatedAt: -1 });
VerificationSubmissionSchema.index({ userId: 1, status: 1 });

const VerificationSubmission = mongoose.model('VerificationSubmission', VerificationSubmissionSchema);

export default VerificationSubmission;
