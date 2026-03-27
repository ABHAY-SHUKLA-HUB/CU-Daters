#!/usr/bin/env node
/**
 * Manual OTP Endpoint Tester
 * 
 * Usage: node test-otp-endpoint.js [environment]
 * 
 * Examples:
 *   node test-otp-endpoint.js local       # Test localhost:5000
 *   node test-otp-endpoint.js production  # Test live Render backend
 */

import axios from 'axios';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const ENDPOINTS = {
  local: 'http://localhost:5000',
  production: 'https://cu-daters-backend.onrender.com'
};

async function testOTP() {
  console.log('\n' + '='.repeat(80));
  console.log('📧 Manual OTP Endpoint Tester');
  console.log('='.repeat(80) + '\n');

  // Ask which environment
  const env = process.argv[2] || (await question('Environment (local/production): ')).trim().toLowerCase();
  const baseUrl = ENDPOINTS[env] || ENDPOINTS.local;

  console.log(`\n🎯 Target: ${baseUrl}/api/auth/send-otp\n`);

  // Get test data
  const name = await question('Name (min 2 chars): ');
  const email = await question('Email (valid format): ');
  const phone = await question('Phone (10 digits): ');
  const password = await question('Password (8+ chars, uppercase, lowercase, digit): ');
  const college = await question('College (e.g., "Local Community"): ');

  console.log('\n' + '='.repeat(80));
  console.log('📤 Sending Request...\n');

  const payload = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.replace(/\D/g, ''),
    password,
    college: college.trim()
  };

  console.log('Request Payload:', JSON.stringify(payload, null, 2));
  console.log('\n' + '-'.repeat(80) + '\n');

  try {
    const response = await axios.post(`${baseUrl}/api/auth/send-otp`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('✅ SUCCESS (200):\n');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data?.data?.emailStatus) {
      console.log(`\n📧 Email Status: ${response.data.data.emailStatus}`);
    }
  } catch (error) {
    console.log('❌ ERROR:\n');

    if (error.response) {
      console.log(`Status Code: ${error.response.status}`);
      console.log(`Status Text: ${error.response.statusText}`);
      console.log('\nResponse Data:');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response received from server');
      console.log('Request:', error.request);
    } else {
      console.log('Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');

  const again = await question('Test again? (y/n): ');
  rl.close();

  if (again.toLowerCase() === 'y') {
    rl.close();
    process.exit(0); // Restart script
  }
}

testOTP().catch(console.error);
