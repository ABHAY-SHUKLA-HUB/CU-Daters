import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
      required() {
        return this.messageType === 'text' || this.messageType === 'emoji' || this.messageType === 'system';
      }
    },
    messageType: {
      type: String,
      enum: ['text', 'emoji', 'image', 'file', 'attachment', 'voice', 'system', 'call'],
      default: 'text'
    },
    attachment: {
      name: { type: String, default: '' },
      size: { type: Number, default: 0 },
      mimeType: { type: String, default: '' },
      url: { type: String, default: '' }
    },
    voiceNote: {
      durationSec: { type: Number, default: 0 },
      mimeType: { type: String, default: 'audio/webm' },
      fileName: { type: String, default: '' },
      url: { type: String, default: '' }
    },
    clientMessageId: {
      type: String,
      default: '',
      trim: true,
      index: true
    },
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        emoji: { type: String, required: true, trim: true, maxlength: 8 },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    delivered: { type: Boolean, default: false, index: true },
    seen: { type: Boolean, default: false, index: true },
    deliveryStatus: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'seen', 'failed'],
      default: 'sent'
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false }
  }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ conversationId: 1, receiverId: 1, seen: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, seen: 1, createdAt: -1 });
MessageSchema.index(
  { conversationId: 1, senderId: 1, clientMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: { clientMessageId: { $type: 'string', $gt: '' } }
  }
);

const Message = mongoose.model('Message', MessageSchema);

export default Message;
