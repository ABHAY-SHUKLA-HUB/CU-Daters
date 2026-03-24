// This file MUST be imported first to load environment variables
import dotenv from 'dotenv';

const result = dotenv.config();
console.log('\n🔧 Environment Loading:');
console.log(`✓ .env file parsed: ${result.parsed ? 'YES' : 'NO'}`);
console.log(`✓ Variables loaded: ${Object.keys(result.parsed || {}).length}`);

if (result.error) {
  console.error('⚠️ Error loading .env:', result.error.message);
} else {
  console.log(`✓ MONGODB_URI exists: ${process.env.MONGODB_URI ? 'YES' : 'NO'}`);
  if (process.env.MONGODB_URI) {
    const isAtlas = process.env.MONGODB_URI.includes('mongodb+srv');
    console.log(`✓ Database: ${isAtlas ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'}`);
  }
}

export default null;
