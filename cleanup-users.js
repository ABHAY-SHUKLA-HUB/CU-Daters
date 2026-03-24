#!/usr/bin/env node
/**
 * CLEANUP SCRIPT - Remove test/old user data from MongoDB
 * Usage: node cleanup-users.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Like from './models/Like.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import Subscription from './models/Subscription.js';
import ActivityLog from './models/ActivityLog.js';
import Match from './models/Match.js';
import Report from './models/Report.js';

dotenv.config();

// Emails to delete
const EMAILS_TO_DELETE = [
  'krishnamdwivedi95@gmail.com',
  'adminringgoodall9@typingsquirrel.com',
  'krishnamdwivedi96@gmail.com',
  'test@example.com',
  'admin@campusconnect.com'
];

async function cleanupUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    for (const email of EMAILS_TO_DELETE) {
      const emailLower = email.toLowerCase().trim();
      
      console.log(`\n🗑️ Processing: ${emailLower}`);
      
      // Find user
      const user = await User.findOne({ email: emailLower });
      
      if (!user) {
        console.log(`   ⚠️ User not found (skipping)`);
        continue;
      }

      const userId = user._id;
      console.log(`   Found: ${user.name} (ID: ${userId})`);

      // Delete associated data
      try {
        const likeDelete = await Like.deleteMany({ $or: [{ userId }, { targetUserId: userId }] });
        console.log(`   ✓ Deleted ${likeDelete.deletedCount} likes`);

        const convDelete = await Conversation.deleteMany({ participants: userId });
        console.log(`   ✓ Deleted ${convDelete.deletedCount} conversations`);

        const msgDelete = await Message.deleteMany({ senderId: userId });
        console.log(`   ✓ Deleted ${msgDelete.deletedCount} messages`);

        const subDelete = await Subscription.deleteMany({ userId });
        console.log(`   ✓ Deleted ${subDelete.deletedCount} subscriptions`);

        const logDelete = await ActivityLog.deleteMany({ user_id: userId });
        console.log(`   ✓ Deleted ${logDelete.deletedCount} activity logs`);

        const matchDelete = await Match.deleteMany({ $or: [{ userId }, { targetUserId: userId }] });
        console.log(`   ✓ Deleted ${matchDelete.deletedCount} matches`);

        const reportDelete = await Report.deleteMany({ reportedBy: userId });
        console.log(`   ✓ Deleted ${reportDelete.deletedCount} reports`);

        // Delete user
        const userDelete = await User.deleteOne({ _id: userId });
        console.log(`   ✓ Deleted user account`);

        console.log(`   ✅ ${emailLower} completely removed`);
      } catch (err) {
        console.error(`   ❌ Error deleting data for ${emailLower}:`, err.message);
      }
    }

    console.log('\n✅ Cleanup complete!');
    console.log('\n📊 Summary:');
    console.log(`   Processed ${EMAILS_TO_DELETE.length} emails`);
    console.log('\n🚀 You can now register new users with these emails.\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run cleanup
cleanupUsers().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
