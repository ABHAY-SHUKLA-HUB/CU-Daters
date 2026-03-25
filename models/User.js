import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  // Basic Info
  firebase_uid: { type: String, unique: true, sparse: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, lowercase: true, required: true, trim: true },
  collegeEmail: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  personalEmail: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  
  // Profile Info
  gender: { type: String, enum: ['male', 'female', 'other'] },
  course: { type: String },
  college: { type: String },
  year: { type: String },
  age: { type: Number, min: 17, max: 99 },
  shortAbout: { type: String, maxlength: 160 },
  bio: { type: String, maxlength: 500 },
  detailedBio: { type: String, maxlength: 2000 },
  interests: [{ type: String, trim: true, maxlength: 40 }],
  prompts: [
    {
      question: { type: String, trim: true, maxlength: 120 },
      answer: { type: String, trim: true, maxlength: 500 }
    }
  ],
  gallery: [
    {
      imageUrl: { type: String, trim: true },
      caption: { type: String, trim: true, maxlength: 240 },
      order: { type: Number, default: 0 }
    }
  ],
  livePhoto: { type: String }, // Base64 or URL
  idCard: { type: String }, // Base64 or URL
  profilePhoto: { type: String }, // Public profile image uploaded by user
  avatarConfig: {
    preset: { type: String },
    faceShape: { type: String },
    hair: { type: String },
    outfit: { type: String }
  },
  
  // Status
  role: { type: String, enum: ['user', 'admin', 'super_admin', 'moderator', 'finance_admin'], default: 'user' },
  status: { type: String, enum: ['active', 'banned', 'pending', 'rejected'], default: 'pending' },
  is_verified: { type: Boolean, default: false },
  verified_badge: { type: Boolean, default: false },
  college_verification_status: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  college_verified_at: { type: Date },
  // Discovering Preferences
  discoveringPreference: {
    type: String,
    enum: ['male', 'female', 'both'],
    default: function() {
      if (this.gender === 'female') return 'male';
      if (this.gender === 'male') return 'female';
      return 'both';
    }
  },
  
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['everyone', 'connections_only'],
      default: 'everyone'
    },
    showOnlineStatus: { type: Boolean, default: true },
    allowDiscovery: { type: Boolean, default: true },
    allowRequests: { type: Boolean, default: true },
    showVerifiedBadge: { type: Boolean, default: true },
    fullProfile: {
      enabled: { type: Boolean, default: true },
      requireSeparateApproval: { type: Boolean, default: true },
      requestCooldownHours: { type: Number, default: 72, min: 1, max: 720 },
      onlyVerifiedRequesters: { type: Boolean, default: false },
      onlyConnectedUsers: { type: Boolean, default: true },
      sameCollegeOnly: { type: Boolean, default: false },
      autoDeclineUnknownUsers: { type: Boolean, default: false }
    }
  },
  profile_approval_status: { type: String, enum: ['pending', 'approved', 'rejected', 'needs_correction'], default: 'pending' },
  profile_admin_notes: { type: String },
  warnings_count: { type: Number, default: 0 },
  chat_frozen: { type: Boolean, default: false },
  suspended_until: { type: Date },
  
  // Subscription
  subscription_status: { type: String, enum: ['none', 'pending', 'approved', 'rejected', 'active', 'expired'], default: 'none' },
  subscription_plan: { type: String },
  subscription_start_date: { type: Date },
  subscription_expiry_date: { type: Date },
  lastSubscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  lastRazorpayPaymentId: { type: String }, // Last Razorpay payment ID
  
  // Email OTP Verification
  emailOtp: { type: String },
  emailOtpExpiry: { type: Date },
  emailVerified: { type: Boolean, default: false },
  otpRequestCount: { type: Number, default: 0 }, // Track OTP requests
  otpRequestLastTime: { type: Date }, // Last OTP request time
  otpCooldownUntil: { type: Date }, // When user can request again
  
  // Password Reset Token
  passwordResetToken: { type: String },
  passwordResetTokenExpiry: { type: Date },
  passwordResetRequestCount: { type: Number, default: 0 }, // Track reset requests for rate limiting
  passwordResetRequestLastTime: { type: Date },
  
  // Timestamps
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  last_login: { type: Date },
  last_active_at: { type: Date },
  
  // Metadata
  ip_address: { type: String },
  device_info: { type: String },
  rejected_reason: { type: String }
});

// Normalize enum fields and hash password before saving
UserSchema.pre('save', async function () {
  // Normalize gender to lowercase
  if (this.gender) {
    this.gender = this.gender.toLowerCase();
  }
  
  // Normalize role to lowercase
  if (this.role) {
    this.role = this.role.toLowerCase();
  }
  
  // Normalize status to lowercase
  if (this.status) {
    this.status = this.status.toLowerCase();
  }
  
  // Normalize subscription_status to lowercase
  if (this.subscription_status) {
    this.subscription_status = this.subscription_status.toLowerCase();
  }

  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updated_at = Date.now();
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create unique compound index for emails
UserSchema.index({ 
  email: 1, 
  collegeEmail: 1, 
  personalEmail: 1 
}, { sparse: true });
UserSchema.index({ role: 1, status: 1, profile_approval_status: 1, created_at: -1 });
UserSchema.index({ status: 1, role: 1, is_verified: 1, created_at: -1 });

const User = mongoose.model('User', UserSchema);

export default User;
