/**
 * PosalPro MVP2 - Authenticated Selective Hydration Performance Test
 * Tests selective hydration optimization with real authentication
 * Production-ready pattern with proper auth token handling
 */

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  // Test user credentials (should match seeded data)
  credentials: {
    email: 'admin@posalpro.com',
    password: 'Admin123!',
    role: 'Administrator',
  },
  endpoints: [
    {
      name: 'Proposals API',
      path: '/api/proposals',
      fieldTests: [
        { fields: 'id,title,status', description: 'Core Fields Only' },
        { fields: 'id,title,status,createdAt,updatedAt', description: 'Extended Core' },
        { fields: 'id,title,status,customer,products', description: 'With Relations' },
        { fields: undefined, description: 'Full Response' },
      ],
    },
    {
      name: 'Users API',
      path: '/api/users',
      fieldTests: [
        { fields: 'id,name,email', description: 'Basic User Info' },
        { fields: 'id,name,email,role,department', description: 'User Profile' },
        {
          fields: 'id,name,email,role,department,lastLoginAt,isActive',
          description: 'Extended Profile',
        },
        { fields: undefined, description: 'Full Response' },
      ],
    },
    {
      name: 'Customers API',
      path: '/api/customers',
      fieldTests: [
        { fields: 'id,name,email', description: 'Basic Customer Info' },
        { fields: 'id,name,email,company,status', description: 'Customer Overview' },
        { fields: 'id,name,email,company,status,address,phone', description: 'Contact Details' },
        { fields: undefined, description: 'Full Response' },
      ],
    },
  ],
};

// Performance metrics calculator
class PerformanceAnalyzer {
  constructor() {
    this.results = [];
  }

  measurePerformance(name, responseTime, responseSize, fieldsRequested, actualFields) {
    const result = {
      name,
      responseTime,
      responseSize,
      fieldsRequested: fieldsRequested || 'all',
      actualFields: actualFields || 0,
      timestamp: new Date().toISOString(),
    };
    this.results.push(result);
    return result;
  }

  generateSummary() {
    const summary = {
      totalTests: this.results.length,
      averageResponseTime:
        this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length,
      totalDataTransferred: this.results.reduce((sum, r) => sum + r.responseSize, 0),
      optimizationResults: {},
    };

    // Group by endpoint for comparison
    const byEndpoint = {};
    this.results.forEach(result => {
      const endpointName = result.name.split(' - ')[0];
      if (!byEndpoint[endpointName]) {
        byEndpoint[endpointName] = [];
      }
      byEndpoint[endpointName].push(result);
    });

    // Calculate optimization percentages
    Object.keys(byEndpoint).forEach(endpoint => {
      const tests = byEndpoint[endpoint];
      const fullResponse = tests.find(t => t.fieldsRequested === 'all');

      if (fullResponse) {
        const optimizedTests = tests.filter(t => t.fieldsRequested !== 'all');

        summary.optimizationResults[endpoint] = optimizedTests.map(test => ({
          description: test.name.split(' - ')[1],
          responseTimeImprovement: (
            ((fullResponse.responseTime - test.responseTime) / fullResponse.responseTime) *
            100
          ).toFixed(1),
          dataSizeReduction: (
            ((fullResponse.responseSize - test.responseSize) / fullResponse.responseSize) *
            100
          ).toFixed(1),
          absoluteTimeSaving: fullResponse.responseTime - test.responseTime,
          absoluteSizeSaving: fullResponse.responseSize - test.responseSize,
        }));
      }
    });

    return summary;
  }
}

// Authentication manager
class AuthenticationManager {
  constructor() {
    this.sessionCookie = null;
    this.csrfToken = null;
  }

  async authenticate(credentials) {
    try {
      console.log('🔐 Authenticating with NextAuth...');

      // First, get CSRF token
      const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!csrfResponse.ok) {
        throw new Error(`CSRF request failed: ${csrfResponse.status}`);
      }

      const csrfData = await csrfResponse.json();
      this.csrfToken = csrfData.csrfToken;
      console.log('✅ CSRF token obtained');

      // Attempt to sign in using NextAuth callback
      const signInResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: credentials.email,
          password: credentials.password,
          csrfToken: this.csrfToken,
          callbackUrl: `${BASE_URL}/dashboard`,
          json: 'true',
        }).toString(),
        redirect: 'manual',
      });

      // Extract session cookie from response
      const cookies = signInResponse.headers.get('set-cookie');
      if (cookies) {
        const sessionMatch = cookies.match(/next-auth\.session-token=([^;]+)/);
        if (sessionMatch) {
          this.sessionCookie = `next-auth.session-token=${sessionMatch[1]}`;
          console.log('✅ Session cookie obtained');
          return true;
        }
      }

      // Alternative: Check if we got redirected to success page
      if (signInResponse.status === 302 || signInResponse.status === 200) {
        const location = signInResponse.headers.get('location');
        if (location && !location.includes('error')) {
          console.log('✅ Authentication successful (redirect detected)');
          return true;
        }
      }

      console.warn('⚠️ Standard authentication failed, continuing with session-based testing');
      return false;
    } catch (error) {
      console.error('❌ Authentication error:', error.message);
      return false;
    }
  }

  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.sessionCookie) {
      headers['Cookie'] = this.sessionCookie;
    }

    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    return headers;
  }
}

