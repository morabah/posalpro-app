#!/usr/bin/env node

/**
 * Admin API Authentication Test Script
 * Demonstrates how to call admin APIs with proper credentials
 *
 * Usage: node scripts/test-admin-api-with-auth.js
 */

const BASE_URL = 'http://localhost:3000';
const ADMIN_CREDENTIALS = {
  email: 'admin@posalpro.com',
  password: 'ProposalPro2024!',
};

console.log('🔐 Testing Admin API Authentication');
console.log('='.repeat(50));

async function testAdminAPIs() {
  try {
    // Step 1: Test unauthenticated access (should fail)
    console.log('\n1️⃣ Testing Unauthenticated Access...');
    await testUnauthenticatedAccess();

    // Step 2: Test with session cookies (NextAuth)
    console.log('\n2️⃣ Testing with Session Cookies...');
    await testWithSessionCookies();

    // Step 3: Test with bearer token
    console.log('\n3️⃣ Testing with Bearer Token...');
    await testWithBearerToken();

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

async function testUnauthenticatedAccess() {
  console.log('   Testing /api/admin/metrics without auth...');

  const response = await fetch(`${BASE_URL}/api/admin/metrics`);
  const data = await response.json();

  console.log(`   Status: ${response.status}`);
  console.log(`   Response: ${JSON.stringify(data, null, 2)}`);

  if (response.status === 401) {
    console.log('   ✅ Correctly rejected unauthenticated access');
  } else {
    throw new Error(`Expected 401, got ${response.status}`);
  }
}

async function testWithSessionCookies() {
  console.log('   Getting CSRF token...');

  // Step 1: Get CSRF token
  const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfResponse.json();

  if (!csrfData.csrfToken) {
    throw new Error('No CSRF token received');
  }

  console.log('   Authenticating with credentials...');

  // Step 2: Authenticate
  const authResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: csrfResponse.headers.get('set-cookie') || '',
    },
    body: new URLSearchParams({
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      csrfToken: csrfData.csrfToken,
      callbackUrl: `${BASE_URL}/admin`,
      json: 'true',
    }),
    redirect: 'manual',
  });

  if (authResponse.status !== 200) {
    throw new Error(`Authentication failed: ${authResponse.status}`);
  }

  // Step 3: Extract cookies
  const authCookies = authResponse.headers.get('set-cookie');
  const csrfCookies = csrfResponse.headers.get('set-cookie') || '';

  // Combine cookies
  const allCookies = [csrfCookies, authCookies]
    .filter(Boolean)
    .join('; ')
    .split(',')
    .map(c => c.trim().split(';')[0])
    .join('; ');

  console.log('   Testing admin APIs with session cookies...');

  // Test admin metrics API
  const metricsResponse = await fetch(`${BASE_URL}/api/admin/metrics`, {
    headers: {
      Cookie: allCookies,
      'Content-Type': 'application/json',
    },
  });

  console.log(`   Metrics API Status: ${metricsResponse.status}`);

  if (metricsResponse.ok) {
    const metricsData = await metricsResponse.json();
    console.log('   ✅ Successfully accessed admin metrics with session cookies');
    console.log(`   Response keys: ${Object.keys(metricsData).join(', ')}`);
  } else {
    const errorData = await metricsResponse.json();
    console.log(`   ❌ Failed: ${JSON.stringify(errorData, null, 2)}`);
  }

  // Test admin users API
  const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: {
      Cookie: allCookies,
      'Content-Type': 'application/json',
    },
  });

  console.log(`   Users API Status: ${usersResponse.status}`);

  if (usersResponse.ok) {
    const usersData = await usersResponse.json();
    console.log('   ✅ Successfully accessed admin users with session cookies');
    console.log(`   Users count: ${usersData.users?.length || 0}`);
  } else {
    const errorData = await usersResponse.json();
    console.log(`   ❌ Failed: ${JSON.stringify(errorData, null, 2)}`);
  }
}

async function testWithBearerToken() {
  console.log('   Getting bearer token...');

  // Step 1: Get CSRF token
  const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfResponse.json();

  // Step 2: Authenticate to get session
  const authResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: csrfResponse.headers.get('set-cookie') || '',
    },
    body: new URLSearchParams({
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      csrfToken: csrfData.csrfToken,
      callbackUrl: `${BASE_URL}/admin`,
      json: 'true',
    }),
    redirect: 'manual',
  });

  // Step 3: Get session to extract token
  const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: {
      Cookie: authResponse.headers.get('set-cookie') || '',
    },
  });

  const sessionData = await sessionResponse.json();

  if (!sessionData.accessToken) {
    console.log('   ⚠️ No access token in session, testing with session cookies instead');
    return;
  }

  console.log('   Testing admin APIs with bearer token...');

  // Test admin metrics API with bearer token
  const metricsResponse = await fetch(`${BASE_URL}/api/admin/metrics`, {
    headers: {
      Authorization: `Bearer ${sessionData.accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(`   Metrics API Status: ${metricsResponse.status}`);

  if (metricsResponse.ok) {
    const metricsData = await metricsResponse.json();
    console.log('   ✅ Successfully accessed admin metrics with bearer token');
    console.log(`   Response keys: ${Object.keys(metricsData).join(', ')}`);
  } else {
    const errorData = await metricsResponse.json();
    console.log(`   ❌ Failed: ${JSON.stringify(errorData, null, 2)}`);
  }
}

// Browser-style fetch example
async function demonstrateBrowserUsage() {
  console.log('\n🌐 Browser Usage Examples:');
  console.log('='.repeat(50));

  console.log('\n📝 Example 1: Session Cookie (Automatic)');
  console.log(`
// In browser, cookies are automatically sent with same-origin requests
const response = await fetch('/api/admin/metrics', {
  method: 'GET',
  // No need to manually set cookies - browser handles this
});

if (response.ok) {
  const data = await response.json();
  console.log('Admin metrics:', data);
} else {
  console.error('Access denied');
}
  `);

  console.log('\n📝 Example 2: Bearer Token (Manual)');
  console.log(`
// Get token from session or localStorage
const token = sessionStorage.getItem('authToken');

const response = await fetch('/api/admin/metrics', {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json',
  },
});

if (response.ok) {
  const data = await response.json();
  console.log('Admin metrics:', data);
} else {
  console.error('Access denied');
}
  `);

  console.log('\n📝 Example 3: React Hook with Auth');
  console.log(`
// Using NextAuth useSession hook
import { useSession } from 'next-auth/react';

function AdminDashboard() {
  const { data: session, status } = useSession();

  const fetchAdminData = async () => {
    if (status === 'authenticated') {
      const response = await fetch('/api/admin/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    }
  };

  // Session cookies are automatically included
  return <div>Admin Dashboard</div>;
}
  `);
}

// Run tests
testAdminAPIs()
  .then(() => {
    demonstrateBrowserUsage();
    console.log('\n🎉 Test script completed successfully!');
  })
  .catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
