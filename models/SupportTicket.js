import mongoose from 'mongoose';

const SupportTicketSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subject: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolution_note: { type: String }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

SupportTicketSchema.index({ status: 1, priority: 1, created_at: -1 });

const SupportTicket = mongoose.model('SupportTicket', SupportTicketSchema);

export default SupportTicket;
