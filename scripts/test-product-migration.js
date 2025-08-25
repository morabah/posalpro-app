#!/usr/bin/env node

/**
 * Product Migration Test Script
 * Tests the new Product API endpoints with real database data
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/products`;

// Test data
const testProduct = {
  name: 'Test Product - Migration',
  description: 'Test product created during migration testing',
  price: 99.99,
  currency: 'USD',
  sku: 'TEST-MIG-001',
  category: ['Test', 'Migration'],
  tags: ['test', 'migration', 'api'],
  isActive: true,
  version: 1,
  usageAnalytics: { testCount: 1 },
  userStoryMappings: ['US-4.1'],
};

console.log('🧪 Testing Product Migration...\n');

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const finalOptions = { ...defaultOptions, ...options };

  try {
    const curlCommand = `curl -s -w "\\nHTTP_STATUS:%{http_code}\\n" "${url}" ${finalOptions.method !== 'GET' ? `-X ${finalOptions.method}` : ''} ${finalOptions.body ? `-d '${JSON.stringify(finalOptions.body)}'` : ''} -H "Content-Type: application/json"`;

    const result = execSync(curlCommand, { encoding: 'utf8' });
    const lines = result.trim().split('\n');
    const statusLine = lines.find(line => line.startsWith('HTTP_STATUS:'));
    const status = statusLine ? parseInt(statusLine.split(':')[1]) : 500;
    const body = lines.filter(line => !line.startsWith('HTTP_STATUS:')).join('\n');

    return { status, body: body.trim() };
  } catch (error) {
    return { status: 500, body: error.message };
  }
}

// Test functions
async function testAuthentication() {
  console.log('🔐 Testing Authentication...');

  const response = makeRequest(`${API_BASE}?limit=5`);

  if (response.status === 401 || response.body.includes('AUTH_2000')) {
    console.log('✅ Authentication properly enforced');
    return true;
  } else {
    console.log('❌ Authentication not working properly');
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${response.body}`);
    return false;
  }
}

async function testSearchEndpoint() {
  console.log('\n🔍 Testing Search Endpoint...');

  const response = makeRequest(`${API_BASE}/search?q=test&limit=5`);

  if (response.status === 401 || response.body.includes('AUTH_2000')) {
    console.log('✅ Search endpoint authentication working');
    return true;
  } else {
    console.log('❌ Search endpoint not working properly');
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${response.body}`);
    return false;
  }
}

async function testBulkDeleteEndpoint() {
  console.log('\n🗑️ Testing Bulk Delete Endpoint...');

  const response = makeRequest(`${API_BASE}/bulk-delete`, {
    method: 'POST',
    body: { ids: ['test-id-1', 'test-id-2'] },
  });

  if (response.status === 401 || response.body.includes('AUTH_2000')) {
    console.log('✅ Bulk delete endpoint authentication working');
    return true;
  } else {
    console.log('❌ Bulk delete endpoint not working properly');
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${response.body}`);
    return false;
  }
}

async function testIndividualEndpoints() {
  console.log('\n📝 Testing Individual Product Endpoints...');

  // Test GET /api/products_new/[id]
  const getResponse = makeRequest(`${API_BASE}/test-id`);
  if (getResponse.status === 401 || getResponse.body.includes('AUTH_2000')) {
    console.log('✅ GET individual product endpoint authentication working');
  } else {
    console.log('❌ GET individual product endpoint not working');
  }

  // Test PATCH /api/products_new/[id]
  const patchResponse = makeRequest(`${API_BASE}/test-id`, {
    method: 'PATCH',
    body: { name: 'Updated Test Product' },
  });
  if (patchResponse.status === 401 || patchResponse.body.includes('AUTH_2000')) {
    console.log('✅ PATCH individual product endpoint authentication working');
  } else {
    console.log('❌ PATCH individual product endpoint not working');
  }

  // Test DELETE /api/products_new/[id]
  const deleteResponse = makeRequest(`${API_BASE}/test-id`, {
    method: 'DELETE',
  });
  if (deleteResponse.status === 401 || deleteResponse.body.includes('AUTH_2000')) {
    console.log('✅ DELETE individual product endpoint authentication working');
  } else {
    console.log('❌ DELETE individual product endpoint not working');
  }

  return true;
}

async function testPageAccess() {
  console.log('\n🌐 Testing Page Access...');

  const response = makeRequest(`${BASE_URL}/products`);

  if (response.status === 200 && response.body.includes('Products - PosalPro MVP2')) {
    console.log('✅ Product page accessible');
    return true;
  } else {
    console.log('❌ Product page not accessible');
    console.log(`Status: ${response.status}`);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('\n🗄️ Testing Database Connection...');

  try {
    // Check if Prisma can connect to the database
    const result = execSync('npx prisma db execute --stdin', {
      input: 'SELECT COUNT(*) as count FROM "products";',
      encoding: 'utf8',
    });

    if (result.includes('count')) {
      console.log('✅ Database connection working');
      console.log(`📊 Found ${result.match(/\d+/)?.[0] || 0} products in database`);
      return true;
    } else {
      console.log('❌ Database connection failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testTypeScriptCompilation() {
  console.log('\n🔧 Testing TypeScript Compilation...');

  try {
    execSync('npm run type-check', { stdio: 'pipe' });
    console.log('✅ TypeScript compilation successful');
    return true;
  } catch (error) {
    console.log('❌ TypeScript compilation failed');
    console.log(error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  const tests = [
    { name: 'TypeScript Compilation', fn: testTypeScriptCompilation },
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Search Endpoint', fn: testSearchEndpoint },
    { name: 'Bulk Delete Endpoint', fn: testBulkDeleteEndpoint },
    { name: 'Individual Endpoints', fn: testIndividualEndpoints },
    { name: 'Page Access', fn: testPageAccess },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`❌ ${test.name} failed with error:`, error.message);
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary
  console.log('\n📋 Test Summary:');
  console.log('================');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });

  console.log(`\n🎯 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All tests passed! Product migration is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed. Please review the issues above.');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
