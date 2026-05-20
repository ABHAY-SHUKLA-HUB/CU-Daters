import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

dotenv.config();

const API_URL = 'http://localhost:5000';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cu-daters';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Minimal Schema definition
const AdminSessionSchema = new mongoose.Schema({
  adminId: mongoose.Schema.Types.ObjectId,
  sessionId: String,
  expiresAt: Date,
  revokedAt: Date,
  lastActivityAt: Date,
  status: { type: String, default: 'active' }
}, { timestamps: true });

const AdminSession = mongoose.model('AdminSession', AdminSessionSchema);

async function checkSession() {
  try {
    console.log('--- Connecting to MongoDB ---');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    console.log('\n--- Admin Login ---');
    const loginRes = await axios.post(API_URL + '/api/auth/admin-login', {
      email: 'admin@cudaters.com',
      password: 'AdminPassword123!'
    });
    
    const token = loginRes.data.data?.token || loginRes.data.token;
    if (!token) {
        console.error('No token received');
        process.exit(1);
    }
    console.log('Token received.');

    const decoded = jwt.decode(token);
    const sessionId = decoded.sessionId;
    console.log('Session ID from token:', sessionId);

    if (!sessionId) {
        console.log('No sessionId found in token payload:', decoded);
        process.exit(1);
    }

    console.log('\n--- Querying AdminSession Collection ---');
    const session = await AdminSession.findOne({ sessionId: sessionId });

    if (!session) {
      console.log('Session NOT FOUND in database.');
    } else {
      console.log('Session Found:');
      console.log({
        sessionId: session.sessionId,
        adminId: session.adminId,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
        lastActivityAt: session.lastActivityAt,
        status: session.status
      });

      const now = new Date();
      console.log('\n--- Status Check ---');
      console.log('Current Time  :', now.toISOString());
      console.log('Expiry Time   :', session.expiresAt.toISOString());
      console.log('Has Expired   :', now > session.expiresAt);
      console.log('Is Revoked    :', !!session.revokedAt || session.status === 'revoked');
    }

  } catch (error) {
    if (error.response) {
      console.error('Error Response:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await mongoose.disconnect();
  }
}

checkSession();
