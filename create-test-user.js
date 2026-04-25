import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import connectDB from './config/database.js';

dotenv.config();

async function createTestUser() {
  try {
    await connectDB();
    
    const user = await User.create({
      name: 'Test Student',
      email: 'student@cudaters.com',
      password: 'Student@12345',
      role: 'user',
      status: 'active',
      is_verified: true,
      profile_approval_status: 'approved',
      subscription_status: 'none',
      course: 'Computer Science',
      year: '2',
      gender: 'male',
      bio: 'Test student account',
      college: '507f1f77bcf86cd799439011'
    });
    
    console.log('✅ Test student created:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: Student@12345`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

createTestUser();
