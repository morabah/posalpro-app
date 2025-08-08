#!/usr/bin/env node

/**
 * Complete Profile Data Flow Test
 * Tests the entire profile persistence pipeline:
 * 1. Database storage verification
 * 2. GET /api/profile endpoint
 * 3. PUT /api/profile/update endpoint
 * 4. Data persistence after update
 */

// Load environment variables
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

// Use native fetch (Node 18+) or provide fallback
const fetch = globalThis.fetch || require('node-fetch');

// Test configuration
const TEST_USER_EMAIL = 'admin@posalpro.com';
const TEST_JOB_TITLE = 'Senior Software Engineer';
const API_BASE_URL = 'http://localhost:3000';

// Mock session cookie for API requests
let sessionCookie = null;

async function testCompleteProfileFlow() {
  console.log('🔍 COMPLETE PROFILE DATA FLOW TEST');
  console.log('='.repeat(50));

  const prisma = new PrismaClient();

  try {
    // Step 1: Check current database state
    console.log('\n📊 STEP 1: DATABASE STATE CHECK');
    await checkDatabaseState(prisma);

    // Step 2: Test login and get session
    console.log('\n🔐 STEP 2: AUTHENTICATION TEST');
    await testAuthentication();

    // Step 3: Test GET /api/profile
    console.log('\n📥 STEP 3: GET PROFILE API TEST');
    const currentProfile = await testGetProfile();

    // Step 4: Test PUT /api/profile/update
    console.log('\n📤 STEP 4: UPDATE PROFILE API TEST');
    await testUpdateProfile(currentProfile);

    // Step 5: Verify persistence
    console.log('\n✅ STEP 5: PERSISTENCE VERIFICATION');
    await testPersistence(prisma);

    console.log('\n🎉 TEST COMPLETE!');
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkDatabaseState(prisma) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: TEST_USER_EMAIL },
      include: { preferences: true },
    });

    if (!user) {
      console.log('❌ User not found in database');
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
    });

    if (user.preferences) {
      console.log('✅ Preferences exist');
      const dashboardLayout = user.preferences.dashboardLayout;

      if (dashboardLayout && dashboardLayout.profile) {
        console.log('✅ Profile data in database:', {
          title: dashboardLayout.profile.title,
          firstName: dashboardLayout.profile.firstName,
          lastName: dashboardLayout.profile.lastName,
          phone: dashboardLayout.profile.phone,
          bio: dashboardLayout.profile.bio,
        });
      } else {
        console.log('❌ No profile data in dashboardLayout');
        console.log('Dashboard layout structure:', JSON.stringify(dashboardLayout, null, 2));
      }
    } else {
      console.log('❌ No preferences found');
    }
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

async function testAuthentication() {
  try {
    // First get CSRF token
    const csrfResponse = await fetch(`${API_BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();

    // Then authenticate
    const authResponse = await fetch(`${API_BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: TEST_USER_EMAIL,
        password: 'ProposalPro2024!',
        csrfToken: csrfData.csrfToken,
        callbackUrl: `${API_BASE_URL}/dashboard`,
        json: 'true',
      }),
    });

    if (authResponse.ok) {
      console.log('✅ Authentication successful');

      // Extract session cookie
      const cookies = authResponse.headers.get('set-cookie');
      if (cookies) {
        sessionCookie = cookies.split(';')[0];
        console.log('✅ Session cookie obtained');
      }
    } else {
      console.log('❌ Authentication failed:', authResponse.status);
    }
  } catch (error) {
    console.error('❌ Authentication error:', error);
  }
}

async function testGetProfile() {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (sessionCookie) {
      headers['Cookie'] = sessionCookie;
    }

    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ GET Profile successful');
      console.log('Profile data received:', {
        title: data.title,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        department: data.department,
        phone: data.phone,
        bio: data.bio,
      });
      return data;
    } else {
      console.log('❌ GET Profile failed:', response.status);
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ GET Profile error:', error);
    return null;
  }
}

async function testUpdateProfile(currentProfile) {
  try {
    const updateData = {
      firstName: currentProfile?.firstName || 'John',
      lastName: currentProfile?.lastName || 'Doe',
      title: TEST_JOB_TITLE, // This is what we're testing
      email: TEST_USER_EMAIL,
      phone: currentProfile?.phone || '555-0123',
      department: currentProfile?.department || 'Engineering',
      office: currentProfile?.office || 'Main Office',
      languages: currentProfile?.languages || ['English'],
      bio: currentProfile?.bio || 'Test bio',
      expertiseAreas: currentProfile?.expertiseAreas || [],
      profileImage: currentProfile?.profileImage || null,
    };

    const headers = {
      'Content-Type': 'application/json',
    };

    if (sessionCookie) {
      headers['Cookie'] = sessionCookie;
    }

    const response = await fetch(`${API_BASE_URL}/api/profile/update`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ PUT Profile update successful');
      console.log('Update response:', result.success ? 'Success' : 'Failed');

      if (result.data) {
        console.log('Updated profile data:', {
          title: result.data.title,
          firstName: result.data.firstName,
          lastName: result.data.lastName,
        });
      }
    } else {
      console.log('❌ PUT Profile update failed:', response.status);
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ PUT Profile update error:', error);
  }
}

async function testPersistence(prisma) {
  try {
    // Wait a moment for database writes to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('🔍 Checking if job title persisted in database...');

    const user = await prisma.user.findUnique({
      where: { email: TEST_USER_EMAIL },
      include: { preferences: true },
    });

    if (user?.preferences?.dashboardLayout?.profile?.title === TEST_JOB_TITLE) {
      console.log('✅ SUCCESS: Job title persisted in database!');
      console.log(`   Stored title: "${user.preferences.dashboardLayout.profile.title}"`);
    } else {
      console.log('❌ FAILURE: Job title not persisted correctly');
      console.log('   Expected:', TEST_JOB_TITLE);
      console.log('   Found:', user?.preferences?.dashboardLayout?.profile?.title || 'null');
      console.log('   Full profile object:', user?.preferences?.dashboardLayout?.profile);
    }

    // Test GET endpoint again
    console.log('\n🔍 Testing GET endpoint after update...');
    const profileAfterUpdate = await testGetProfile();

    if (profileAfterUpdate?.title === TEST_JOB_TITLE) {
      console.log('✅ SUCCESS: GET endpoint returns updated job title!');
    } else {
      console.log('❌ FAILURE: GET endpoint does not return updated job title');
      console.log('   Expected:', TEST_JOB_TITLE);
      console.log('   Found:', profileAfterUpdate?.title || 'null');
    }
  } catch (error) {
    console.error('❌ Persistence check failed:', error);
  }
}

// Run the test with better error handling
testCompleteProfileFlow().catch(error => {
  console.error('❌ SCRIPT ERROR:', error);
  process.exit(1);
});
