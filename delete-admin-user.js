#!/usr/bin/env node
/**
 * Delete Admin User Script
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import User from './models/User.js';

async function deleteAdmin() {
  try {
    console.log('\n🗑️  Deleting admin user...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const result = await User.deleteOne({ email: 'admin@cudaters.com' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Admin user deleted!');
    } else {
      console.log('⚠️  Admin user not found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteAdmin();
