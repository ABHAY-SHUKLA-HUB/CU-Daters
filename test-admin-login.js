import fetch from 'node-fetch';

const testAdminLogin = async () => {
  try {
    console.log('🔐 Testing admin login via /admin-login...\n');
    
    const response = await fetch('http://localhost:5000/api/auth/admin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@cudaters.com',
        password: 'AdminPassword123!'
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Admin login successful!');
      console.log(`🔑 Token: ${data.data.token.substring(0, 50)}...`);
      console.log(`👤 User: ${data.data.user.name} (${data.data.user.role})`);
      
      // Now test the support requests API
      console.log('\n📋 Fetching support requests...\n');
      const supportResponse = await fetch('http://localhost:5000/api/support/admin/requests', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.data.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const supportData = await supportResponse.json();
      console.log('✅ Support Requests Response:');
      console.log(JSON.stringify(supportData, null, 2));
      
      if (supportData.success && supportData.data.length > 0) {
        console.log(`\n✅ Found ${supportData.data.length} support request(s)!`);
        supportData.data.forEach((req, idx) => {
          console.log(`\n[${idx + 1}] Request: ${req._id}`);
          console.log(`    User: ${req.userName} (${req.userEmail})`);
          console.log(`    Category: ${req.category}`);
          console.log(`    Status: ${req.status}`);
          console.log(`    Description: ${req.description.substring(0, 80)}...`);
        });
      }
      
    } else {
      console.log('❌ Login failed:', data.message);
      console.log('Details:', data);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
};

testAdminLogin();
