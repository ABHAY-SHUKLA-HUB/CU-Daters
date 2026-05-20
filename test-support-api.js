import axios from 'axios';

const ADMIN_EMAIL = 'admin@cudaters.com';
const ADMIN_PASSWORD = 'AdminPassword123!';
const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
  try {
    console.log('--- Step 1: Login via /api/auth/admin-login ---');
    const loginRes = await axios.post(\/auth/admin-login, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const token = loginRes.data.data.token || loginRes.data.token;
    console.log('Login successful. Token acquired.');

    const config = { headers: { Authorization: \Bearer \\ } };

    console.log('\n--- Step 2: Fetch Support Requests ---');
    const listRes = await axios.get(\/admin/support/requests, config);
    const requests = listRes.data.data?.requests || listRes.data.requests || [];
    console.log(Fetched \ requests.);
    console.log('Sample request structure:', JSON.stringify(requests[0] || {}, null, 2));

    if (requests.length > 0) {
      const targetId = requests[0]._id;
      console.log(\\n--- Step 3: Get Details for Request \ ---\);
      const detailRes = await axios.get(\/admin/support/requests/\, config);
      console.log('Detail data:', JSON.stringify(detailRes.data.data || detailRes.data, null, 2));

      console.log(\\n--- Step 4: Try to Accept/Update Request \ ---\);
      const updateRes = await axios.patch(\/admin/support/requests/\, {
        status: 'in_progress'
      }, config);
      console.log('Update result:', JSON.stringify(updateRes.data, null, 2));
    }
  } catch (err) {
    console.error('Error occurred:', err.response?.data || err.message);
  }
}

runTest();
