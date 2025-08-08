#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000';
const USER = {
  email: 'admin@posalpro.com',
  password: 'ProposalPro2024!',
};

console.log('🚀 Starting Simple Profile Test');

async function main() {
  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Testing health endpoint...');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    console.log(`Health: ${healthRes.status}`);

    // Test 2: Profile endpoint without auth (should get 401)
    console.log('\n2️⃣ Testing profile endpoint without auth...');
    const noAuthRes = await fetch(`${BASE_URL}/api/profile`);
    console.log(`Profile (no auth): ${noAuthRes.status}`);

    // Test 3: Profile update without auth (should get 401)
    console.log('\n3️⃣ Testing profile update without auth...');
    const noAuthUpdateRes = await fetch(`${BASE_URL}/api/profile/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Test', lastName: 'User', email: 'test@test.com' }),
    });
    console.log(`Profile update (no auth): ${noAuthUpdateRes.status}`);

    if (noAuthUpdateRes.status === 401) {
      console.log('✅ Authentication is properly enforced');
    } else {
      console.log('❌ Authentication enforcement issue');
    }

    // Test 4: Get CSRF token
    console.log('\n4️⃣ Getting CSRF token...');
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    console.log(`CSRF: ${csrfRes.status}, Token: ${csrfData.csrfToken ? 'Present' : 'Missing'}`);

    if (!csrfData.csrfToken) {
      throw new Error('CSRF token not received');
    }

    // Test 5: Attempt authentication
    console.log('\n5️⃣ Attempting authentication...');
    const authRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: csrfRes.headers.get('set-cookie') || '',
      },
      body: new URLSearchParams({
        email: USER.email,
        password: USER.password,
        csrfToken: csrfData.csrfToken,
        callbackUrl: `${BASE_URL}/admin`,
        json: 'true',
      }),
      redirect: 'manual',
    });

    console.log(`Auth: ${authRes.status}`);

    const authCookies = authRes.headers.get('set-cookie');
    console.log(`Auth cookies: ${authCookies ? 'Present' : 'Missing'}`);

    if (!authCookies) {
      console.log('❌ Authentication failed - no cookies received');
      return;
    }

    // Combine cookies
    const csrfCookies = csrfRes.headers.get('set-cookie') || '';
    const cookies = [csrfCookies, authCookies]
      .filter(Boolean)
      .join('; ')
      .split(',')
      .map(cookie => cookie.trim().split(';')[0])
      .join('; ');

    console.log(`Combined cookies length: ${cookies.length}`);

    // Test 6: Profile GET with auth
    console.log('\n6️⃣ Testing profile GET with authentication...');
    const profileRes = await fetch(`${BASE_URL}/api/profile`, {
      headers: {
        Cookie: cookies,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Profile GET: ${profileRes.status}`);

    if (profileRes.ok) {
      const profileData = await profileRes.json();
      console.log('✅ Profile GET successful');
      console.log(`Profile keys: ${Object.keys(profileData.data || {}).join(', ')}`);
    } else {
      const errorText = await profileRes.text();
      console.log(`❌ Profile GET failed: ${errorText.substring(0, 200)}`);
    }

    // Test 7: Profile UPDATE with auth
    console.log('\n7️⃣ Testing profile UPDATE with authentication...');
    const updateData = {
      firstName: 'System',
      lastName: 'Administrator',
      title: 'Chief Technology Officer',
      email: 'admin@posalpro.com',
      department: 'Information Technology',
      phone: '+1-555-0199',
      bio: 'Updated via automated test',
    };

    const updateRes = await fetch(`${BASE_URL}/api/profile/update`, {
      method: 'PUT',
      headers: {
        Cookie: cookies,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    console.log(`Profile UPDATE: ${updateRes.status}`);

    const updateText = await updateRes.text();

    if (updateRes.ok) {
      try {
        const updateResult = JSON.parse(updateText);
        console.log('✅ Profile UPDATE successful!');
        console.log(`Updated fields: ${Object.keys(updateData).join(', ')}`);
        if (updateResult.data?.profileCompleteness) {
          console.log(`Profile completeness: ${updateResult.data.profileCompleteness}%`);
        }
      } catch (parseError) {
        console.log('✅ Update succeeded but response parsing failed');
      }
    } else {
      console.log(`❌ Profile UPDATE failed: ${updateText.substring(0, 300)}`);
    }

    // Test 8: Verify persistence
    console.log('\n8️⃣ Verifying profile persistence...');
    const verifyRes = await fetch(`${BASE_URL}/api/profile`, {
      headers: {
        Cookie: cookies,
        'Content-Type': 'application/json',
      },
    });

    if (verifyRes.ok) {
      const verifyData = await verifyRes.json();
      console.log('✅ Profile data persisted');

      // Check if our updates are there
      const profile = verifyData.data;
      console.log('Verification results:');
      Object.keys(updateData).forEach(key => {
        const matches = profile[key] === updateData[key];
        console.log(`  ${key}: ${matches ? '✅' : '❌'} ${matches ? 'Persisted' : 'Lost'}`);
      });
    } else {
      console.log('❌ Could not verify persistence');
    }

    console.log('\n🎉 Test completed!');
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

main();
