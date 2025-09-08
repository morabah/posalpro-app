/**
 * Test script to debug admin dashboard data issues
 */

const http = require('http');

async function testAdminAPI() {
  console.log('🔍 Testing Admin API endpoints...\n');

  const endpoints = [
    { path: '/api/admin/users?page=1&limit=5', name: 'Users' },
    { path: '/api/admin/roles?page=1&limit=5', name: 'Roles' },
    { path: '/api/admin/permissions?page=1&limit=5', name: 'Permissions' },
    { path: '/api/admin/metrics', name: 'Metrics' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing ${endpoint.name} API...`);

      // For this test, we'll use a simple approach since we can't easily authenticate
      // In a real scenario, you'd need to set up authentication

      console.log(`   Endpoint: ${endpoint.path}`);
      console.log(`   Status: Would need authentication to test fully`);
      console.log('');

    } catch (error) {
      console.error(`❌ Error testing ${endpoint.name}:`, error.message);
    }
  }

  console.log('💡 To test the admin APIs, you need to:');
  console.log('   1. Be logged in as an admin user');
  console.log('   2. Have valid session cookies');
  console.log('   3. The APIs should work if the migration was successful');
}

// Run the test
testAdminAPI().catch(console.error);
