/**
 * Clear old Terms & Conditions from database
 * Run: node clear-old-terms.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AppSetting from './models/AppSetting.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cudaters';

async function clearOldTerms() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected');

    console.log('🗑️  Deleting old legal_content_config from database...');
    const result = await AppSetting.deleteOne({ key: 'legal_content_config' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Deleted old config. Backend will now use updated defaults!');
    } else {
      console.log('ℹ️  No old config found in database (good sign)');
    }

    console.log('\n📝 Updated Terms will now show from hardcoded defaults in routes/config.js');
    console.log('🔄 Restart dev server with: npm run dev');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearOldTerms();
