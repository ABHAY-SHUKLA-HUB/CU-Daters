import mongoose from 'mongoose';

const AppSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    description: { type: String, trim: true },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

const AppSetting = mongoose.model('AppSetting', AppSettingSchema);

export default AppSetting;