// API tester with authentication
class AuthenticatedAPITester {
  constructor(authManager) {
    this.authManager = authManager;
    this.analyzer = new PerformanceAnalyzer();
  }

  async testEndpoint(endpoint, fieldTest) {
    const startTime = Date.now();

    try {
      // Build URL with query parameters
      const url = new URL(`${BASE_URL}${endpoint.path}`);
      if (fieldTest.fields) {
        url.searchParams.set('fields', fieldTest.fields);
      }
      url.searchParams.set('limit', '20'); // Standard limit for consistent testing

      console.log(`📡 Testing: ${endpoint.name} - ${fieldTest.description}`);
      console.log(`   URL: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.authManager.getAuthHeaders(),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!response.ok) {
        console.log(`   ❌ Status: ${response.status} ${response.statusText}`);
        if (response.status === 401) {
          console.log('   🔒 Authentication required - endpoint properly secured');
        } else if (response.status === 403) {
          console.log('   🚫 Access forbidden - insufficient permissions');
        }
        return null;
      }

      const data = await response.json();
      const responseSize = JSON.stringify(data).length;
      const actualFields = this.countFields(data);

      console.log(
        `   ✅ Success: ${responseTime}ms, ${responseSize} bytes, ${actualFields} fields`
      );

      return this.analyzer.measurePerformance(
        `${endpoint.name} - ${fieldTest.description}`,
        responseTime,
        responseSize,
        fieldTest.fields,
        actualFields
      );
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      console.log(`   ❌ Error after ${responseTime}ms: ${error.message}`);
      return null;
    }
  }

  countFields(data) {
    if (!data || typeof data !== 'object') return 0;

    if (Array.isArray(data)) {
      return data.length > 0 ? this.countFields(data[0]) : 0;
    }

    if (data.data && Array.isArray(data.data)) {
      return data.data.length > 0 ? this.countFields(data.data[0]) : 0;
    }

    if (data.data && typeof data.data === 'object') {
      return Object.keys(data.data).length;
    }

    return Object.keys(data).length;
  }

  async runAllTests() {
    console.log('🚀 Starting Authenticated Selective Hydration Performance Tests\n');

    for (const endpoint of TEST_CONFIG.endpoints) {
      console.log(`\n📊 Testing ${endpoint.name}`);
      console.log('─'.repeat(50));

      for (const fieldTest of endpoint.fieldTests) {
        await this.testEndpoint(endpoint, fieldTest);

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return this.analyzer.generateSummary();
  }
}

// Main test execution
async function runAuthenticatedTests() {
  console.log('🎯 PosalPro MVP2 - Authenticated Selective Hydration Test');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Time: ${new Date().toLocaleString()}\n`);

  // Initialize authentication
  const authManager = new AuthenticationManager();
  const tester = new AuthenticatedAPITester(authManager);

  // Attempt authentication
  const authSuccess = await authManager.authenticate(TEST_CONFIG.credentials);
  if (!authSuccess) {
    console.log('⚠️ Authentication failed - continuing with unauthenticated testing');
    console.log('   Note: All authenticated endpoints will return 401 status');
  }

  // Run performance tests
  const summary = await tester.runAllTests();

  // Display results
  console.log('\n📈 PERFORMANCE SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms`);
  console.log(`Total Data Transferred: ${summary.totalDataTransferred.toLocaleString()} bytes`);

  Object.keys(summary.optimizationResults).forEach(endpoint => {
    const results = summary.optimizationResults[endpoint];
    if (results.length > 0) {
      console.log(`\n🎯 ${endpoint} Optimization Results:`);
      results.forEach(result => {
        console.log(`   ${result.description}:`);
        console.log(`     ⚡ Response Time: ${result.responseTimeImprovement}% faster`);
        console.log(`     📦 Data Size: ${result.dataSizeReduction}% smaller`);
        console.log(
          `     💾 Savings: ${result.absoluteTimeSaving}ms, ${result.absoluteSizeSaving} bytes`
        );
      });
    }
  });

  console.log('\n🔧 NEXT STEPS FOR PRODUCTION:');
  console.log('1. Set up proper authentication tokens');
  console.log('2. Configure role-based field access controls');
  console.log('3. Implement caching strategies for optimized responses');
  console.log('4. Monitor performance metrics in production environment');
  console.log('5. Set up alerts for performance degradation');

  return summary;
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAuthenticatedTests, AuthenticationManager, AuthenticatedAPITester };
} else {
  // Run if executed directly
  runAuthenticatedTests().catch(console.error);
}
