import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema(
  {
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    status: {
      type: String,
      enum: ['pending', 'matched', 'unmatched'],
      default: 'pending'
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    matchedAt: { type: Date, default: Date.now },
    unmatchedAt: { type: Date },
    unmatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userSettings: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        favorite: { type: Boolean, default: false },
        muted: { type: Boolean, default: false },
        tag: {
          type: String,
          enum: ['Friend', 'Close Friend', 'Crush', 'Study Buddy', 'Coffee Buddy', 'Campus Buddy', 'Date Vibe'],
          default: 'Friend'
        },
        updatedAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

MatchSchema.pre('validate', async function normalizeMatchUsers() {
  if (!Array.isArray(this.users) || this.users.length !== 2) {
    throw new Error('Match must include exactly 2 users');
  }

  const normalized = [...this.users]
    .map((id) => id.toString())
    .sort();

  this.users = normalized;
});

MatchSchema.index({ users: 1 }, { unique: true });
MatchSchema.index({ status: 1, users: 1 });
MatchSchema.index({ requestedBy: 1, status: 1, updatedAt: -1 });

const Match = mongoose.model('Match', MatchSchema);

export default Match;
