import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const isRender = Boolean(process.env.RENDER || process.env.RENDER_EXTERNAL_URL);
const isProduction = process.env.NODE_ENV === 'production' || isRender;

// Load .env only for local/dev workflows.
if (!isProduction) {
  const envPath = path.resolve(process.cwd(), '.env');
  const hasLocalEnvFile = fs.existsSync(envPath);

  if (!hasLocalEnvFile) {
    console.log('\n🔧 Environment Loading (LOCAL):');
    console.log('ℹ️ .env file not found locally. Using existing system environment variables.');
  }

  const result = hasLocalEnvFile ? dotenv.config({ path: envPath }) : { parsed: {} };

  if (hasLocalEnvFile) {
    console.log('\n🔧 Environment Loading (LOCAL):');
  }
  console.log(`✓ .env file parsed: ${result.parsed ? 'YES' : 'NO'}`);
  console.log(`✓ Variables loaded: ${Object.keys(result.parsed || {}).length}`);

  if (result.error) {
    if (result.error.code === 'ENOENT') {
      console.log('ℹ️ .env file not found locally. Using existing system environment variables.');
    } else {
      console.error('⚠️ Error loading .env:', result.error.message);
    }
  } else {
    console.log(`✓ MONGODB_URI exists: ${process.env.MONGODB_URI ? 'YES' : 'NO'}`);

    if (process.env.MONGODB_URI) {
      const isAtlas = process.env.MONGODB_URI.includes('mongodb+srv');
      console.log(`✓ Database: ${isAtlas ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'}`);
    }
  }
} else {
  console.log('🚀 Production/Render mode: Using platform environment variables');
}

export default null;