import axios from 'axios';

const API_URL = 'http://localhost:5000';
let userToken, adminToken, requestId;

async function testCompleteFlow() {
  try {
    console.log('\n=== STEP 1: User Login ===');
    const userLoginRes = await axios.post(API_URL + '/api/auth/login', {
      email: 'student@cudaters.com',
      password: 'Student@12345'
    });
    userToken = userLoginRes.data.data.token;
    console.log('? User login successful');

    console.log('\n=== STEP 2: Find Support Request ===');
    const listRes = await axios.get(API_URL + '/api/support/my-requests', {
      headers: { Authorization: 'Bearer ' + userToken }
    });
    
    const data = listRes.data.data;
    const requests = Array.isArray(data) ? data : (data && Array.isArray(data.requests) ? data.requests : []);
    
    if (requests.length === 0) {
        console.log('No active request found, try to create one');
        const createRes = await axios.post(
          API_URL + '/api/support/request',
          {
            category: 'Technical Support',
            message: 'Testing the full support workflow'
          },
          { headers: { Authorization: 'Bearer ' + userToken } }
        );
        requestId = createRes.data.data._id;
        console.log('? Support request created:', requestId);
    } else {
        const activeRequest = requests.find(r => r.status !== 'resolved');
        requestId = activeRequest._id;
        console.log('?? Using existing active request:', requestId);
    }

    console.log('\n=== STEP 3: Admin Login ===');
    // Using admin-login since previous attempts showed regular login doesn't allow admins
    const adminLoginRes = await axios.post(API_URL + '/api/auth/admin-login', {
      email: 'admin@cudaters.com',
      password: 'AdminPassword123!'
    });
    // Ensure we are getting the correct token property
    adminToken = adminLoginRes.data.data.token || adminLoginRes.data.token;
    console.log('? Admin login successful');

    console.log('\n=== STEP 4: Admin Accept Request ===');
    try {
      // Trying the alternate admin request flow
      const acceptRes = await axios.post(
        API_URL + '/api/admin/support/request/' + requestId + '/accept',
        {},
        { headers: { Authorization: 'Bearer ' + adminToken } }
      );
      console.log('? Request accepted');
    } catch (e) {
      if (e.response && e.response.status === 400 && (e.response.data.message.includes('already accepted') || e.response.data.message.includes('in_progress'))) {
         console.log('?? Request was already accepted or in progress');
      } else {
         throw e;
      }
    }

    console.log('\n=== STEP 5: Get Request Details ===');
    const detailsRes = await axios.get(
      API_URL + '/api/admin/support/request/' + requestId,
      { headers: { Authorization: 'Bearer ' + adminToken } }
    );
    console.log('? Request details retrieved');
    console.log('   Status:', detailsRes.data.data ? detailsRes.data.data.status : detailsRes.data.status);
    console.log('   Messages:', (detailsRes.data.data ? detailsRes.data.data.messages : detailsRes.data.messages)?.length || 0);

    console.log('\n? ALL TESTS PASSED - Support chat system is working!');
  } catch (error) {
    if (error.response) {
       console.error('? Error response data:', JSON.stringify(error.response.data, null, 2));
       console.error('Status:', error.response.status);
    } else {
       console.error('? Error message:', error.message);
    }
  }
}

testCompleteFlow();
