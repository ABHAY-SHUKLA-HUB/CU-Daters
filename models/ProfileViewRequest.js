import mongoose from 'mongoose';

const ProfileViewRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    profileOwnerId: {
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
      enum: ['pending', 'approved', 'declined', 'cancelled'],
      default: 'pending',
      index: true
    },
    requestedMessage: {
      type: String,
      trim: true,
      maxlength: 220,
      default: ''
    },
    responseMessage: {
      type: String,
      trim: true,
      maxlength: 220,
      default: ''
    },
    actedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    actedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

ProfileViewRequestSchema.index({ requesterId: 1, profileOwnerId: 1, createdAt: -1 });
ProfileViewRequestSchema.index({ profileOwnerId: 1, status: 1, createdAt: -1 });

const ProfileViewRequest = mongoose.model('ProfileViewRequest', ProfileViewRequestSchema);

export default ProfileViewRequest;
