import mongoose from 'mongoose';

const SupportMessageSchema = new mongoose.Schema(
  {
    support_ticket_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket', required: true },
    sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sender_type: { type: String, enum: ['user', 'admin', 'ai'], required: true },
    sender_name: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    attachment: {
      filename: String,
      mimeType: String,
      size: Number,
      url: String
    },
    read_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    read_at: { type: Date },
    delivered_at: { type: Date, default: Date.now },
    typing_indicator: { type: Boolean, default: false },
    emoji_support: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

SupportMessageSchema.index({ support_ticket_id: 1, created_at: 1 });
SupportMessageSchema.index({ sender_id: 1, created_at: -1 });
SupportMessageSchema.index({ sender_type: 1, created_at: -1 });

const SupportMessage = mongoose.model('SupportMessage', SupportMessageSchema);

export default SupportMessage;
