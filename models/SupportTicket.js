import mongoose from 'mongoose';

const SupportTicketSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'closed'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolution_note: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    accepted_at: { type: Date },
    rejected_at: { type: Date },
    closed_at: { type: Date },
    auto_rejected_at: { type: Date },
    rejection_reason: { type: String }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

SupportTicketSchema.index({ status: 1, priority: 1, created_at: -1 });
SupportTicketSchema.index({ user_id: 1, created_at: -1 });
SupportTicketSchema.index({ admin_id: 1, created_at: -1 });
SupportTicketSchema.index({ created_at: 1 });

const SupportTicket = mongoose.model('SupportTicket', SupportTicketSchema);

export default SupportTicket;
