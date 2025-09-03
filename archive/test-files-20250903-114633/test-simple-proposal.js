#!/usr/bin/env node

/**
 * Simple test to create a proposal with proper authentication
 */

const API_URL = 'http://localhost:3000/api/proposals';

const customerData = {
  name: 'Test Customer API',
  email: 'test.api@example.com',
  industry: 'Technology',
  status: 'ACTIVE',
  tags: ['test', 'api'],
};

console.log('🔧 Testing customer creation with authentication...');

async function testCustomerCreation() {
  try {
    // Step 1: Get CSRF token
    console.log('🔐 Getting CSRF token...');
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    console.log('🔐 CSRF token received:', csrfData.csrfToken ? 'YES' : 'NO');

    if (!csrfData.csrfToken) {
      console.error('❌ No CSRF token received');
      return;
    }

    // Step 2: Login with CSRF token
    console.log('🔐 Logging in...');
    const params = new URLSearchParams();
    params.set('csrfToken', csrfData.csrfToken);
    params.set('email', 'admin@posalpro.com');
    params.set('password', 'ProposalPro2024!');
    params.set('callbackUrl', 'http://localhost:3000/dashboard');

    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      redirect: 'manual',
    });

    console.log('🔐 Login response status:', loginResponse.status);

    // Get cookies from login response
    const setCookie = loginResponse.headers.get('set-cookie');
    console.log('🍪 Cookies received:', setCookie ? 'YES' : 'NO');

    // Step 3: Verify session
    console.log('🔍 Verifying session...');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
      headers: {
        Cookie: setCookie || '',
      },
    });

    console.log('🔍 Session check status:', sessionResponse.status);
    const sessionText = await sessionResponse.text();
    console.log('🔍 Session response:', sessionText);

    let sessionData;
    try {
      sessionData = JSON.parse(sessionText);
      console.log('🔍 Parsed session data:', JSON.stringify(sessionData, null, 2));
    } catch (e) {
      console.log('🔍 Session response is not JSON');
      return;
    }

    if (!sessionData.user) {
      console.error('❌ No user in session');
      return;
    }

    console.log('✅ Session established successfully');

    // Step 4: Test customer creation with session
    console.log('📝 Creating customer...');
    const customerResponse = await fetch('http://localhost:3000/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: setCookie || '',
      },
      body: JSON.stringify(customerData),
    });

    console.log('📡 Customer creation response status:', customerResponse.status);
    console.log('📡 Response headers:', Object.fromEntries(customerResponse.headers.entries()));

    const responseText = await customerResponse.text();
    console.log('📡 Raw response:', responseText);

    try {
      const json = JSON.parse(responseText);
      console.log('📡 Parsed response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('📡 Response is not JSON');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCustomerCreation();
