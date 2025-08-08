// Using native fetch available in Node.js 18+

const BASE_URL = 'http://localhost:3000';
const LOGIN_URL = `${BASE_URL}/api/auth/signin`;
const PROFILE_URL = `${BASE_URL}/api/profile/update`;

const USER = {
  email: 'admin@posalpro.com',
  password: 'ProposalPro2024!',
};

// Test profile data
const PROFILE_DATA = {
  firstName: 'Admin',
  lastName: 'User',
  title: 'System Administrator',
  email: 'admin@posalpro.com',
  phone: '+1-555-0123',
  department: 'IT',
  office: 'San Francisco',
  languages: ['English', 'Spanish'],
  bio: 'Experienced system administrator with 10+ years in enterprise software.',
  profileImage: null,
  expertiseAreas: ['System Administration', 'Database Management', 'Security'],
};

async function authenticateAndGetSession() {
  console.log('🔐 Authenticating user...');

  try {
    // First, get CSRF token
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();

    if (!csrfData.csrfToken) {
      throw new Error('Failed to get CSRF token');
    }

    console.log('✅ CSRF token obtained');

    // Authenticate
    const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: csrfResponse.headers.get('set-cookie') || '',
      },
      body: `email=${encodeURIComponent(USER.email)}&password=${encodeURIComponent(USER.password)}&csrfToken=${encodeURIComponent(csrfData.csrfToken)}&callbackUrl=${encodeURIComponent(`${BASE_URL}/admin`)}&json=true`,
    });

    console.log('🔑 Authentication response status:', loginResponse.status);

    // Extract session cookies
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (!setCookieHeader) {
      throw new Error('No session cookies received');
    }

    // Parse cookies for subsequent requests
    const cookies = setCookieHeader
      .split(',')
      .map(cookie => cookie.trim().split(';')[0])
      .join('; ');

    console.log('✅ Session cookies obtained');
    console.log('🍪 Cookies:', cookies.substring(0, 100) + '...');

    return cookies;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

async function testProfileUpdate(cookies) {
  console.log('\n📝 Testing profile update...');

  try {
    // Test current profile endpoint first
    console.log('🔍 Getting current profile...');
    const getCurrentResponse = await fetch(`${BASE_URL}/api/profile`, {
      method: 'GET',
      headers: {
        Cookie: cookies,
        'Content-Type': 'application/json',
      },
    });

    console.log('Current profile response status:', getCurrentResponse.status);
    if (getCurrentResponse.ok) {
      const currentProfile = await getCurrentResponse.json();
      console.log('✅ Current profile:', JSON.stringify(currentProfile, null, 2));
    } else {
      const errorText = await getCurrentResponse.text();
      console.log('⚠️  Get profile failed:', errorText.substring(0, 200));
    }

    // Test profile update
    console.log('\n🔄 Updating profile...');
    const updateResponse = await fetch(PROFILE_URL, {
      method: 'PUT',
      headers: {
        Cookie: cookies,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(PROFILE_DATA),
    });

    console.log('Update response status:', updateResponse.status);
    console.log('Update response headers:', updateResponse.headers.raw());

    const responseText = await updateResponse.text();
    console.log('Raw response:', responseText.substring(0, 500));

    if (updateResponse.ok) {
      try {
        const updateResult = JSON.parse(responseText);
        console.log('✅ Profile update successful:', JSON.stringify(updateResult, null, 2));
        return updateResult;
      } catch (parseError) {
        console.log('⚠️  Response is not valid JSON:', responseText);
      }
    } else {
      console.log('❌ Profile update failed');

      // Try to parse error response
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error details:', JSON.stringify(errorData, null, 2));
      } catch (parseError) {
        console.log('Raw error response:', responseText);
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Profile update test failed:', error.message);
    throw error;
  }
}

async function testDatabaseDirectCheck(cookies) {
  console.log('\n🗄️  Testing database integration...');

  try {
    // Test user lookup
    const userResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'GET',
      headers: {
        Cookie: cookies,
        'Content-Type': 'application/json',
      },
    });

    console.log('Users API response status:', userResponse.status);

    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ Users API working:', userData.success);
      if (userData.data && userData.data.length > 0) {
        console.log('👤 Sample user data:', JSON.stringify(userData.data[0], null, 2));
      }
    } else {
      const errorText = await userResponse.text();
      console.log('❌ Users API failed:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

async function runTest() {
  console.log('🚀 Starting Profile Update Test\n');

  try {
    // Step 1: Authenticate
    const cookies = await authenticateAndGetSession();

    // Step 2: Test database connectivity
    await testDatabaseDirectCheck(cookies);

    // Step 3: Test profile update
    const result = await testProfileUpdate(cookies);

    if (result) {
      console.log('\n✅ ALL TESTS PASSED');
      console.log('📊 Profile update is working correctly');
    } else {
      console.log('\n❌ TESTS FAILED');
      console.log('🔧 Profile update needs fixing');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Additional diagnostic functions
async function testAuthEndpoints() {
  console.log('\n🔍 Testing authentication endpoints...');

  try {
    // Test session endpoint
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
    console.log('Session endpoint status:', sessionResponse.status);

    // Test CSRF endpoint
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    console.log('CSRF endpoint status:', csrfResponse.status);

    // Test providers endpoint
    const providersResponse = await fetch(`${BASE_URL}/api/auth/providers`);
    console.log('Providers endpoint status:', providersResponse.status);

    console.log('✅ Authentication endpoints are responsive');
  } catch (error) {
    console.error('❌ Auth endpoint test failed:', error.message);
  }
}

// Run diagnostics if needed
if (process.argv.includes('--debug')) {
  testAuthEndpoints().then(() => runTest());
} else {
  runTest();
}
