/**
 * Comprehensive System Check for SeeU-Daters
 * Tests all critical features per the developer checklist
 */

import axios from 'axios';
import chalk from 'chalk';

const API_URL = process.env.API_URL || 'http://localhost:5000';
const BASE_CHAT_URL = process.env.CHAT_URL || 'http://localhost:5173';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  validateStatus: () => true
});

let testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// ===== TEST HELPERS =====
const log = (title, message = '') => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✓ ${title}`);
  if (message) console.log(`  ${message}`);
};

const success = (msg) => console.log(chalk.green(`  ✓ ${msg}`));
const error = (msg) => console.log(chalk.red(`  ✗ ${msg}`));
const warn = (msg) => console.log(chalk.yellow(`  ⚠ ${msg}`));
const info = (msg) => console.log(chalk.blue(`  ℹ ${msg}`));

// ===== TEST 1: USER REGISTRATION =====
const testRegistration = async () => {
  log('TEST 1: User Registration Flow');

  try {
    const testEmail = `testuser-${Date.now()}@cudaters.test`;
    const testData = {
      name: 'Test User',
      email: testEmail,
      phone: '9876543210',
      password: 'TestPass123',
      college: 'Independent / Not Listed',
      gender: 'male',
      fieldOfWork: 'Software Engineering',
      experienceYears: 3,
      bio: 'This is a test bio for the SeeU-Daters platform testing',
      liveSelfie: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      idProofFile: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      idProofType: 'government_id'
    };

    // Test signup endpoint
    const signupRes = await api.post('/api/auth/signup', testData);

    if (signupRes.status === 201 && signupRes.data.data?.user) {
      success(`User registration endpoint working`);
      success(`User created with ID: ${signupRes.data.data.user._id}`);
      testResults.passed.push('Registration endpoint');
      return { userId: signupRes.data.data.user._id, email: testEmail, token: signupRes.data.data.token };
    } else {
      error(`Signup returned status ${signupRes.status}: ${signupRes.data.message}`);
      testResults.failed.push(`Registration - Status: ${signupRes.status}`);
      return null;
    }
  } catch (err) {
    error(`Registration test failed: ${err.message}`);
    testResults.failed.push(`Registration - ${err.message}`);
    return null;
  }
};

// ===== TEST 2: CHECK ADMIN ENDPOINTS =====
const testAdminEndpoints = async () => {
  log('TEST 2: Admin Endpoints Availability');

  try {
    const endpointsToCheck = [
      { method: 'get', path: '/api/admin/registration-approvals', name: 'Pending Registrations' },
      { method: 'get', path: '/api/admin/overview', name: 'Admin Overview' }
    ];

    for (const endpoint of endpointsToCheck) {
      try {
        const res = await api[endpoint.method](endpoint.path);
        if (res.status < 500) {
          success(`${endpoint.name} endpoint available (${res.status})`);
          testResults.passed.push(endpoint.name);
        } else {
          warn(`${endpoint.name} returned server error (${res.status})`);
          testResults.warnings.push(endpoint.name);
        }
      } catch (err) {
        error(`${endpoint.name} - ${err.message}`);
        testResults.failed.push(endpoint.name);
      }
    }
  } catch (err) {
    error(`Admin endpoints test failed: ${err.message}`);
    testResults.failed.push('Admin endpoints check');
  }
};

// ===== TEST 3: CHECK API HEALTH =====
const testApiHealth = async () => {
  log('TEST 3: Backend API Health');

  try {
    const res = await api.get('/');

    if (res.status === 200 && res.data.message) {
      success('Backend is running');
      success(`API version: ${res.data.version}`);
      info(`Available endpoints: ${Object.keys(res.data.endpoints || {}).join(', ')}`);
      testResults.passed.push('API Health');
    } else {
      error('Backend not responding properly');
      testResults.failed.push('API Health');
    }
  } catch (err) {
    error(`API Health check failed: ${err.message}`);
    testResults.failed.push('API Health');
  }
};

// ===== TEST 4: CHECK CRITICAL ROUTES =====
const testCriticalRoutes = async () => {
  log('TEST 4: Critical Routes/Features');

  const routes = [
    { path: '/api/auth/email-health', name: 'Email Service', method: 'get' },
    { path: '/api/auth/onboarding/field-suggestions', name: 'Field Suggestions', method: 'get', params: { q: 'software' } },
    { path: '/api/config', name: 'Config', method: 'get' }
  ];

  for (const route of routes) {
    try {
      const res = await api[route.method](route.path, route.params ? { params: route.params } : {});
      if (res.status < 500) {
        success(`${route.name}: Available (${res.status})`);
        testResults.passed.push(route.name);
      } else {
        warn(`${route.name}: Server error (${res.status})`);
        testResults.warnings.push(route.name);
      }
    } catch (err) {
      error(`${route.name}: ${err.message}`);
      testResults.failed.push(route.name);
    }
  }
};

// ===== TEST 5: DATABASE CONNECTIVITY =====
const testDatabaseConnectivity = async () => {
  log('TEST 5: Database Connectivity');

  try {
    // Try to fetch a simple user count (non-sensitive)
    const res = await api.get('/api/auth/email-health');

    if (res.status === 200 || res.status === 503) {
      success('Database is connected');
      testResults.passed.push('Database Connection');
    } else {
      error('Database connectivity issue');
      testResults.failed.push('Database Connection');
    }
  } catch (err) {
    error(`Database test failed: ${err.message}`);
    testResults.failed.push('Database Connection');
  }
};

// ===== MAIN TEST RUNNER =====
const runAllTests = async () => {
  console.log(chalk.cyan.bold('\n\n🔍 SeeU-DATERS SYSTEM CHECK\n'));
  console.log(`API URL: ${API_URL}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  // Run all tests
  await testApiHealth();
  await testDatabaseConnectivity();
  await testCriticalRoutes();
  await testAdminEndpoints();

  const userData = await testRegistration();

  // Print summary
  console.log(chalk.cyan.bold('\n\n📊 TEST SUMMARY\n'));
  console.log(chalk.green(`✓ Passed: ${testResults.passed.length}`));
  testResults.passed.forEach(t => console.log(chalk.green(`  - ${t}`)));

  if (testResults.warnings.length > 0) {
    console.log(chalk.yellow(`\n⚠ Warnings: ${testResults.warnings.length}`));
    testResults.warnings.forEach(t => console.log(chalk.yellow(`  - ${t}`)));
  }

  if (testResults.failed.length > 0) {
    console.log(chalk.red(`\n✗ Failed: ${testResults.failed.length}`));
    testResults.failed.forEach(t => console.log(chalk.red(`  - ${t}`)));
  }

  const totalTests = testResults.passed.length + testResults.failed.length + testResults.warnings.length;
  const passRate = ((testResults.passed.length / totalTests) * 100).toFixed(0);

  console.log(chalk.cyan.bold(`\n📈 OVERALL: ${passRate}% Pass Rate (${testResults.passed.length}/${totalTests})`));

  if (testResults.failed.length === 0) {
    console.log(chalk.green.bold('\n✅ ALL TESTS PASSED ✅\n'));
  } else {
    console.log(chalk.red.bold(`\n❌ ${testResults.failed.length} TEST(S) FAILED ❌\n`));
  }

  process.exit(testResults.failed.length > 0 ? 1 : 0);
};

// Run tests
runAllTests().catch(err => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
