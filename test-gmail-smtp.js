#!/usr/bin/env node
/**
 * Gmail SMTP Connection Test Script
 * 
 * Usage: node test-gmail-smtp.js
 * 
 * This script tests your Gmail SMTP configuration before starting the backend.
 * It will help diagnose connection issues quickly.
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import process from 'node:process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const EMAIL_USER = String(process.env.EMAIL_USER || '').trim();
const EMAIL_PASSWORD = String(process.env.EMAIL_PASSWORD || '').replace(/\s+/g, '');
const SMTP_HOST = String(process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

console.log('\n' + '='.repeat(80));
console.log('📧 Gmail SMTP Connection Diagnostic Test');
console.log('='.repeat(80) + '\n');

// Step 1: Check environment variables
console.log('📋 Step 1: Checking Environment Variables...\n');

if (!EMAIL_USER) {
  console.error('❌ EMAIL_USER not set\n');
  console.error('   Fix: Add EMAIL_USER=your-email@gmail.com to .env file\n');
  process.exit(1);
}

if (!EMAIL_PASSWORD) {
  console.error('❌ EMAIL_PASSWORD not set\n');
  console.error('   Fix: Add EMAIL_PASSWORD=<16-char-app-password> to .env file\n');
  console.error('   Get app password from: myaccount.google.com/apppasswords\n');
  process.exit(1);
}

console.log('✅ EMAIL_USER configured:', EMAIL_USER);
console.log('✅ EMAIL_PASSWORD set:', EMAIL_PASSWORD.length, 'characters');
console.log('✅ SMTP_HOST:', SMTP_HOST);
console.log('✅ SMTP_PORT:', SMTP_PORT);
console.log('✅ SMTP_SECURE:', SMTP_SECURE);
console.log('');

// Step 2: Create transporter
console.log('📋 Step 2: Creating SMTP Transporter...\n');

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  requireTLS: !SMTP_SECURE,
  family: 4,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD
  },
  connectionTimeout: 15000,
  socketTimeout: 15000,
  tls: {
    rejectUnauthorized: false
  }
});

// Step 3: Test connection
console.log('📋 Step 3: Testing SMTP Connection...\n');
console.log('Connecting to:', `${SMTP_HOST}:${SMTP_PORT} (secure: ${SMTP_SECURE})`);
console.log('With user:', EMAIL_USER);
console.log('');

transporter.verify((error) => {
  if (error) {
    console.error('\n❌ SMTP Connection Failed!\n');
    console.error('Error Type:', error.code || error.name || 'UNKNOWN');
    console.error('Error Message:', error.message);
    console.error('');

    // Provide specific fixes based on error
    if (error.message.includes('Invalid') || error.code === 'EAUTH' || error.message.includes('535')) {
      console.error('🔴 Authentication Issue Detected\n');
      console.error('Likely causes:');
      console.error('  1. EMAIL_PASSWORD is incorrect');
      console.error('  2. 2FA is not enabled on Gmail account');
      console.error('  3. App password was not generated correctly\n');
      console.error('Quick fix:');
      console.error('  1. Go to myaccount.google.com/apppasswords');
      console.error('  2. Generate a NEW 16-character password');
      console.error('  3. Update EMAIL_PASSWORD in .env (copy without spaces)');
      console.error('  4. Run this test again\n');
    } else if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      console.error('🔴 Connection Timeout\n');
      console.error('Likely causes:');
      console.error('  1. Firewall blocking port 587 or 465');
      console.error('  2. Network connectivity issue');
      console.error('  3. Gmail SMTP server unreachable\n');
      console.error('Quick fix:');
      console.error('  1. Test network: ping smtp.gmail.com');
      console.error('  2. Check firewall allows port 587 outbound');
      console.error('  3. Try using port 465 with SMTP_SECURE=true\n');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔴 Connection Refused\n');
      console.error('Likely causes:');
      console.error('  1. SMTP_HOST is incorrect');
      console.error('  2. SMTP_PORT is blocked');
      console.error('  3. Gmail server is down\n');
      console.error('Quick fix:');
      console.error('  1. Verify SMTP_HOST=smtp.gmail.com in .env');
      console.error('  2. Try SMTP_PORT=465 with SMTP_SECURE=true');
      console.error('  3. Check https://www.google.com/appsstatus\n');
    } else {
      console.error('🔴 Unknown Error\n');
      console.error('Full error object:');
      console.error(error);
      console.error('');
    }

    console.error('' + '='.repeat(80));
    process.exit(1);
  } else {
    console.log('');
    console.log('✅ SMTP Connection Successful!\n');
    
    // Step 4: Send test email
    console.log('📋 Step 4: Sending Test Email...\n');
    
    const testEmail = EMAIL_USER; // Send to self
    const mailOptions = {
      from: EMAIL_USER,
      to: testEmail,
      subject: '💖 SeeU-Daters SMTP Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; border-radius: 10px;">
          <h2 style="color: #d4536f;">✅ Gmail SMTP Connection Test Successful!</h2>
          <p>Your Gmail SMTP configuration is working correctly.</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>Email User: ${EMAIL_USER}</li>
            <li>SMTP Host: ${SMTP_HOST}</li>
            <li>SMTP Port: ${SMTP_PORT}</li>
            <li>Secure: ${SMTP_SECURE}</li>
            <li>Timestamp: ${new Date().toISOString()}</li>
          </ul>
          <p>You can now start your backend and OTP emails will be sent via Gmail SMTP.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">SeeU-Daters - Campus Dating Platform</p>
        </div>
      `,
      text: 'Gmail SMTP Connection Test Successful! OTP emails will now be sent via Gmail SMTP.'
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Test Email Send Failed!\n');
        console.error('Error:', error.message);
        console.error('');
        console.error('Note: Connection works but email send failed.');
        console.error('This usually means your Gmail credentials have an issue.');
        console.error('');
        console.error('Try:');
        console.error('  1. Regenerate app password from myaccount.google.com/apppasswords');
        console.error('  2. Update EMAIL_PASSWORD in .env');
        console.error('  3. Run this test again\n');
        console.error('='.repeat(80));
        process.exit(1);
      } else {
        console.log('✅ Test Email Sent Successfully!\n');
        console.log('Message ID:', info.messageId);
        console.log('');
        console.log('📧 Check your inbox for the test email.');
        console.log('If not received, check spam folder (it may be marked as spam).');
        console.log('');
        console.log('✅ Your Gmail SMTP is configured correctly!');
        console.log('✅ OTP emails will be sent via Gmail');
        console.log('✅ Safe to start backend\n');
        console.log('='.repeat(80));
        console.log('\n🚀 Next steps:\n');
        console.log('1. Verify the test email was received');
        console.log('2. Start your backend: npm run dev');
        console.log('3. Test OTP signup flow');
        console.log('4. Check backend logs for: "✅ OTP email sent successfully"\n');
        console.log('='.repeat(80) + '\n');
        process.exit(0);
      }
    });
  }
});

