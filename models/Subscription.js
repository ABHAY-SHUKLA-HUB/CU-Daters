import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  },
  
  // Payment Info
  plan: { 
    type: String,
<<<<<<< HEAD
    enum: ['Free Plan', 'Premium', 'Premium Gold', 'Premium Platinum'], 
=======
    enum: ['premium', 'monthly', 'quarterly', 'yearly', 'Free Plan', 'CU Crush+', 'CU Crush Gold', 'CU Crush Platinum'], 
>>>>>>> 8603a53246669d81d74718efbf0c3d1aa17377ae
    required: true 
  },
  amount: { type: Number, required: true },
  
  // Payment Verification
  payment_id: { 
    type: String, 
    unique: true, 
    required: true 
  }, // UTR or transaction ID
  screenshot_url: { type: String },
  
  // Subscription Details
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'active', 'expired'], 
    default: 'pending' 
  },
  start_date: { type: Date },
  expiry_date: { type: Date },
  
  // Admin Actions
  admin_notes: { type: String },
  approved_at: { type: Date },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejected_at: { type: Date },
  rejected_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejection_reason: { type: String },
  
  // Timestamps
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Index for fast queries
SubscriptionSchema.index({ user_id: 1, status: 1 });
SubscriptionSchema.index({ created_at: -1 });

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

export default Subscription;
