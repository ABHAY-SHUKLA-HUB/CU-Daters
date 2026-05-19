import mongoose from 'mongoose';

const SupportMessageSchema = new mongoose.Schema(
  {
    support_ticket_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket', required: true },
    sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender_type: { type: String, enum: ['user', 'admin'], required: true },
    message: { type: String, required: true, trim: true },
    attachment: {
      filename: String,
      mimeType: String,
      size: Number,
      url: String
    },
    read_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    read_at: { type: Date },
    created_at: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

SupportMessageSchema.index({ support_ticket_id: 1, created_at: 1 });
SupportMessageSchema.index({ sender_id: 1, created_at: -1 });

const SupportMessage = mongoose.model('SupportMessage', SupportMessageSchema);

export default SupportMessage;
