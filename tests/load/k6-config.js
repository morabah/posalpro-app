/**
 * K6 Load Testing Configuration for PosalPro MVP2
 * Implements QA standards for performance, load, soak, and spike testing
 */

import http from 'k6/http';
import { logInfo } from '@/lib/logger';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for QA compliance
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test scenarios implementing QA standards
export const options = {
  scenarios: {
    // Smoke test (basic functionality)
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { test_type: 'smoke' },
    },

    // Performance test (QA standard: p95 <=300ms, error rate <=0.1%)
    performance: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      tags: { test_type: 'performance' },
    },

    // Load test (QA standard: 2× expected peak, <5% degradation)
    load: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 50 },   // Ramp up to 50 users
        { duration: '3m', target: 50 },   // Stay at 50 users
        { duration: '1m', target: 100 },  // Ramp up to 100 users (2× expected peak)
        { duration: '3m', target: 100 },  // Stay at 100 users
        { duration: '1m', target: 0 },    // Ramp down
      ],
      tags: { test_type: 'load' },
    },

    // Soak test (QA standard: 8h run, memory growth <=5%)
    soak: {
      executor: 'constant-vus',
      vus: 20,
      duration: '8h',
      tags: { test_type: 'soak' },
    },

    // Spike test (QA standard: 3× spike recovers, breakpoint documented)
    spike: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 10 },   // Baseline
        { duration: '10s', target: 30 },  // Spike to 3× (30 users)
        { duration: '1m', target: 30 },   // Stay at spike
        { duration: '10s', target: 10 },  // Recover to baseline
        { duration: '1m', target: 10 },   // Stay at baseline
      ],
      tags: { test_type: 'spike' },
    },

    // Stress test (breakpoint discovery)
    stress: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '1m', target: 25 },
        { duration: '1m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '1m', target: 200 },
        { duration: '1m', target: 400 },
      ],
      tags: { test_type: 'stress' },
    },
  },

  thresholds: {
    // QA standard: error rate <=0.1%
    http_req_failed: ['rate<0.001'],

    // QA standard: p95 <=300ms for core endpoints
    http_req_duration: ['p(95)<300'],

    // Custom error rate metric
    errors: ['rate<0.001'],
  },
};

// Test data and configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// User credentials for authenticated tests
const TEST_USERS = [
  { email: 'test@example.com', password: 'TestPassword123!' },
  { email: 'qa@example.com', password: 'QaPassword123!' },
  // Add more test users as needed
];

// Core business flows to test (QA standard: login + CRUD core object)
const testFlows = {
  authentication: () => testAuthentication(),
  dashboard: () => testDashboard(),
  products: () => testProductManagement(),
  proposals: () => testProposalManagement(),
  admin: () => testAdminFunctions(),
};

// Helper functions
function getRandomUser() {
  return TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
}

function makeRequest(method, url, options = {}) {
  const startTime = new Date().getTime();
  const response = http.request(method, url, options.body, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    timeout: '30s',
  });
  const endTime = new Date().getTime();

  // Track custom metrics
  responseTime.add(endTime - startTime);
  errorRate.add(response.status >= 400);

  return response;
}

// Test implementations
function testAuthentication() {
  const user = getRandomUser();

  // Login
  const loginResponse = makeRequest('POST', `${API_BASE}/auth/login`, {
    body: JSON.stringify({
      email: user.email,
      password: user.password,
    }),
  });

  check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login has session token': (r) => r.json().sessionToken !== undefined,
  });

  if (loginResponse.status === 200) {
    const sessionToken = loginResponse.json().sessionToken;

    // Test authenticated endpoint
    const profileResponse = makeRequest('GET', `${API_BASE}/profile`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    check(profileResponse, {
      'profile access is 200': (r) => r.status === 200,
    });
  }
}

function testDashboard() {
  const user = getRandomUser();

  // Get dashboard data
  const dashboardResponse = makeRequest('GET', `${API_BASE}/dashboard/enhanced-stats`);

  check(dashboardResponse, {
    'dashboard data is 200': (r) => r.status === 200,
    'dashboard has required fields': (r) => {
      const data = r.json();
      return data.totalProposals !== undefined &&
             data.activeProposals !== undefined &&
             data.revenue !== undefined;
    },
  });
}

function testProductManagement() {
  // List products
  const listResponse = makeRequest('GET', `${API_BASE}/products?limit=20`);

  check(listResponse, {
    'products list is 200': (r) => r.status === 200,
    'products has data array': (r) => Array.isArray(r.json().data),
  });

  // Get single product
  if (listResponse.status === 200 && listResponse.json().data?.length > 0) {
    const productId = listResponse.json().data[0].id;
    const productResponse = makeRequest('GET', `${API_BASE}/products/${productId}`);

    check(productResponse, {
      'single product is 200': (r) => r.status === 200,
      'product has required fields': (r) => {
        const product = r.json();
        return product.id && product.name && product.price;
      },
    });
  }
}

