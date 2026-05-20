import axios from 'axios';

const testAdminSupport = async () => {
    const loginUrl = 'http://localhost:5000/api/auth/admin-login';
    const requestsUrl = 'http://localhost:5000/api/admin/support/requests';
    
    try {
        console.log('--- Step 1: Admin Login ---');
        const loginResponse = await axios.post(loginUrl, {
            email: 'admin@cudaters.com',
            password: 'AdminPassword123!'
        });
        
        console.log('Login Status:', loginResponse.status);
        const data = loginResponse.data.data;
        const token = data ? data.token : null;
        
        if (!token) {
            console.error('No token received in login response');
            console.log('Response data:', JSON.stringify(loginResponse.data, null, 2));
            return;
        }
        
        console.log('Login successful. Token acquired.');

        console.log('\n--- Step 2: Fetch Support Requests ---');
        const requestsResponse = await axios.get(requestsUrl, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        console.log('Requests Status:', requestsResponse.status);
        if (Array.isArray(requestsResponse.data)) {
            console.log('Number of requests:', requestsResponse.data.length);
        } else if (requestsResponse.data.requests) {
             console.log('Number of requests:', requestsResponse.data.requests.length);
        }
        console.log('Requests details:', JSON.stringify(requestsResponse.data, null, 2));

    } catch (error) {
        console.error('\n--- Error Occurred ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
    }
};

testAdminSupport();
