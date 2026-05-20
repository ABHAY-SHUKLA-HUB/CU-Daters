import axios from 'axios';

const ADMIN_EMAIL = 'admin@cudaters.com';
const ADMIN_PASSWORD = 'AdminPassword123!';
const BASE_URL = 'http://localhost:5000/api';

async function testAdminSupport() {
  try {
    console.log('--- Step 1: Login as Admin ---');
    const loginResponse = await axios.post(BASE_URL + '/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    console.log('Login Status:', loginResponse.status);
    const token = loginResponse.data.token;
    if (!token) {
      throw new Error('No token received');
    }
    console.log('Token received successfully');

    const config = {
      headers: { Authorization: 'Bearer ' + token }
    };

    console.log('\n--- Step 2: Fetch Support Requests ---');
    const requestsResponse = await axios.get(BASE_URL + '/admin/support/requests', config);
    console.log('Fetch Status:', requestsResponse.status);
    
    const requests = requestsResponse.data.requests || requestsResponse.data;
    console.log('Number of requests:', Array.isArray(requests) ? requests.length : 'N/A');

    const pendingRequest = Array.isArray(requests) ? requests.find(r => r.status === 'pending') : null;

    if (pendingRequest) {
      console.log('\n--- Step 3: Handle Pending Request ---');
      const requestId = pendingRequest._id;
      console.log('Found pending request: ' + requestId);
      
      const actionResponse = await axios.patch(BASE_URL + '/admin/support/requests/' + requestId, {
        status: 'resolved',
        resolutionNote: 'Handled via test script'
      }, config);
      
      console.log('Action Status:', actionResponse.status);
      console.log('Action Response:', JSON.stringify(actionResponse.data, null, 2));
    } else {
      console.log('\n--- Step 3: No pending requests found to test action ---');
    }

  } catch (error) {
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

testAdminSupport();
