#!/usr/bin/env node
/**
 * FIND ALL USERS - Check what's in MongoDB
 * Usage: node find-users.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function findAllUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users
    const users = await User.find({}).select('name email personalEmail collegeEmail phone status created_at');
    
    console.log(`\n📊 Total Users Found: ${users.length}\n`);
    console.log('='.repeat(80));

    users.forEach((user, idx) => {
      console.log(`\n[${idx + 1}] ${user.name}`);
      console.log(`    email: ${user.email}`);
      console.log(`    personalEmail: ${user.personalEmail || 'N/A'}`);
      console.log(`    collegeEmail: ${user.collegeEmail || 'N/A'}`);
      console.log(`    phone: ${user.phone}`);
      console.log(`    status: ${user.status}`);
      console.log(`    created: ${user.created_at}`);
    });

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

findAllUsers().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
