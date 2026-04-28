#!/usr/bin/env node
/**
 * Create Test User Script
 * Usage: node create-test-user.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import User model
import User from './models/User.js';

const TEST_USER = {
  email: 'testuser@cudaters.com',
  password: 'Test@12345',
  name: 'Test User',
  collegeEmail: 'testuser@cumail.in',
  phone: '9111111111',
};

async function createTestUser() {
  try {
    console.log('\n👤 Creating Test User...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: TEST_USER.email });
    if (existingUser) {
      console.log('⚠️  Test user already exists!');
      console.log(`Email: ${existingUser.email}`);
      console.log('\n🔄 Updating test user password...');
      
      existingUser.password = TEST_USER.password; // Let pre-save hook hash it
      await existingUser.save();
      
      console.log('✅ Test user password updated!');
      await mongoose.connection.close();
      return;
    }

    // Create test user - DON'T pre-hash, let the pre-save hook handle it
    const testUser = new User({
      name: TEST_USER.name,
      email: TEST_USER.email,
      collegeEmail: TEST_USER.collegeEmail,
      password: TEST_USER.password, // ✅ Plain password - pre-save hook will hash it
      phone: TEST_USER.phone,
      role: 'user',
      isVerified: true,
      isApproved: true,
      verificationComplete: true,
      profile: {
        bio: 'Test User Profile',
        gender: 'Male',
        age: 20,
        year: '2nd Year',
        course: 'Engineering',
        isPublic: true,
        photos: ['https://via.placeholder.com/500']
      }
    });

    await testUser.save();

    console.log('\n✅ TEST USER CREATED SUCCESSFULLY!\n');
    console.log('═══════════════════════════════════════════');
    console.log('📧 Email:', TEST_USER.email);
    console.log('🔑 Password:', TEST_USER.password);
    console.log('👤 Role:', 'user');
    console.log('═══════════════════════════════════════════\n');
    console.log('🔗 Login at: http://localhost:5173/login\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    process.exit(1);
  }
}

// Run the script
createTestUser();
