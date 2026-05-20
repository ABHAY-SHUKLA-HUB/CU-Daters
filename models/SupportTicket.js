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
      enum: ['pending', 'active', 'expired', 'resolved', 'closed'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolution_note: { type: String },
    
    // Timer fields for 5-minute expiry
    timerStartedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 5 * 60 * 1000) },
    timerActive: { type: Boolean, default: true },
    
    // AI Support Agent fields
    aiActive: { type: Boolean, default: true },
    aiMessages: { type: Number, default: 0 },
    aiSolvedIssue: { type: Boolean, default: false },
    
    // User details for quick access
    userName: { type: String, trim: true },
    userEmail: { type: String, trim: true },
    userUsername: { type: String, trim: true },
    
    // Attachment support
    attachments: [{
      filename: String,
      mimeType: String,
      size: Number,
      url: String
    }],
    
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    accepted_at: { type: Date },
    expired_at: { type: Date },
    resolved_at: { type: Date },
    closed_at: { type: Date },
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
SupportTicketSchema.index({ expiresAt: 1 });
SupportTicketSchema.index({ status: 1, timerActive: 1 });

const SupportTicket = mongoose.model('SupportTicket', SupportTicketSchema);

export default SupportTicket;
