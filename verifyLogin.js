import axios from 'axios';

async function verifyLogin() {
  try {
    console.log('\n🧪 Verifying login with new credentials...\n');
    
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testuser@seeudaters.in',
      password: 'Password123'
    });

    console.log('✅ LOGIN SUCCESSFUL!\n');
    console.log(`Token: ${res.data.data.token.substring(0, 50)}...`);
    console.log(`User: ${res.data.data.user.name}`);
    console.log(`Email: ${res.data.data.user.email}`);
    console.log(`Status: ${res.data.data.user.status}`);
    console.log(`Role: ${res.data.data.user.role}`);
  } catch (err) {
    console.log('❌ Login failed:', err.response?.data?.message || err.message);
  }
}

verifyLogin();

