import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const deleteAllUsers = async () => {
  try {
    console.log('🔗 Connecting to database...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n⚠️  Deleting all users...');
    const result = await User.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} users`);
    console.log('\n✨ Database cleaned! Ready for fresh start.');
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error deleting users:', error.message);
    process.exit(1);
  }
};

deleteAllUsers();
