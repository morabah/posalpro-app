#!/usr/bin/env node

// Comprehensive Profile Update Test Script
// Based on lessons learned and successful customer/product creation patterns
const BASE_URL = 'http://localhost:3000';

const USER = {
  email: 'admin@posalpro.com',
  password: 'ProposalPro2024!',
};

// Complete profile test data (all fields from the UI form)
const COMPREHENSIVE_PROFILE_DATA = {
  firstName: 'System',
  lastName: 'Administrator',
  title: 'Chief Technology Officer',
  email: 'admin@posalpro.com',
  phone: '+1-555-0199',
  department: 'Information Technology',
  office: 'San Francisco HQ - Building A, Floor 12',
  languages: ['English', 'Spanish', 'French'],
  bio: 'Experienced system administrator with 15+ years in enterprise software development, cloud infrastructure, and cybersecurity. Specialized in scaling high-performance applications and leading technical teams.',
  profileImage: 'https://via.placeholder.com/150/0066CC/FFFFFF?text=SA',
  expertiseAreas: [
    'Technical Solutions',
    'Enterprise Software',
    'Government Contracts',
    'Cloud Infrastructure',
    'Cybersecurity',
    'Data Analytics',
  ],
};

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: 'Complete Profile Update',
    description: 'Update all profile fields with comprehensive data',
    data: COMPREHENSIVE_PROFILE_DATA,
  },
  {
    name: 'Minimal Profile Update',
    description: 'Update only required fields',
    data: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@posalpro.com',
      department: 'IT',
    },
  },
  {
    name: 'Partial Profile Update',
    description: 'Update some fields with special characters and edge cases',
    data: {
      firstName: "O'Connor",
      lastName: 'Smith-Jones',
      title: 'VP of R&D',
      email: 'admin@posalpro.com',
      phone: '+1 (555) 123-4567 ext. 890',
      department: 'Research & Development',
      bio: 'Expert in AI/ML, IoT, and blockchain technologies. "Innovation through collaboration."',
      languages: ['English', 'Mandarin', 'German'],
      expertiseAreas: ['Technical Solutions', 'Healthcare Industry', 'Manufacturing'],
    },
  },
];

// Performance and error tracking
const testResults = {
  startTime: Date.now(),
  scenarios: [],
  errors: [],
  performance: {},
  authentication: null,
  endpoints: {},
};

// Authentication using NextAuth pattern (similar to test-proposals-authenticated.js)
async function authenticateUser() {
  console.log('🔐 Authenticating user...');

  try {
    // Step 1: Get CSRF token
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    if (!csrfResponse.ok) {
      throw new Error(`CSRF request failed: ${csrfResponse.status}`);
    }

    const csrfData = await csrfResponse.json();
    if (!csrfData.csrfToken) {
      throw new Error('CSRF token not received');
    }

    console.log('✅ CSRF token obtained');

    // Step 2: Extract cookies from CSRF response
    const csrfCookies = csrfResponse.headers.get('set-cookie') || '';

    // Step 3: Authenticate with credentials
    const authResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: csrfCookies,
      },
      body: new URLSearchParams({
        email: USER.email,
        password: USER.password,
        csrfToken: csrfData.csrfToken,
        callbackUrl: `${BASE_URL}/admin`,
        json: 'true',
      }),
      redirect: 'manual', // Handle redirects manually
    });

    console.log(`🔑 Authentication response: ${authResponse.status}`);

    // Step 4: Extract session cookies
    const authCookies = authResponse.headers.get('set-cookie') || '';
    if (!authCookies) {
      throw new Error('No authentication cookies received');
    }

    // Combine and format cookies
    const allCookies = [csrfCookies, authCookies]
      .filter(Boolean)
      .join('; ')
      .split(',')
      .map(cookie => cookie.trim().split(';')[0])
      .join('; ');

    console.log('✅ Authentication successful');
    console.log(`🍪 Session cookies: ${allCookies.substring(0, 100)}...`);

    testResults.authentication = {
      success: true,
      cookiesLength: allCookies.length,
      timestamp: new Date().toISOString(),
    };

    return allCookies;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    testResults.authentication = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
    throw error;
  }
}

