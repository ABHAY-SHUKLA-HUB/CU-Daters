import mongoose from 'mongoose';

const ConnectionRequestSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    receiverId: {
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
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled'],
      default: 'pending',
      index: true
    },
    requestType: {
      type: String,
      enum: ['connection', 'chat'],
      default: 'connection',
      index: true
    },
    requestMessage: {
      type: String,
      default: '',
      trim: true,
      maxlength: 240
    },
    actedAt: { type: Date }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

ConnectionRequestSchema.index(
  { pairKey: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);
ConnectionRequestSchema.index({ receiverId: 1, status: 1, createdAt: -1 });
ConnectionRequestSchema.index({ senderId: 1, status: 1, createdAt: -1 });
ConnectionRequestSchema.index({ senderId: 1, createdAt: -1 });
ConnectionRequestSchema.index({ receiverId: 1, createdAt: -1 });

const ConnectionRequest = mongoose.model('ConnectionRequest', ConnectionRequestSchema);

export default ConnectionRequest;
