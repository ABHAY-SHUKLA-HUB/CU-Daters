import mongoose from 'mongoose';

const BlockSchema = new mongoose.Schema(
  {
    blockerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    blockedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    pairKey: {
      type: String,
      required: true,
      index: true
    },
    reason: { type: String, trim: true }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

BlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

const Block = mongoose.model('Block', BlockSchema);

export default Block;