// Test profile GET endpoint
async function testProfileGet(cookies) {
  console.log('\n📖 Testing profile GET endpoint...');

  const startTime = Date.now();

  try {
    const response = await fetch(`${BASE_URL}/api/profile`, {
      method: 'GET',
      headers: {
        Cookie: cookies,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    const responseTime = Date.now() - startTime;
    console.log(`📊 GET Response: ${response.status} (${responseTime}ms)`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Current profile retrieved successfully');
      console.log(`📋 Profile data keys: ${Object.keys(data.data || {}).join(', ')}`);

      // Show current profile completeness
      if (data.data?.profileCompleteness !== undefined) {
        console.log(`📈 Current profile completeness: ${data.data.profileCompleteness}%`);
      }

      testResults.endpoints.get = {
        success: true,
        responseTime,
        status: response.status,
        profileCompleteness: data.data?.profileCompleteness,
      };

      return data.data;
    } else {
      const errorText = await response.text();
      console.log(`❌ GET failed: ${response.status} - ${errorText.substring(0, 200)}`);

      testResults.endpoints.get = {
        success: false,
        responseTime,
        status: response.status,
        error: errorText.substring(0, 200),
      };

      return null;
    }
  } catch (error) {
    console.error('❌ GET endpoint test failed:', error.message);
    testResults.endpoints.get = {
      success: false,
      error: error.message,
    };
    return null;
  }
}

// Test profile UPDATE endpoint with comprehensive data
async function testProfileUpdate(cookies, testData, scenarioName) {
  console.log(`\n🔄 Testing profile UPDATE: ${scenarioName}`);
  console.log(`📊 Updating ${Object.keys(testData).length} fields`);

  const startTime = Date.now();

  try {
    const response = await fetch(`${BASE_URL}/api/profile/update`, {
      method: 'PUT',
      headers: {
        Cookie: cookies,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const responseTime = Date.now() - startTime;
    console.log(`📊 UPDATE Response: ${response.status} (${responseTime}ms)`);

    const responseText = await response.text();
    let responseData = null;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.log('⚠️ Response is not valid JSON');
    }

    if (response.ok) {
      console.log('✅ Profile update successful!');

      if (responseData?.data) {
        console.log('📋 Updated fields verification:');
        const updatedFields = Object.keys(testData);
        updatedFields.forEach(field => {
          const sent = testData[field];
          const received = responseData.data[field];
          const match = JSON.stringify(sent) === JSON.stringify(received);
          console.log(`  ${field}: ${match ? '✅' : '❌'} ${match ? 'Updated' : 'Mismatch'}`);
          if (!match) {
            console.log(`    Sent: ${JSON.stringify(sent)}`);
            console.log(`    Received: ${JSON.stringify(received)}`);
          }
        });

        // Check profile completeness improvement
        if (responseData.data.profileCompleteness !== undefined) {
          console.log(`📈 New profile completeness: ${responseData.data.profileCompleteness}%`);
        }
      }

      const scenarioResult = {
        scenario: scenarioName,
        success: true,
        responseTime,
        status: response.status,
        fieldsUpdated: Object.keys(testData).length,
        profileCompleteness: responseData?.data?.profileCompleteness,
        timestamp: new Date().toISOString(),
      };

      testResults.scenarios.push(scenarioResult);
      return responseData;
    } else {
      console.log(`❌ Profile update failed: ${response.status}`);
      console.log(`📄 Error response: ${responseText.substring(0, 300)}`);

      // Try to parse error details
      if (responseData) {
        if (responseData.error) {
          console.log(`🔍 Error details: ${JSON.stringify(responseData.error, null, 2)}`);
        }
        if (responseData.validation) {
          console.log(`🔍 Validation errors: ${JSON.stringify(responseData.validation, null, 2)}`);
        }
      }

      const scenarioResult = {
        scenario: scenarioName,
        success: false,
        responseTime,
        status: response.status,
        error: responseText.substring(0, 300),
        timestamp: new Date().toISOString(),
      };

      testResults.scenarios.push(scenarioResult);
      testResults.errors.push(scenarioResult);

      return null;
    }
  } catch (error) {
    console.error(`❌ UPDATE test failed for ${scenarioName}:`, error.message);

    const scenarioResult = {
      scenario: scenarioName,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };

    testResults.scenarios.push(scenarioResult);
    testResults.errors.push(scenarioResult);

    return null;
  }
}

// Verify profile data persistence
async function verifyProfilePersistence(cookies, expectedData) {
  console.log('\n🔍 Verifying profile data persistence...');

  const currentProfile = await testProfileGet(cookies);

  if (!currentProfile) {
    console.log('❌ Could not retrieve profile for verification');
    return false;
  }

  const verificationResults = [];

  Object.keys(expectedData).forEach(field => {
    const expected = expectedData[field];
    const actual = currentProfile[field];
    const matches = JSON.stringify(expected) === JSON.stringify(actual);

    verificationResults.push({
      field,
      matches,
      expected,
      actual,
    });

    console.log(`  ${field}: ${matches ? '✅' : '❌'} ${matches ? 'Persisted' : 'Lost'}`);
  });

  const allPersisted = verificationResults.every(result => result.matches);
  console.log(
    `\n${allPersisted ? '✅' : '❌'} Profile persistence: ${allPersisted ? 'ALL FIELDS PERSISTED' : 'SOME FIELDS LOST'}`
  );

  return allPersisted;
}

// Database integration test
async function testDatabaseIntegration(cookies) {
  console.log('\n🗄️ Testing database integration...');

  try {
    // Test users endpoint (to verify database connectivity)
    const usersResponse = await fetch(`${BASE_URL}/api/users?limit=1`, {
      method: 'GET',
      headers: {
        Cookie: cookies,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Users API: ${usersResponse.status}`);

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Database integration working');
      console.log(`📊 User count: ${usersData.data?.length || 0}`);

      testResults.endpoints.database = {
        success: true,
        status: usersResponse.status,
        userCount: usersData.data?.length || 0,
      };

      return true;
    } else {
      console.log('❌ Database integration issue');
      testResults.endpoints.database = {
        success: false,
        status: usersResponse.status,
      };
      return false;
    }
  } catch (error) {
    console.error('❌ Database integration test failed:', error.message);
    testResults.endpoints.database = {
      success: false,
      error: error.message,
    };
    return false;
  }
}

// Generate comprehensive test report
function generateTestReport() {
  const totalTime = Date.now() - testResults.startTime;
  const successfulScenarios = testResults.scenarios.filter(s => s.success).length;
  const totalScenarios = testResults.scenarios.length;

  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE PROFILE UPDATE TEST REPORT');
  console.log('='.repeat(80));

  console.log(`⏱️ Total Test Duration: ${totalTime}ms`);
  console.log(
    `🔐 Authentication: ${testResults.authentication?.success ? '✅ Success' : '❌ Failed'}`
  );
  console.log(`📊 Scenarios Passed: ${successfulScenarios}/${totalScenarios}`);
  console.log(
    `🗄️ Database Integration: ${testResults.endpoints.database?.success ? '✅ Working' : '❌ Failed'}`
  );

  // Performance summary
  if (testResults.scenarios.length > 0) {
    const responseTimes = testResults.scenarios
      .filter(s => s.responseTime)
      .map(s => s.responseTime);

    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      console.log(`⚡ Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
      console.log(`⚡ Max Response Time: ${maxResponseTime}ms`);
    }
  }

  // Scenario results
  console.log('\n📋 Scenario Results:');
  testResults.scenarios.forEach(scenario => {
    const status = scenario.success ? '✅' : '❌';
    const time = scenario.responseTime ? `(${scenario.responseTime}ms)` : '';
    console.log(`  ${status} ${scenario.scenario} ${time}`);
    if (scenario.profileCompleteness !== undefined) {
      console.log(`     Profile Completeness: ${scenario.profileCompleteness}%`);
    }
  });

  // Error summary
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors Encountered:');
    testResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.scenario}: ${error.error || 'Unknown error'}`);
    });
  } else {
    console.log('\n✅ No errors encountered!');
  }

  // Overall assessment
  const overallSuccess =
    testResults.authentication?.success &&
    testResults.endpoints.database?.success &&
    successfulScenarios === totalScenarios;

  console.log('\n🎯 OVERALL ASSESSMENT:');
  if (overallSuccess) {
    console.log('✅ ALL TESTS PASSED - Profile update functionality is working correctly!');
    console.log('🚀 System is ready for production use');
  } else {
    console.log('❌ SOME TESTS FAILED - Profile update needs attention');
    console.log('🔧 Review errors above for debugging guidance');
  }

  console.log('='.repeat(80));

  // Save detailed results
  try {
    const fs = require('fs');
    const reportPath = 'profile-test-results.json';
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`📄 Detailed results saved to: ${reportPath}`);
  } catch (error) {
    console.log('⚠️ Could not save detailed results file');
  }
}

// Main test execution
async function runComprehensiveTest() {
  console.log('🚀 STARTING COMPREHENSIVE PROFILE UPDATE TEST');
  console.log('='.repeat(80));
  console.log(`📅 Test Started: ${new Date().toISOString()}`);
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log(`👤 User: ${USER.email}`);
  console.log(`📊 Test Scenarios: ${TEST_SCENARIOS.length}`);
  console.log('='.repeat(80));

  try {
    // Step 1: Authenticate
    const cookies = await authenticateUser();

    // Step 2: Test database integration
    await testDatabaseIntegration(cookies);

    // Step 3: Get initial profile state
    const initialProfile = await testProfileGet(cookies);

    // Step 4: Run all test scenarios
    for (const scenario of TEST_SCENARIOS) {
      await testProfileUpdate(cookies, scenario.data, scenario.name);

      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Step 5: Test persistence with the last scenario
    if (TEST_SCENARIOS.length > 0) {
      const lastScenario = TEST_SCENARIOS[TEST_SCENARIOS.length - 1];
      await verifyProfilePersistence(cookies, lastScenario.data);
    }

    // Step 6: Generate comprehensive report
    generateTestReport();
  } catch (error) {
    console.error('\n💥 CRITICAL TEST FAILURE:', error.message);
    console.log('\n🔧 Possible Issues:');
    console.log('  - Development server not running (npm run dev:smart)');
    console.log('  - Database connection issues');
    console.log('  - Authentication configuration problems');
    console.log('  - Network connectivity issues');

    generateTestReport();
    process.exit(1);
  }
}

// Execute the test
runComprehensiveTest();
