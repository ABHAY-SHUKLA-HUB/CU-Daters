#!/usr/bin/env node
/**
 * Create Admin User Script
 * Usage: node create-admin-user.js
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

const ADMIN_CREDENTIALS = {
  email: 'admin@cudaters.com',
  password: 'AdminPassword123!',
  name: 'Admin User',
  collegeEmail: 'admin@cumail.in',
  phone: '9999999999',
  role: 'super_admin'
};

async function createAdminUser() {
  try {
    console.log('\n🔐 Creating Super Admin User...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Role: ${existingAdmin.role}`);
      await mongoose.connection.close();
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, salt);

    // Create admin user
    const adminUser = new User({
      name: ADMIN_CREDENTIALS.name,
      email: ADMIN_CREDENTIALS.email,
      collegeEmail: ADMIN_CREDENTIALS.collegeEmail,
      password: hashedPassword,
      phone: ADMIN_CREDENTIALS.phone,
      role: ADMIN_CREDENTIALS.role,
      isVerified: true,
      isApproved: true,
      verificationComplete: true,
      profile: {
        bio: 'System Administrator',
        isPublic: false
      }
    });

    await adminUser.save();

    console.log('\n✅ ADMIN USER CREATED SUCCESSFULLY!\n');
    console.log('═══════════════════════════════════════════');
    console.log('📧 Email:', ADMIN_CREDENTIALS.email);
    console.log('🔑 Password:', ADMIN_CREDENTIALS.password);
    console.log('👤 Role:', ADMIN_CREDENTIALS.role);
    console.log('═══════════════════════════════════════════\n');
    console.log('⚠️  IMPORTANT:');
    console.log('   1. SAVE these credentials in a secure location');
    console.log('   2. CHANGE the password after first login');
    console.log('   3. Store in a password manager');
    console.log('   4. Enable 2FA on the admin account\n');
    console.log('🔗 Login at: http://localhost:5173/login\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

// Run the script
createAdminUser();
