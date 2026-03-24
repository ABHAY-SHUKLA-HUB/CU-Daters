import dotenv from 'dotenv';

// Load .env only in development (NOT on Render)
if (process.env.NODE_ENV !== 'production') {
  const result = dotenv.config();

  console.log('\n🔧 Environment Loading (LOCAL):');
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
} else {
  console.log('🚀 Production mode: Using Render environment variables');
}

export default null;