import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const [emailArg, passwordArg, nameArg] = process.argv.slice(2);

const email = emailArg || process.env.ADMIN_EMAIL;
const password = passwordArg || process.env.ADMIN_PASSWORD;
const name = nameArg || 'Admin User';

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is missing in .env');
  process.exit(1);
}

if (!email || !password) {
  console.error('Usage: npm run create-admin -- <email> <password> [name]');
  console.error('Or set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const emailLower = email.toLowerCase().trim();

    let user = await User.findOne({
      $or: [
        { email: emailLower },
        { collegeEmail: emailLower },
        { personalEmail: emailLower }
      ]
    });

    if (!user) {
      user = await User.create({
        name,
        email: emailLower,
        password,
        role: 'admin',
        status: 'active',
        is_verified: true,
        profile_approval_status: 'approved',
        subscription_status: 'none',
        course: 'Administration',
        year: '1',
        gender: 'other',
        bio: 'System administrator account',
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log(`Admin created: ${user.email}`);
    } else {
      user.role = 'admin';
      user.status = 'active';
      user.is_verified = true;
      user.profile_approval_status = 'approved';
      user.password = password;
      user.updated_at = new Date();
      await user.save();
      console.log(`Admin updated: ${user.email}`);
    }

    console.log('Done. You can now log in to /admin-login.');
  } catch (error) {
    console.error('Failed to create/update admin:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
