console.log('=== TESTING PROFILE WITH AUTHENTICATION ===');

async function authTest() {
  try {
    // Step 1: Get CSRF token
    console.log('1. Getting CSRF token...');
    const csrfRes = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfRes.json();
    console.log('CSRF status:', csrfRes.status, 'Token present:', !!csrfData.csrfToken);

    if (!csrfData.csrfToken) {
      throw new Error('No CSRF token');
    }

    // Step 2: Authenticate
    console.log('2. Authenticating...');
    const authRes = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: csrfRes.headers.get('set-cookie') || '',
      },
      body: new URLSearchParams({
        email: 'admin@posalpro.com',
        password: 'ProposalPro2024!',
        csrfToken: csrfData.csrfToken,
        callbackUrl: 'http://localhost:3000/admin',
        json: 'true',
      }),
      redirect: 'manual',
    });

    console.log('Auth status:', authRes.status);
    const authCookies = authRes.headers.get('set-cookie');
    console.log('Auth cookies received:', !!authCookies);

    if (!authCookies) {
      console.log('Authentication failed - no cookies');
      return;
    }

    // Combine cookies
    const csrfCookies = csrfRes.headers.get('set-cookie') || '';
    const allCookies = [csrfCookies, authCookies]
      .filter(Boolean)
      .join('; ')
      .split(',')
      .map(c => c.trim().split(';')[0])
      .join('; ');

    console.log('Combined cookies length:', allCookies.length);

    // Step 3: Test authenticated profile GET
    console.log('3. Testing authenticated profile GET...');
    const profileRes = await fetch('http://localhost:3000/api/profile', {
      headers: {
        Cookie: allCookies,
        'Content-Type': 'application/json',
      },
    });

    console.log('Profile GET status:', profileRes.status);

    if (profileRes.ok) {
      const profileData = await profileRes.json();
      console.log('✅ Profile retrieved successfully');
      console.log('Profile data keys:', Object.keys(profileData.data || {}));
      console.log('Current name:', profileData.data?.name);
      console.log('Current department:', profileData.data?.department);
    } else {
      const errorText = await profileRes.text();
      console.log('Profile GET error:', errorText.substring(0, 200));
    }

    // Step 4: Test authenticated profile UPDATE
    console.log('4. Testing authenticated profile UPDATE...');
    const updateData = {
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@posalpro.com',
      department: 'Business Development',
      title: 'System Administrator',
      phone: '+1-555-TEST',
      bio: 'Updated via test script at ' + new Date().toISOString(),
      languages: ['English', 'Spanish'],
      expertiseAreas: ['Technical Solutions', 'Enterprise Software'],
      office: 'San Francisco HQ',
    };

    const updateRes = await fetch('http://localhost:3000/api/profile/update', {
      method: 'PUT',
      headers: {
        Cookie: allCookies,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    console.log('Profile UPDATE status:', updateRes.status);
    const updateText = await updateRes.text();

    if (updateRes.ok) {
      console.log('✅ Profile UPDATE successful!');
      try {
        const updateResult = JSON.parse(updateText);
        console.log('✅ Success response received');
        if (updateResult.data?.profileCompleteness) {
          console.log('📊 Profile completeness:', updateResult.data.profileCompleteness + '%');
        }
        console.log('📝 Updated name:', updateResult.data?.name);
        console.log('📝 Updated department:', updateResult.data?.department);
      } catch (e) {
        console.log('Update succeeded but could not parse response');
      }
    } else {
      console.log('❌ Profile UPDATE failed');
      console.log('Error response:', updateText.substring(0, 500));
    }

    // Step 5: Verify persistence
    console.log('5. Verifying profile persistence...');
    const verifyRes = await fetch('http://localhost:3000/api/profile', {
      headers: {
        Cookie: allCookies,
        'Content-Type': 'application/json',
      },
    });

    if (verifyRes.ok) {
      const verifyData = await verifyRes.json();
      console.log('✅ Profile retrieved for verification');
      console.log('📝 Verified name:', verifyData.data?.name);
      console.log('📝 Verified department:', verifyData.data?.department);
      console.log('📝 Verified firstName:', verifyData.data?.firstName);
      console.log('📝 Verified lastName:', verifyData.data?.lastName);
      console.log('📝 Verified title:', verifyData.data?.title);
      console.log('📝 Verified bio:', verifyData.data?.bio?.substring(0, 50) + '...');
    }

    console.log('=== AUTHENTICATION TEST COMPLETE ===');
  } catch (error) {
    console.error('Authentication test error:', error.message);
    console.error('Stack:', error.stack);
  }
}

authTest();
