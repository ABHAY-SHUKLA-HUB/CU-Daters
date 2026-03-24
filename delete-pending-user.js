#!/usr/bin/env node
/**
 * DELETE PENDING USER
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
    console.log(`   Status: ${user.status}`);
    console.log(`   Deleting...\n`);
    
    await Like.deleteMany({ $or: [{ userId }, { targetUserId: userId }] });
    await Conversation.deleteMany({ participants: userId });
    await Message.deleteMany({ senderId: userId });
    await Subscription.deleteMany({ userId });
    await ActivityLog.deleteMany({ user_id: userId });
    await Match.deleteMany({ $or: [{ userId }, { targetUserId: userId }] });
    await Report.deleteMany({ reportedBy: userId });
    await User.deleteOne({ _id: userId });

    console.log(`✅ ${email} deleted!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

// Delete pending test user
await deleteUser('krishnamdwivedi17@gmail.com');
process.exit(0);
