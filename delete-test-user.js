#!/usr/bin/env node
/**
 * DELETE SPECIFIC USER
 * Usage: node delete-user.js
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

async function deleteUser(email) {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    const userId = user._id;
    console.log(`🗑️ Found: ${user.name} (${email})`);
    console.log(`   ID: ${userId}\n`);

    console.log('Deleting related data...');
    
    await Like.deleteMany({ $or: [{ userId }, { targetUserId: userId }] });
    console.log('✓ Likes deleted');

    await Conversation.deleteMany({ participants: userId });
    console.log('✓ Conversations deleted');

    await Message.deleteMany({ senderId: userId });
    console.log('✓ Messages deleted');

    await Subscription.deleteMany({ userId });
    console.log('✓ Subscriptions deleted');

    await ActivityLog.deleteMany({ user_id: userId });
    console.log('✓ Activity logs deleted');

    await Match.deleteMany({ $or: [{ userId }, { targetUserId: userId }] });
    console.log('✓ Matches deleted');

    await Report.deleteMany({ reportedBy: userId });
    console.log('✓ Reports deleted');

    await User.deleteOne({ _id: userId });
    console.log('✓ User deleted\n');

    console.log(`✅ ${email} completely removed from database!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

// Delete pending test user
await deleteUser('krishnamdwivedi17@gmail.com');
process.exit(0);
