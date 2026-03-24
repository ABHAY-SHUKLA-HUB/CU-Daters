import mongoose from 'mongoose';

const FullProfileAccessSchema = new mongoose.Schema(
  {
    profileOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    viewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    pairKey: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['approved', 'revoked'],
      default: 'approved',
      index: true
    },
    approvedAt: {
      type: Date,
      default: Date.now
    },
    revokedAt: {
      type: Date,
      default: null
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

FullProfileAccessSchema.index({ profileOwnerId: 1, status: 1, updatedAt: -1 });
FullProfileAccessSchema.index({ viewerId: 1, status: 1, updatedAt: -1 });

const FullProfileAccess = mongoose.model('FullProfileAccess', FullProfileAccessSchema);

export default FullProfileAccess;
