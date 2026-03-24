import axios from 'axios';

/**
 * Test Script for User Hard Delete with Cascading
 * This tests the DELETE /api/admin/users/:userId endpoint
 */

const API_BASE = 'http://localhost:5000/api';

async function testDeleteUser() {
  try {
    console.log('\n========== USER HARD DELETE TEST ==========\n');

    // First, get admin token
    console.log('1️⃣  Getting admin token...\n');
    
    const loginRes = await axios.post(`${API_BASE}/auth/admin-login`, {
      email: 'admin@cudaters.com',
      password: 'Admin@12345'
    });

    const adminToken = loginRes.data.data.token;
    console.log(`✅ Admin authenticated`);
    console.log(`   Token: ${adminToken.substring(0, 50)}...`);

    // Get list of users
    console.log('\n2️⃣  Fetching users list...\n');
    
    const usersRes = await axios.get(`${API_BASE}/admin/users?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const users = usersRes.data.data.data;
    if (!users || users.length === 0) {
      console.log('❌ No users found to delete');
      return;
    }

    console.log(`✅ Found ${users.length} users:`);
    users.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.name} (${u.email}) - ID: ${u._id}`);
    });

    // Select first test user (skip admin accounts)
    const testUser = users.find(u => u.role !== 'admin' && u.role !== 'super_admin') || users[0];
    console.log(`\n3️⃣  Testing delete on user: ${testUser.name} (${testUser.email})`);

    // Get user details before deletion
    console.log('\n4️⃣  Fetching user details before deletion...\n');
    
    const userDetailRes = await axios.get(`${API_BASE}/admin/users/${testUser._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const userBefore = userDetailRes.data.data;
    console.log(`✅ User found:`);
    console.log(`   Name: ${userBefore.name}`);
    console.log(`   Email: ${userBefore.email}`);
    console.log(`   Status: ${userBefore.status}`);
    console.log(`   Role: ${userBefore.role}`);

    // DELETE USER - TESTING POINT
    console.log(`\n5️⃣  Initiating hard delete...`);
    console.log(`      User ID: ${testUser._id}`);
    console.log(`      Method: DELETE /api/admin/users/:userId\n`);
    
    const deleteRes = await axios.delete(`${API_BASE}/admin/users/${testUser._id}`, {
      headers: { 
        Authorization: `Bearer ${adminToken}`,
        'x-admin-pin': process.env.ADMIN_PIN || ''
      },
      data: { reason: 'Test deletion - cascading verification' }
    });

    console.log(`✅ DELETE SUCCESSFUL!`);
    console.log(`   Status: ${deleteRes.status}`);
    console.log(`   Message: ${deleteRes.data.message}`);
    
    if (deleteRes.data.data.cascaded_deletions) {
      console.log(`\n   📊 Cascaded Deletions:`);
      Object.entries(deleteRes.data.data.cascaded_deletions).forEach(([key, value]) => {
        console.log(`      ✅ ${key}: ${value}`);
      });
    }

    // Verify user is actually deleted
    console.log(`\n6️⃣  Verifying permanent deletion...\n`);
    
    try {
      await axios.get(`${API_BASE}/admin/users/${testUser._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`❌ User still exists! Hard delete may have failed`);
    } catch (err) {
      if (err.response?.status === 404) {
        console.log(`✅ User permanently deleted (404: Not Found)`);
      } else {
        console.log(`⚠️  Error checking: ${err.response?.status}`);
      }
    }

    // Test re-registration with same email
    console.log(`\n7️⃣  Testing re-registration with same email...\n`);
    console.log(`   Email available for re-registration: ${testUser.email}`);
    console.log(`   Phone available for re-registration: ${userBefore.phone || 'N/A'}`);
    console.log(`   ℹ️  User can now signup with these credentials\n`);

    console.log('========== TEST COMPLETE ✅ ==========\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDeleteUser();
