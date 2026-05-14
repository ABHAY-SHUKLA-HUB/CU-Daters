import mongoose from 'mongoose';
import User from './models/User.js';
import VerificationSubmission from './models/VerificationSubmission.js';
import dotenv from 'dotenv';

dotenv.config();

async function approveAllPendingUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all pending users
    const pendingUsers = await User.find({ status: 'pending' });
    console.log(`Found ${pendingUsers.length} pending users`);

    let approvedCount = 0;

    for (const user of pendingUsers) {
      console.log(`Approving: ${user.name} (${user.email})`);
      
      // Update user status
      user.status = 'active';
      user.is_verified = true;
      user.verification_status = 'approved';
      user.profile_approval_status = 'approved';
      user.updated_at = new Date();
      await user.save();

      // Update verification submission
      const submission = await VerificationSubmission.findOne({ userId: user._id });
      if (submission) {
        submission.status = 'approved';
        submission.reviewNotes = 'Auto-approved via bulk approval script';
        submission.rejectionReason = '';
        submission.reviewedAt = new Date();
        submission.history.push({
          action: 'approved',
          byAdmin: null,
          note: 'Auto-approved via bulk approval script'
        });
        await submission.save();
      }

      approvedCount++;
      console.log(`  ✓ Approved`);
    }

    console.log(`\n✅ Successfully approved ${approvedCount} users`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

approveAllPendingUsers();
