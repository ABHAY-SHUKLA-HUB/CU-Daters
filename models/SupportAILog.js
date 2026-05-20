import mongoose from 'mongoose';

const SupportAILogSchema = new mongoose.Schema(
  {
    support_ticket_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issue_category: { type: String, trim: true },
    user_message: { type: String, required: true, trim: true },
    ai_response: { type: String, required: true, trim: true },
    confidence_score: { type: Number, min: 0, max: 100 },
    questions_asked: [{ type: String, trim: true }],
    troubleshooting_steps_provided: [{ type: String, trim: true }],
    issue_resolved: { type: Boolean, default: false },
    escalated_to_human: { type: Boolean, default: false },
    escalation_reason: { type: String, trim: true },
    sentiment_analysis: {
      user_sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
      urgency_level: { type: String, enum: ['low', 'medium', 'high', 'critical'] }
    },
    response_time_ms: { type: Number },
    ai_model_version: { type: String, default: 'v1.0' },
    created_at: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

SupportAILogSchema.index({ support_ticket_id: 1, created_at: 1 });
SupportAILogSchema.index({ user_id: 1, created_at: -1 });
SupportAILogSchema.index({ escalated_to_human: 1, created_at: -1 });
SupportAILogSchema.index({ issue_resolved: 1, created_at: -1 });

const SupportAILog = mongoose.model('SupportAILog', SupportAILogSchema);

export default SupportAILog;
