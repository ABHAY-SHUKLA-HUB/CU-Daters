import mongoose from 'mongoose';

const ScreenshotLogSchema = new mongoose.Schema({
  actorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    default: null,
    index: true
  },
  contextType: {
    type: String,
    enum: ['chat', 'profile', 'other'],
    default: 'chat',
    index: true
  },
  platform: {
    type: String,
    enum: ['android', 'ios', 'web', 'unknown'],
    default: 'unknown',
    index: true
  },
  detectionSignal: {
    type: String,
    enum: [
      'android_screenshot_callback',
      'android_flag_secure_block',
      'ios_screenshot_notification',
      'ios_screen_recording_detected',
      'printscreen_key',
      'frontend_reported',
      'unknown'
    ],
    default: 'unknown'
  },
  supportedSignal: {
    type: Boolean,
    default: false
  },
  occurredAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    index: true
  },
  suspicious: {
    type: Boolean,
    default: false,
    index: true
  },
  notifiedTarget: {
    type: Boolean,
    default: false
  },
  notificationSuppressed: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: 'unknown'
  },
  userAgent: {
    type: String,
    default: 'unknown'
  }
}, {
  timestamps: true,
  collection: 'screenshot_logs'
});

ScreenshotLogSchema.index({ actorUserId: 1, occurredAt: -1 });
ScreenshotLogSchema.index({ targetUserId: 1, occurredAt: -1 });
ScreenshotLogSchema.index({ conversationId: 1, occurredAt: -1 });
ScreenshotLogSchema.index({ suspicious: 1, occurredAt: -1 });

const ScreenshotLog = mongoose.model('ScreenshotLog', ScreenshotLogSchema);

export default ScreenshotLog;
