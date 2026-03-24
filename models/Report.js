import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema(
  {
    reporter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    target_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    target_type: {
      type: String,
      enum: ['user', 'profile', 'photo', 'message', 'chat', 'match', 'other'],
      default: 'user'
    },
    target_id: { type: String },
    reason: { type: String, required: true, trim: true },
    details: { type: String, trim: true },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'dismissed'],
      default: 'open'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    moderation_notes: { type: String },
    resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolved_at: { type: Date }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

ReportSchema.index({ status: 1, priority: 1, created_at: -1 });
ReportSchema.index({ target_user_id: 1, created_at: -1 });

const Report = mongoose.model('Report', ReportSchema);

export default Report;
