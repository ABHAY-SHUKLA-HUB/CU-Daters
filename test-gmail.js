import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'cudaters.verify@gmail.com',
    pass: 'jexofrzjfnaxavva'
  }
});

console.log('🔧 Testing Gmail SMTP credentials...\n');

transporter.verify((err, success) => {
  if (err) {
    console.log('❌ ERROR: Gmail credentials INVALID!');
    console.log('   Error:', err.message);
    console.log('   Code:', err.code);
    console.log('\n📝 YOUR GMAIL APP PASSWORD IS WRONG!');
    console.log('\nFIX HERE: https://myaccount.google.com/apppasswords');
    console.log('   1. Login to myaccount.google.com');
    console.log('   2. Go to "Security" tab');
    console.log('   3. Find "App passwords" (need 2FA enabled)');
    console.log('   4. Select: Mail + Windows');
    console.log('   5. Copy the 16-digit password');
    console.log('   6. Replace in .env: GMAIL_PASSWORD=<new-password>');
    console.log('   7. Restart backend');
    process.exit(1);
  } else {
    console.log('✅ SUCCESS! Gmail is WORKING CORRECTLY!');
    console.log('   The app password is valid');
    console.log('   Emails will send successfully');
    process.exit(0);
  }
});
