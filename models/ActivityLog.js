import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  admin_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  
  action: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  
  description: { type: String },
  
  // Target info
  target_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  target_type: { type: String }, // 'user', 'subscription', etc.
  target_id: { type: String },
  
  // Device & Location
  ip_address: { type: String },
  device_info: { type: String },
  user_agent: { type: String },
  
  // Status
  status: { type: String, enum: ['success', 'failure', 'pending'], default: 'success' },
  error_message: { type: String },
  
  // Metadata
  metadata: { type: mongoose.Schema.Types.Mixed },
  
  timestamp: { type: Date, default: Date.now },
});

// Index for fast queries
ActivityLogSchema.index({ user_id: 1, timestamp: -1 });
ActivityLogSchema.index({ admin_id: 1, timestamp: -1 });
ActivityLogSchema.index({ action: 1, timestamp: -1 });
ActivityLogSchema.index({ timestamp: -1 });

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

export default ActivityLog;
