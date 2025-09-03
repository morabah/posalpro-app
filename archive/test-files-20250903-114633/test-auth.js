// Simple authentication test script
import fetch from 'node-fetch';

async function testAuthentication() {
  console.log('🔐 Testing Authentication...\n');

  try {
    // 1. Test CSRF endpoint
    console.log('1. Testing CSRF endpoint...');
    const csrfRes = await fetch('http://localhost:3000/api/auth/csrf');
    console.log(`   Status: ${csrfRes.status}`);

    if (csrfRes.ok) {
      const csrfData = await csrfRes.json();
      console.log(`   CSRF Token: ${csrfData.csrfToken ? '✅ Received' : '❌ Missing'}`);
    } else {
      console.log(`   ❌ CSRF failed: ${csrfRes.status}`);
      return;
    }

    // 2. Test login endpoint
    console.log('\n2. Testing login...');
    const loginRes = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'admin@posalpro.com',
        password: 'ProposalPro2024!',
        callbackUrl: 'http://localhost:3000/dashboard'
      })
    });

    console.log(`   Login Status: ${loginRes.status}`);

    if (loginRes.status === 302 || loginRes.status === 200) {
      console.log('   ✅ Login successful');
    } else {
      const text = await loginRes.text();
      console.log(`   ❌ Login failed: ${text}`);
    }

    // 3. Test session endpoint
    console.log('\n3. Testing session...');
    const sessionRes = await fetch('http://localhost:3000/api/auth/session');
    console.log(`   Session Status: ${sessionRes.status}`);

    if (sessionRes.ok) {
      const sessionData = await sessionRes.json();
      console.log(`   User: ${sessionData.user ? '✅ Logged in' : '❌ Not logged in'}`);
      if (sessionData.user) {
        console.log(`   Email: ${sessionData.user.email}`);
        console.log(`   Roles: ${JSON.stringify(sessionData.user.roles)}`);
      }
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

testAuthentication();