function testProposalManagement() {
  // List proposals
  const listResponse = makeRequest('GET', `${API_BASE}/proposals?limit=20`);

  check(listResponse, {
    'proposals list is 200': (r) => r.status === 200,
  });

  // Create proposal (if authenticated)
  const user = getRandomUser();
  const loginResponse = makeRequest('POST', `${API_BASE}/auth/login`, {
    body: JSON.stringify({
      email: user.email,
      password: user.password,
    }),
  });

  if (loginResponse.status === 200) {
    const sessionToken = loginResponse.json().sessionToken;

    const createResponse = makeRequest('POST', `${API_BASE}/proposals`, {
      body: JSON.stringify({
        title: `Load Test Proposal ${Date.now()}`,
        description: 'Test proposal for load testing',
        value: 10000,
        status: 'draft',
      }),
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    check(createResponse, {
      'proposal creation is 201': (r) => r.status === 201,
    });

    // Cleanup: Delete test proposal
    if (createResponse.status === 201) {
      const proposalId = createResponse.json().id;
      makeRequest('DELETE', `${API_BASE}/proposals/${proposalId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
    }
  }
}

function testAdminFunctions() {
  // Test admin endpoints (may require admin user)
  const adminResponse = makeRequest('GET', `${API_BASE}/admin/users?limit=10`);

  // Note: This may return 403 for non-admin users, which is expected
  check(adminResponse, {
    'admin endpoint responds': (r) => r.status !== 500, // Should not crash
  });
}

// Main test execution
export default function () {
  // Execute all core flows
  Object.values(testFlows).forEach(flow => {
    flow();
  });

  // Random sleep between 1-3 seconds to simulate real user behavior
  sleep(Math.random() * 2 + 1);
}

// Setup function for test initialization
export function setup() {
  logInfo('Starting K6 load test for PosalPro MVP2', { component: path.basename('logInfo('Debug output', { component: path.basename('logInfo('Starting K6 load test for PosalPro MVP2', { component: 'k6-config' })', path.extname('logInfo('Starting K6 load test for PosalPro MVP2', { component: 'k6-config' })')), data: 'Starting K6 load test for PosalPro MVP2' })', path.extname('logInfo('Debug output', { component: path.basename('logInfo('Starting K6 load test for PosalPro MVP2', { component: 'k6-config' })', path.extname('logInfo('Starting K6 load test for PosalPro MVP2', { component: 'k6-config' })')), data: 'Starting K6 load test for PosalPro MVP2' })')) });
  logInfo('Target: ${BASE_URL}', { component: path.basename('logInfo('Debug output', { component: path.basename('logInfo('Target: ${BASE_URL}', { component: 'k6-config' })', path.extname('logInfo('Target: ${BASE_URL}', { component: 'k6-config' })')), data: `Target: ${BASE_URL}` })', path.extname('logInfo('Debug output', { component: path.basename('logInfo('Target: ${BASE_URL}', { component: 'k6-config' })', path.extname('logInfo('Target: ${BASE_URL}', { component: 'k6-config' })')), data: `Target: ${BASE_URL}` })')) });
  logInfo('QA Standards: p95 <=300ms, error rate <=0.1%', { component: path.basename('logInfo('Debug output', { component: path.basename('logInfo('QA Standards: p95 <=300ms, error rate <=0.1%', { component: 'k6-config' })', path.extname('logInfo('QA Standards: p95 <=300ms, error rate <=0.1%', { component: 'k6-config' })')), data: 'QA Standards: p95 <=300ms, error rate <=0.1%' })', path.extname('logInfo('Debug output', { component: path.basename('logInfo('QA Standards: p95 <=300ms, error rate <=0.1%', { component: 'k6-config' })', path.extname('logInfo('QA Standards: p95 <=300ms, error rate <=0.1%', { component: 'k6-config' })')), data: 'QA Standards: p95 <=300ms, error rate <=0.1%' })')) });

  // Verify service is available
  const healthCheck = makeRequest('GET', `${API_BASE}/health`);
  if (healthCheck.status !== 200) {
    console.error('Service health check failed. Aborting test.');
    return;
  }

  return { timestamp: new Date().toISOString() };
}

// Teardown function for test cleanup
export function teardown(data) {
  logInfo('K6 load test completed', { component: path.basename('logInfo('Debug output', { component: path.basename('logInfo('K6 load test completed', { component: 'k6-config' })', path.extname('logInfo('K6 load test completed', { component: 'k6-config' })')), data: 'K6 load test completed' })', path.extname('logInfo('Debug output', { component: path.basename('logInfo('K6 load test completed', { component: 'k6-config' })', path.extname('logInfo('K6 load test completed', { component: 'k6-config' })')), data: 'K6 load test completed' })')) });
  logInfo('Started: ${data.timestamp}', { component: path.basename('logInfo('Debug output', { component: path.basename('logInfo('Started: ${data.timestamp}', { component: 'k6-config' })', path.extname('logInfo('Started: ${data.timestamp}', { component: 'k6-config' })')), data: `Started: ${data.timestamp}` })', path.extname('logInfo('Debug output', { component: path.basename('logInfo('Started: ${data.timestamp}', { component: 'k6-config' })', path.extname('logInfo('Started: ${data.timestamp}', { component: 'k6-config' })')), data: `Started: ${data.timestamp}` })')) });
  logInfo('Ended: ${new Date().toISOString()}', { component: path.basename('logInfo('Debug output', { component: path.basename('logInfo('Debug output', { component: 'k6-config', data: `Ended: ${new Date( })', path.extname('logInfo('Ended: ${new Date()', { component: 'k6-config' })), data: `Ended: ${new Date( }).toISOString()}`)', path.extname('logInfo('Debug output', { component: path.basename('logInfo('Debug output', { component: 'k6-config', data: `Ended: ${new Date( })', path.extname('logInfo('Ended: ${new Date()', { component: 'k6-config' })), data: `Ended: ${new Date( }).toISOString()}`)')) });
}

// Handle summary for custom reporting
export function handleSummary(data) {
  const summary = {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'test-results/k6-results.json': JSON.stringify(data, null, 2),
    'test-results/k6-summary.html': htmlReport(data),
  };

  // QA compliance check
  const p95 = data.metrics.http_req_duration?.values?.p95 || 0;
  const errorRate = data.metrics.http_req_failed?.values?.rate || 0;

  logInfo('\n=== QA COMPLIANCE CHECK ===', { component: path.basename('logInfo('Debug output', { component: path.basename('logInfo('\n=== QA COMPLIANCE CHECK ===', { component: 'k6-config' })', path.extname('logInfo('\n=== QA COMPLIANCE CHECK ===', { component: 'k6-config' })')), data: '\n=== QA COMPLIANCE CHECK ===' })', path.extname('logInfo('Debug output', { component: path.basename('logInfo('\n=== QA COMPLIANCE CHECK ===', { component: 'k6-config' })', path.extname('logInfo('\n=== QA COMPLIANCE CHECK ===', { component: 'k6-config' })')), data: '\n=== QA COMPLIANCE CHECK ===' })')) });
  logInfo('P95 Response Time: ${p95}ms (Target: ≤300ms)', { component: path.basename('logInfo('Debug output', { component: path.basename('logInfo('Debug output', { component: 'k6-config', data: `P95 Response Time: ${p95}ms (Target: ≤300ms })', path.extname('logInfo('P95 Response Time: ${p95}ms (Target: ≤300ms)', { component: 'k6-config' })), data: `P95 Response Time: ${p95}ms (Target: ≤300ms })`)', path.extname('logInfo('Debug output', { component: path.basename('logInfo('Debug output', { component: 'k6-config', data: `P95 Response Time: ${p95}ms (Target: ≤300ms })', path.extname('logInfo('P95 Response Time: ${p95}ms (Target: ≤300ms)', { component: 'k6-config' })), data: `P95 Response Time: ${p95}ms (Target: ≤300ms })`)')) });
  logInfo('Error Rate: ${(errorRate * 100).toFixed(3)}% (Target: ≤0.1%)', { component: path.basename('logInfo('Debug output', { component: path.basename('logInfo('Debug output', { component: 'k6-config', data: `Error Rate: ${(errorRate * 100 })', path.extname('logInfo('Error Rate: ${(errorRate * 100)', { component: 'k6-config' })), data: `Error Rate: ${(errorRate * 100 }).toFixed(3)}% (Target: ≤0.1%)`)', path.extname('logInfo('Debug output', { component: path.basename('logInfo('Debug output', { component: 'k6-config', data: `Error Rate: ${(errorRate * 100 })', path.extname('logInfo('Error Rate: ${(errorRate * 100)', { component: 'k6-config' })), data: `Error Rate: ${(errorRate * 100 }).toFixed(3)}% (Target: ≤0.1%)`)')) });

  if (p95 > 300) {
    logInfo('❌ P95 response time exceeds QA standard', { component: path.basename('logInfo('Debug output', { component: path.basename('logInfo('❌ P95 response time exceeds QA standard', { component: 'k6-config' })', path.extname('logInfo('❌ P95 response time exceeds QA standard', { component: 'k6-config' })')), data: '❌ P95 response time exceeds QA standard' })', path.extname('logInfo('Debug output', { component: path.basename('logInfo('❌ P95 response time exceeds QA standard', { component: 'k6-config' })', path.extname('logInfo('❌ P95 response time exceeds QA standard', { component: 'k6-config' })')), data: '❌ P95 response time exceeds QA standard' })')) });
  } else {
    logInfo('✅ P95 response time meets QA standard', { component: path.basename('logInfo('Debug output', { component: path.basename('logInfo('✅ P95 response time meets QA standard', { component: 'k6-config' })', path.extname('logInfo('✅ P95 response time meets QA standard', { component: 'k6-config' })')), data: '✅ P95 response time meets QA standard' })', path.extname('logInfo('Debug output', { component: path.basename('logInfo('✅ P95 response time meets QA standard', { component: 'k6-config' })', path.extname('logInfo('✅ P95 response time meets QA standard', { component: 'k6-config' })')), data: '✅ P95 response time meets QA standard' })')) });
  }

  if (errorRate > 0.001) {
    logInfo('❌ Error rate exceeds QA standard', { component: path.basename('logInfo('Debug output', { component: path.basename('logInfo('❌ Error rate exceeds QA standard', { component: 'k6-config' })', path.extname('logInfo('❌ Error rate exceeds QA standard', { component: 'k6-config' })')), data: '❌ Error rate exceeds QA standard' })', path.extname('logInfo('Debug output', { component: path.basename('logInfo('❌ Error rate exceeds QA standard', { component: 'k6-config' })', path.extname('logInfo('❌ Error rate exceeds QA standard', { component: 'k6-config' })')), data: '❌ Error rate exceeds QA standard' })')) });
  } else {
    logInfo('✅ Error rate meets QA standard', { component: path.basename('logInfo('Debug output', { component: path.basename('logInfo('✅ Error rate meets QA standard', { component: 'k6-config' })', path.extname('logInfo('✅ Error rate meets QA standard', { component: 'k6-config' })')), data: '✅ Error rate meets QA standard' })', path.extname('logInfo('Debug output', { component: path.basename('logInfo('✅ Error rate meets QA standard', { component: 'k6-config' })', path.extname('logInfo('✅ Error rate meets QA standard', { component: 'k6-config' })')), data: '✅ Error rate meets QA standard' })')) });
  }

  return summary;
}

// HTML report generator
function htmlReport(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>PosalPro MVP2 Load Test Results</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .metric { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
            .pass { color: green; }
            .fail { color: red; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <h1>PosalPro MVP2 Load Test Results</h1>
        <p><strong>Test Date:</strong> ${new Date().toISOString()}</p>
        <p><strong>Target URL:</strong> ${BASE_URL}</p>

        <h2>QA Compliance</h2>
        <div class="metric">
            <strong>P95 Response Time:</strong> ${data.metrics.http_req_duration?.values?.p95 || 0}ms
            <span class="${(data.metrics.http_req_duration?.values?.p95 || 0) <= 300 ? 'pass' : 'fail'}">
                (${(data.metrics.http_req_duration?.values?.p95 || 0) <= 300 ? 'PASS' : 'FAIL'} - Target: ≤300ms)
            </span>
        </div>
        <div class="metric">
            <strong>Error Rate:</strong> ${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(3)}%
            <span class="${(data.metrics.http_req_failed?.values?.rate || 0) <= 0.001 ? 'pass' : 'fail'}">
                (${(data.metrics.http_req_failed?.values?.rate || 0) <= 0.001 ? 'PASS' : 'FAIL'} - Target: ≤0.1%)
            </span>
        </div>

        <h2>Detailed Metrics</h2>
        <table>
            <tr><th>Metric</th><th>Value</th><th>Status</th></tr>
            <tr>
                <td>HTTP Request Duration (avg)</td>
                <td>${data.metrics.http_req_duration?.values?.avg || 0}ms</td>
                <td>-</td>
            </tr>
            <tr>
                <td>HTTP Requests</td>
                <td>${data.metrics.http_reqs?.values?.count || 0}</td>
                <td>-</td>
            </tr>
            <tr>
                <td>Failed Requests</td>
                <td>${data.metrics.http_req_failed?.values?.count || 0}</td>
                <td>-</td>
            </tr>
        </table>
    </body>
    </html>
  `;
}
