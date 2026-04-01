/**
 * SIMPLIFIED TEST: User Registration & Admin Approval Flow
 * This script tests the core workflow without complex session handling
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@cudaters.com';
const ADMIN_PASSWORD = 'AdminPassword123';

// Create simple test image
const createTestImage = () => {
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x03, 0x00, 0x01, 0x5b, 0x6e, 0x6b, 0xd5, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);
  return 'data:image/png;base64,' + png.toString('base64');
};

let csrfToken = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

// Add interceptor to include CSRF token in all requests
api.interceptors.request.use((config) => {
  if (csrfToken && ['PUT', 'POST', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase())) {
    config.headers['x-csrf-token'] = csrfToken;
  }
  return config;
});

// Extract CSRF token from responses
api.interceptors.response.use(
  (response) => {
    if (response.data?.data?.csrfToken) {
      csrfToken = response.data.data.csrfToken;
    }
    return response;
  },
  (error) => {
    if (error.response?.data?.data?.csrfToken) {
      csrfToken = error.response.data.data.csrfToken;
    }
    return Promise.reject(error);
  }
);

let passed = 0;
let failed = 0;

const log = {
  h1: (msg) => console.log(`\n${'='.repeat(70)}\n  ${msg}\n${'='.repeat(70)}`),
  h2: (msg) => console.log(`\n${'─'.repeat(70)}\n  ${msg}\n${'─'.repeat(70)}`),
  success: (msg) => { console.log(`✅ ${msg}`); passed++; },
  error: (msg, data) => { console.error(`❌ ${msg}`); data && console.error(JSON.stringify(data, null, 2)); failed++; },
  info: (msg) => console.log(`ℹ️  ${msg}`)
};

const runTests = async () => {
  log.h1('USER REGISTRATION & ADMIN APPROVAL FLOW - SIMPLIFIED TEST');

  const testImage = createTestImage();
  const timestamp = Date.now();
  let approvedUserId = null;
  let rejectedUserId = null;

  try {
    // TEST 1: Register User (Approval)
    log.h2('TEST 1: Register User for Approval');
    
    const user1Data = {
      name: `Approve Test ${timestamp}`,
      email: `approve-${timestamp}@test.local`,
      phone: Math.floor(1000000000 + Math.random() * 8999999999).toString().slice(0, 10),
      password: 'TestPass123!',
      college: 'IIT Delhi',
      gender: 'female',
      fieldOfWork: 'Engineering',
      experienceYears: 2,
      bio: 'Test profile for approval workflow with sufficient characters for validation.'
    };

    log.info('Creating user: ' + user1Data.email);
    const reg1 = await api.post('/api/auth/signup', {
      ...user1Data,
      liveSelfie: testImage,
      idProofFile: testImage,
      idProofType: 'student_id'
    });

    if (reg1.data?.data?.user?.status === 'pending') {
      approvedUserId = reg1.data.data.user._id;
      log.success(`User created and pending: ${user1Data.email}`);
    } else {
      throw new Error(`User not pending: ${reg1.data?.data?.user?.status}`);
    }

    // TEST 2: Register User (Rejection)
    log.h2('TEST 2: Register Another User for Rejection');
    
    const user2Data = {
      name: `Reject Test ${timestamp}`,
      email: `reject-${timestamp}@test.local`,
      phone: Math.floor(1000000000 + Math.random() * 8999999999).toString().slice(0, 10),
      password: 'TestPass123!',
      college: 'IIT Bombay',
      gender: 'male',
      fieldOfWork: 'Management',
      experienceYears: 3,
      bio: 'Test profile created for rejection workflow testing with enough characters.'
    };

    log.info('Creating user: ' + user2Data.email);
    const reg2 = await api.post('/api/auth/signup', {
      ...user2Data,
      liveSelfie: testImage,
      idProofFile: testImage,
      idProofType: 'government_id'
    });

    if (reg2.data?.data?.user?.status === 'pending') {
      rejectedUserId = reg2.data.data.user._id;
      log.success(`User created and pending: ${user2Data.email}`);
    } else {
      throw new Error(`User not pending: ${reg2.data?.data?.user?.status}`);
    }

    // TEST 3: Admin Login
    log.h2('TEST 3: Admin Login');
    
    log.info('Logging in as admin...');
    const adminLogin = await api.post('/api/admin/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (!adminLogin.data?.data?.token) {
      throw new Error('Admin login failed');
    }

    const adminToken = adminLogin.data.data.token;
    api.defaults.headers['Authorization'] = `Bearer ${adminToken}`;
    log.success('Admin logged in successfully');

    // TEST 4: Get Pending Registrations
    log.h2('TEST 4: Fetch Pending Registrations');
    
    const pending = await api.get('/api/admin/registration-approvals');
    
    if (!Array.isArray(pending.data?.data?.data)) {
      throw new Error('Failed to fetch pending registrations');
    }

    const pendingCount = pending.data.data.data.length;
    const user1Found = pending.data.data.data.some(u => u._id === approvedUserId);
    const user2Found = pending.data.data.data.some(u => u._id === rejectedUserId);

    log.success(`Fetched ${pendingCount} pending registrations`);
    log.success(`Test user 1 (for approval) in list: ${user1Found ? 'YES ✓' : 'NO'}`);
    log.success(`Test user 2 (for rejection) in list: ${user2Found ? 'YES ✓' : 'NO'}`);

    if (!user1Found || !user2Found) {
      throw new Error('One or both test users not found in pending list');
    }

    // TEST 5: Approve First User
    log.h2('TEST 5: Admin Approves First User');
    
    log.info('Approving user...');
    
    // Try approval without PIN requirement first
    try {
      const approve = await api.put(
        `/api/admin/registrations/${approvedUserId}/approve`,
        { adminNotes: 'Test approval from automated script' }
      );
      
      if (approve.data?.data?.status === 'active') {
        log.success(`User approved successfully and is now active`);
      } else {
        throw new Error(`Unexpected status after approval: ${approve.data?.data?.status}`);
      }
    } catch (approveError) {
      if (approveError.response?.status === 403 && approveError.response?.data?.message?.includes('PIN')) {
        log.error('Admin PIN required but not set in test. Trying with PIN...', approveError.response.data);
        // Retry with PIN header
        const approve = await api.put(
          `/api/admin/registrations/${approvedUserId}/approve`,
          { adminNotes: 'Test approval from automated script' },
          {
            headers: {
              'x-admin-pin': '1234'
            }
          }
        );
        if (approve.data?.data?.status === 'active') {
          log.success(`User approved successfully with PIN`);
        } else {
          throw approveError;
        }
      } else {
        throw approveError;
      }
    }

    // TEST 6: Verify User No Longer Pending
    log.h2('TEST 6: Verify Approved User Not in Pending List');
    
    const pendingAfter = await api.get('/api/admin/registration-approvals');
    const stillPending = pendingAfter.data.data.data.some(u => u._id === approvedUserId);
    
    if (!stillPending) {
      log.success('User removed from pending queue after approval');
    } else {
      log.error('User still in pending queue', { userId: approvedUserId });
    }

    // TEST 7: Reject Second User
    log.h2('TEST 7: Admin Rejects Second User');
    
    log.info('Rejecting user...');
    
    try {
      const reject = await api.put(
        `/api/admin/registrations/${rejectedUserId}/reject`,
        { reason: 'Test rejection from automated testing' }
      );

      if (reject.data?.data?.status === 'rejected') {
        log.success(`User rejected successfully`);
      } else {
        throw new Error(`Unexpected status after rejection: ${reject.data?.data?.status}`);
      }
    } catch (rejectError) {
      if (rejectError.response?.status === 403 && rejectError.response?.data?.message?.includes('PIN')) {
        const reject = await api.put(
          `/api/admin/registrations/${rejectedUserId}/reject`,
          { reason: 'Test rejection from automated testing' },
          {
            headers: {
              'x-admin-pin': '1234'
            }
          }
        );
        if (reject.data?.data?.status === 'rejected') {
          log.success(`User rejected successfully with PIN`);
        } else {
          throw rejectError;
        }
      } else {
        throw rejectError;
      }
    }

    // TEST 8: Approved User Can Login
    log.h2('TEST 8: Approved User Can Login');
    
    log.info('Testing approved user login...');
    const userLogin = await api.post('/api/auth/login', {
      email: user1Data.email,
      password: user1Data.password
    });

    if (userLogin.data?.data?.user?.status === 'active') {
      log.success('Approved user can login successfully');
    } else {
      throw new Error('Approved user login failed or status not active');
    }

    // TEST 9: Rejected User Cannot Login
    log.h2('TEST 9: Rejected User Cannot Login');
    
    log.info('Testing rejected user login (should fail)...');
    try {
      await api.post('/api/auth/login', {
        email: user2Data.email,
        password: user2Data.password
      });
      log.error('Rejected user was able to login (should have failed)');
    } catch (loginError) {
      if (loginError.response?.status === 401 || loginError.response?.status === 403) {
        log.success('Rejected user cannot login (as expected)');
      } else {
        throw loginError;
      }
    }

    // FINAL SUMMARY
    log.h1(`TEST COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    
    if (failed === 0) {
      console.log('\n🎉 SUCCESS! All tests passed!\n');
      console.log('✅ User registration with document uploads working');
      console.log('✅ Pending users appear in admin panel');
      console.log('✅ Admin can approve registrations');
      console.log('✅ Admin can reject registrations');
      console.log('✅ Approved users can login');
      console.log('✅ Rejected users cannot access platform\n');
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed. Review errors above.\n`);
      process.exit(1);
    }

  } catch (error) {
    log.error('Test failed with exception', error.response?.data || error.message);
    log.h1(`TEST SUMMARY: ${passed} PASSED, ${failed + 1} FAILED`);
    console.log('\n❌ Test execution failed.\n');
    process.exit(1);
  }
};

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
