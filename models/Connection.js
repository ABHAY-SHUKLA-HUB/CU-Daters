import mongoose from 'mongoose';

const ConnectionSchema = new mongoose.Schema(
  {
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    pairKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

ConnectionSchema.index({ userA: 1, createdAt: -1 });
ConnectionSchema.index({ userB: 1, createdAt: -1 });

const Connection = mongoose.model('Connection', ConnectionSchema);

export default Connection;
