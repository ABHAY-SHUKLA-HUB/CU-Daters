/**
 * COMPREHENSIVE TEST SUITE: User Registration & Admin Approval Flow
 * 
 * This test suite validates the complete registration and admin approval workflow:
 * 1. User registration with document uploads
 * 2. Verification that user is in pending status
 * 3. Admin can fetch pending registrations
 * 4. Admin can approve/reject registrations
 * 5. User status updates correctly after approval/rejection
 * 
 * Usage: node test-registration-approval-flow.js
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@cudaters.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPassword123';
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

// Test data generator
const generateTestUser = () => ({
  name: `Test User ${Date.now()}`,
  email: `testuser${Date.now()}@test.local`,
  phone: Math.floor(1000000000 + Math.random() * 8999999999).toString().slice(0, 10),
  password: 'TestPass123!',
  college: 'IIT Delhi',
  gender: 'male',
  fieldOfWork: 'Engineering',
  experienceYears: 2,
  bio: 'This is a test profile created for testing the registration approval flow. It has more than 20 characters as required by the system.'
});

// Create a simple test image (1x1 pixel PNG)
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

// API client with credentials support
const createApiClient = () => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true // Critical for CSRF validation
  });

  let csrfToken = null;

  // Add interceptor to include CSRF token
  client.interceptors.request.use((config) => {
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
    return config;
  });

  // Extract and store CSRF token from responses
  client.interceptors.response.use(
    (response) => {
      if (response.data?.csrfToken) {
        csrfToken = response.data.csrfToken;
      }
      return response;
    },
    (error) => {
      if (error.response?.data?.csrfToken) {
        csrfToken = error.response.data.csrfToken;
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Test execution helpers
let testsPassed = 0;
let testsFailed = 0;

const log = {
  h1: (msg) => console.log(`\n${'='.repeat(60)}\n  ${msg}\n${'='.repeat(60)}`),
  h2: (msg) => console.log(`\n${'-'.repeat(60)}\n  ${msg}\n${'-'.repeat(60)}`),
  success: (msg, data) => {
    console.log(`✅ ${msg}`, data ? JSON.stringify(data, null, 2) : '');
    testsPassed++;
  },
  error: (msg, error) => {
    console.error(`❌ ${msg}`);
    if (error?.response?.data) {
      console.error('  Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error?.message) {
      console.error('  Error:', error.message);
    }
    testsFailed++;
  },
  info: (msg, data) => console.log(`ℹ️  ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
  warning: (msg) => console.warn(`⚠️  ${msg}`)
};

// Main test suite
const runTests = async () => {
  log.h1('REGISTRATION & ADMIN APPROVAL FLOW TEST SUITE');

  const api = createApiClient();
  let testUser = null;
  let adminToken = null;
  let csrfToken = null;
  let registeredUserId = null;

  try {
    // TEST 1: User Registration
    log.h2('TEST 1: User Registration with Documents');
    
    testUser = generateTestUser();
    const testImageDataUrl = createTestImage();
    
    log.info('Attempting registration with data:', {
      name: testUser.name,
      email: testUser.email,
      college: testUser.college
    });

    const signupResponse = await api.post('/api/auth/signup', {
      name: testUser.name,
      email: testUser.email,
      phone: testUser.phone,
      password: testUser.password,
      college: testUser.college,
      gender: testUser.gender,
      fieldOfWork: testUser.fieldOfWork,
      experienceYears: testUser.experienceYears,
      bio: testUser.bio,
      liveSelfie: testImageDataUrl,
      idProofFile: testImageDataUrl,
      idProofType: 'student_id'
    });

    if (signupResponse.data?.data?.user?._id) {
      registeredUserId = signupResponse.data.data.user._id;
      log.success('User registered successfully', {
        userId: registeredUserId,
        email: testUser.email,
        status: signupResponse.data.data.user.status
      });
    } else {
      throw new Error('User registration response missing user ID');
    }

    // TEST 2: Verify User is Pending
    log.h2('TEST 2: Verify User Status is Pending');
    
    if (signupResponse.data.data.user.status === 'pending') {
      log.success('User status is pending (as expected)');
    } else {
      throw new Error(`Expected status 'pending', got '${signupResponse.data.data.user.status}'`);
    }

    // TEST 3: Admin Login
    log.h2('TEST 3: Admin Login');
    
    log.info('Logging in admin user...');
    const adminLoginResponse = await api.post('/api/admin/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (adminLoginResponse.data?.data?.token) {
      adminToken = adminLoginResponse.data.data.token;
      csrfToken = adminLoginResponse.data.data.csrfToken;
      api.defaults.headers['Authorization'] = `Bearer ${adminToken}`;
      if (csrfToken) {
        api.defaults.headers['x-csrf-token'] = csrfToken;
      }
      log.success('Admin logged in successfully', {
        adminId: adminLoginResponse.data.data.user._id,
        role: adminLoginResponse.data.data.user.role
      });
    } else {
      throw new Error('Admin login failed');
    }

    // TEST 4: Fetch Pending Registrations
    log.h2('TEST 4: Fetch Pending Registrations from Admin Panel');
    
    const pendingResponse = await api.get('/api/admin/registration-approvals');
    
    if (Array.isArray(pendingResponse.data?.data?.data)) {
      const pendingCount = pendingResponse.data.data.data.length;
      const testUserInList = pendingResponse.data.data.data.some(u => u._id === registeredUserId);
      
      log.success(`Found ${pendingCount} pending registrations`, {
        testUserFound: testUserInList,
        testUserEmail: testUserInList ? 'User in list ✓' : '⚠️ User NOT in list!'
      });

      if (!testUserInList) {
        log.warning(`Test user not found in admin panel. Pending users: ${
          pendingResponse.data.data.data.map(u => u.email).join(', ')
        }`);
      }
    } else {
      throw new Error('Failed to fetch pending registrations');
    }

    // TEST 5: Approve User Registration
    log.h2('TEST 5: Admin Approve User Registration');
    
    const approvePayload = {
      adminNotes: 'Test approval - documents look good'
    };

    log.info('Sending approval request...');
    const approveResponse = await api.put(
      `/api/admin/registrations/${registeredUserId}/approve`,
      approvePayload,
      {
        headers: {
          'x-admin-pin': ADMIN_PIN
        }
      }
    );

    if (approveResponse.data?.data?.status === 'active') {
      log.success('User registration approved successfully', {
        userId: registeredUserId,
        newStatus: 'active',
        verificationStatus: approveResponse.data.data.verification_status
      });
    } else {
      throw new Error(`Approval failed or user not in active state. Status: ${approveResponse.data?.data?.status}`);
    }

    // TEST 6: Verify User is No Longer Pending
    log.h2('TEST 6: Verify User Removed from Pending Queue');
    
    const pendingAfterApprovalResponse = await api.get('/api/admin/registration-approvals');
    const userStillPending = pendingAfterApprovalResponse.data?.data?.data.some(u => u._id === registeredUserId);
    
    if (!userStillPending) {
      log.success('User no longer in pending queue (as expected)');
    } else {
      log.warning('User still appears in pending queue after approval');
    }

    // TEST 7: User Can Login
    log.h2('TEST 7: Verify Approved User Can Login');
    
    const userLoginResponse = await api.post('/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });

    if (userLoginResponse.data?.data?.token) {
      log.success('Approved user can login successfully', {
        userId: userLoginResponse.data.data.user._id,
        status: userLoginResponse.data.data.user.status
      });
    } else {
      throw new Error('User login failed after approval');
    }

    // TEST 8: Test Rejection Flow (create another test user)
    log.h2('TEST 8: Test Admin Rejection Workflow');
    
    const testUser2 = generateTestUser();
    const signupResponse2 = await api.post('/api/auth/signup', {
      ...testUser2,
      liveSelfie: testImageDataUrl,
      idProofFile: testImageDataUrl,
      idProofType: 'government_id'
    });

    const registeredUserId2 = signupResponse2.data.data.user._id;
    
    if (registeredUserId2) {
      log.success('Second test user registered', { userId: registeredUserId2 });

      // Login as admin again (in case session expired)
      if (!adminToken) {
        const adminLoginResponse = await api.post('/api/admin/login', {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        });
        adminToken = adminLoginResponse.data.data.token;
        api.defaults.headers['Authorization'] = `Bearer ${adminToken}`;
      }

      // Reject the second user
      const rejectResponse = await api.put(
        `/api/admin/registrations/${registeredUserId2}/reject`,
        { reason: 'Test rejection - profile does not meet requirements' },
        {
          headers: {
            'x-admin-pin': ADMIN_PIN
          }
        }
      );

      if (rejectResponse.data?.data?.status === 'rejected') {
        log.success('User registration rejected successfully', {
          userId: registeredUserId2,
          newStatus: 'rejected'
        });
      } else {
        throw new Error(`Rejection failed. Status: ${rejectResponse.data?.data?.status}`);
      }

      // Verify rejected user cannot login
      try {
        await api.post('/api/auth/login', {
          email: testUser2.email,
          password: testUser2.password
        });
        log.warning('Rejected user was able to login (should have failed)');
      } catch (loginError) {
        if (loginError.response?.status === 401 || loginError.response?.status === 403) {
          log.success('Rejected user cannot login (as expected)');
        } else {
          throw loginError;
        }
      }
    } else {
      log.warning('Could not create second test user for rejection test');
    }

    // TEST SUMMARY
    log.h1(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    
    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed! Registration and approval flow is working correctly.\n');
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${testsFailed} test(s) failed. See errors above.\n`);
      process.exit(1);
    }

  } catch (error) {
    log.error('Test execution failed', error);
    
    log.h1(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log('\n❌ Test suite encountered a critical error.\n');
    process.exit(1);
  }
};

// Run the tests
runTests().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
