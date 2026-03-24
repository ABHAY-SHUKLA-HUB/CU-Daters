import mongoose from 'mongoose';

const LikeSchema = new mongoose.Schema(
  {
    // User who is liking
    likedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // User whose profile is being liked
    likedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Status of the like
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    
    // When was it accepted/rejected
    actionAt: { type: Date },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Notification sent or not
    notificationSent: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

// Ensure no duplicate likes - one user can like another only once
LikeSchema.index(
  { likedBy: 1, likedUser: 1 },
  { unique: true }
);

// Index for finding pending likes for a user
LikeSchema.index({ likedUser: 1, status: 1 });

// Index for finding likes sent by a user
LikeSchema.index({ likedBy: 1, status: 1 });

const Like = mongoose.model('Like', LikeSchema);

export default Like;
