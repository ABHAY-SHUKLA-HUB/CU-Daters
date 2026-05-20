import mongoose from 'mongoose';

const SupportNotificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    support_ticket_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket', required: true },
    type: {
      type: String,
      enum: ['request_received', 'ai_response', 'admin_accepted', 'admin_joined', 'message_received', 'ticket_resolved', 'ticket_expired'],
      required: true
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    read: { type: Boolean, default: false },
    read_at: { type: Date },
    notification_sound_played: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

SupportNotificationSchema.index({ user_id: 1, read: 1, created_at: -1 });
SupportNotificationSchema.index({ support_ticket_id: 1, created_at: -1 });
SupportNotificationSchema.index({ user_id: 1, created_at: -1 });

const SupportNotification = mongoose.model('SupportNotification', SupportNotificationSchema);

export default SupportNotification;
