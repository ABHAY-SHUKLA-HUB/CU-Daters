import { sendOtpEmail } from './utils/emailService.js';

async function testDirectEmail() {
  try {
    console.log('🧪 Testing direct email to krishnamdwivedi17@gmail.com...\n');
    
    const result = await sendOtpEmail('krishnamdwivedi17@gmail.com', '123456');
    
    console.log('\n✅ Email sent successfully!');
    console.log('Response:', result);
    
  } catch (error) {
    console.error('\n❌ Error sending email:');
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
  
  process.exit(0);
}

testDirectEmail();
