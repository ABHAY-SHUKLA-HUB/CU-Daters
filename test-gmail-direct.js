// Direct SMTP test without server
import nodemailer from 'nodemailer';
import dns from 'node:dns';
import { promises as dnsPromises } from 'node:dns';

// Force IPv4
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (error) {
  console.warn('IPv4 first failed:', error?.message);
}

const dnsLookup = (hostname, options, callback) => {
  dnsPromises.resolve4(hostname)
    .then(addresses => {
      if (addresses && addresses.length > 0) {
        callback(null, addresses[0], 4);
      } else {
        callback(new Error(`No IPv4 address found for ${hostname}`));
      }
    })
    .catch(err => {
      dns.lookup(hostname, { family: 4, all: false }, callback);
    });
};

const emailUser = 'cudaters.verify@gmail.com';
const emailPassword = 'krylrfhkncafrgvu';

console.log('🧪 Testing Gmail SMTP Connection');
console.log('================================');
console.log('Email:', emailUser);
console.log('Password (first 5 chars):', emailPassword.substring(0, 5) + '***');
console.log('');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  family: 4,
  lookup: dnsLookup,
  auth: {
    user: emailUser,
    pass: emailPassword
  },
  connectionTimeout: 15000,
  socketTimeout: 15000,
  tls: {
    rejectUnauthorized: true
  }
});

console.log('📬 Verifying SMTP connection...\n');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Failed!');
    console.error('Error Code:', error.code || 'UNKNOWN');
    console.error('Error Message:', error.message);
    console.error('Error Details:', {
      command: error.command || 'N/A',
      responseCode: error.responseCode || 'N/A',
      response: error.response || 'N/A'
    });
    console.error('\n📋 Troubleshooting:');
    
    const code = error.code || '';
    const msg = error.message || '';
    
    if (code.includes('EAUTH') || msg.includes('535') || msg.toLowerCase().includes('auth')) {
      console.error('   → This is an AUTH error. The password might be wrong.');
      console.error('   → Check Gmail app password is correctly set.');
    } else if (code.includes('TIMEOUT') || msg.toLowerCase().includes('timeout')) {
      console.error('   → Connection timeout. Network or firewall issue.');
    } else if (code.includes('ECONNREFUSED')) {
      console.error('   → Connection refused. Gmail SMTP might be blocked.');
    }
    
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection Verified Successfully!');
    console.log('\n📧 Sending test OTP email...\n');
    
    const testOtp = '123456';
    const mailOptions = {
      from: 'cudaters.verify@gmail.com',
      to: emailUser, // Send to self for testing
      subject: '[TEST] SeeU-Daters OTP: ' + testOtp,
      html: `<h1>Test OTP: ${testOtp}</h1><p>This is a test email.</p>`,
      text: `Test OTP: ${testOtp}`
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Email Send Failed!');
        console.error('Error Code:', error.code || 'UNKNOWN');
        console.error('Error Message:', error.message);
        console.error('Full Error:', error);
        process.exit(1);
      } else {
        console.log('✅ Email Sent Successfully!');
        console.log('Message ID:', info.messageId);
        console.log('\n📬 Test email should arrive in inbox shortly.');
        process.exit(0);
      }
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      console.error('\n⏱️ Email send timed out (10 second timeout)');
      process.exit(1);
    }, 10000);
  }
});

// Timeout for verification after 10 seconds
setTimeout(() => {
  console.error('\n⏱️ SMTP verification timed out (10 second timeout)');
  process.exit(1);
}, 10000);
