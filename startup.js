import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const distDir = path.join(__dirname, 'dist');

// Check if dist folder exists
if (!fs.existsSync(distDir)) {
  console.log('📦 dist folder not found. Installing dependencies and building...');
  try {
    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('Building frontend...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✓ Build complete');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

console.log('🚀 Starting server...');
// Import and start the server
import('./server.js').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
