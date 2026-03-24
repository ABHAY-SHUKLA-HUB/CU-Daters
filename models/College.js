import mongoose from 'mongoose';

const CollegeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true, trim: true, lowercase: true, unique: true },
    is_active: { type: Boolean, default: true },
    verification_required: { type: Boolean, default: true },
    onboarding_enabled: { type: Boolean, default: true },
    campus_notes: { type: String, trim: true }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

CollegeSchema.index({ is_active: 1, onboarding_enabled: 1 });

const College = mongoose.model('College', CollegeSchema);

export default College;
