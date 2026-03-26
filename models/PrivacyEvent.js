import mongoose from 'mongoose';

const PrivacyEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    default: null,
    index: true
  },
  eventType: {
    type: String,
    enum: ['screenshot_detected', 'screen_recording_detected', 'printscreen_key', 'chat_sensitive_view'],
    required: true,
    index: true
  },
  platform: {
    type: String,
    enum: ['web', 'android', 'ios', 'unknown'],
    default: 'unknown',
    index: true
  },
  supportedSignal: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  consentContext: {
    type: String,
    default: '',
    trim: true
  },
  ipAddress: {
    type: String,
    default: 'unknown'
  }
}, {
  timestamps: true
});

PrivacyEventSchema.index({ eventType: 1, createdAt: -1 });

const PrivacyEvent = mongoose.model('PrivacyEvent', PrivacyEventSchema);

export default PrivacyEvent;
