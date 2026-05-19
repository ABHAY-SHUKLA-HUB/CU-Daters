#!/usr/bin/env node

/**
 * Setup script for Live Chat Support System
 * Run with: node scripts/setupSupport.js
 */

import mongoose from 'mongoose';
import '../init-env.js';
import { initializeSupportCategories } from '../utils/initSupportCategories.js';

const setupSupport = async () => {
  try {
    console.log('\n🚀 Setting up Live Chat Support System...\n');

    // Connect to database
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set in environment variables');
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Initialize support categories
    console.log('📚 Initializing support categories...');
    await initializeSupportCategories();
    console.log('✓ Support categories initialized\n');

    console.log('✅ Support system setup complete!\n');
    console.log('Next steps:');
    console.log('1. Add SupportWidget to your App.jsx');
    console.log('2. Add AdminSupportDashboard to your admin routes');
    console.log('3. Verify Socket.IO is connected in the browser');
    console.log('4. Test creating a support request\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
};

setupSupport();
