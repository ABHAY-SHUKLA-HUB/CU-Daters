import mongoose from 'mongoose';

const CareerApplicationSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  campus: {
    type: String,
    enum: ['CU Mohali', 'CU UP'],
    required: true
  },
  whyYou: {
    type: String,
    required: true,
    minlength: 50,
    maxlength: 2000
  },
  instagram: {
    type: String,
    required: true,
    trim: true
  },
  linkedin: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: String,
    required: true,
    trim: true,
    minlength: 20,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'rejected', 'approved'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Automatically update updatedAt on save
CareerApplicationSchema.pre('save', async function () {
  this.updatedAt = Date.now();
});

const CareerApplication = mongoose.model('CareerApplication', CareerApplicationSchema);

export default CareerApplication;
