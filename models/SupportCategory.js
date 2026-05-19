import mongoose from 'mongoose';

const SupportCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    icon: { type: String },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

SupportCategorySchema.index({ active: 1, order: 1 });

const SupportCategory = mongoose.model('SupportCategory', SupportCategorySchema);

export default SupportCategory;
