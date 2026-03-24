import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    participantKey: { type: String, required: true, unique: true },
    participantAId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    participantBId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastMessage: { type: String, default: '' },
    lastMessageTime: { type: Date },
    chatTheme: {
      type: String,
      enum: [
        'romantic-pink',
        'lavender-blush',
        'heart-mode',
        'soft-night',
        'cream-dream',
        'minimal-white',
        'dark-romantic'
      ],
      default: 'romantic-pink'
    },
    nicknameAForB: { type: String, default: '', trim: true, maxlength: 40 },
    nicknameBForA: { type: String, default: '', trim: true, maxlength: 40 },
    isBlocked: { type: Boolean, default: false },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  {
    timestamps: true
  }
);

ConversationSchema.pre('validate', async function normalizeParticipants() {
  if (!Array.isArray(this.participants) || this.participants.length !== 2) {
    throw new Error('Conversation must include exactly 2 participants');
  }

  const normalized = [...this.participants]
    .map((id) => id.toString())
    .sort();

  this.participants = normalized;
  this.participantAId = normalized[0];
  this.participantBId = normalized[1];
  this.participantKey = normalized.join(':');
});

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });
ConversationSchema.index({ participantAId: 1, lastMessageTime: -1, updatedAt: -1 });
ConversationSchema.index({ participantBId: 1, lastMessageTime: -1, updatedAt: -1 });

const Conversation = mongoose.model('Conversation', ConversationSchema);

export default Conversation;
