import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const API_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_SECRET = process.env.ACCESS_SECRET;

async function testToken() {
  console.log('--- Environment Check ---');
  console.log('JWT_SECRET exists:', !!JWT_SECRET);
  console.log('ACCESS_SECRET exists:', !!ACCESS_SECRET);
  console.log('Secrets match:', JWT_SECRET === ACCESS_SECRET);

  try {
    console.log('\n--- Admin Login ---');
    const loginRes = await axios.post(API_URL + '/api/auth/admin-login', {
      email: 'admin@cudaters.com',
      password: 'AdminPassword123!'
    });
    
    const token = loginRes.data.data.token || loginRes.data.token;
    console.log('Token received');

    console.log('\n--- Decoding with JWT_SECRET ---');
    try {
      if (JWT_SECRET) {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Verification Success (JWT_SECRET)');
        console.log('Payload:', JSON.stringify(decoded, null, 2));
      } else {
        console.log('JWT_SECRET not available for verification');
      }
    } catch (e) {
      console.log('Verification Failed (JWT_SECRET):', e.message);
    }

    console.log('\n--- Decoding with ACCESS_SECRET ---');
    try {
      if (ACCESS_SECRET) {
        const decoded = jwt.verify(token, ACCESS_SECRET);
        console.log('Verification Success (ACCESS_SECRET)');
        console.log('Payload:', JSON.stringify(decoded, null, 2));
      } else {
        console.log('ACCESS_SECRET not available for verification');
      }
    } catch (e) {
      console.log('Verification Failed (ACCESS_SECRET):', e.message);
    }

    console.log('\n--- Manual Decode (No Verify) ---');
    const manual = jwt.decode(token);
    console.log('Manual Payload:', JSON.stringify(manual, null, 2));

  } catch (error) {
    if (error.response) {
      console.error('Error Response:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testToken();
