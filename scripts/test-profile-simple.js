#!/usr/bin/env node

console.log('🚀 Starting simple profile test...');

// Test 1: Basic Prisma connection
async function testBasicConnection() {
  try {
    console.log('📦 Testing Prisma connection...');

    // Dynamic import to handle any module issues
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    console.log('✅ Prisma client created');

    // Test basic query
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected, found ${userCount} users`);

    // Find our test user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@posalpro.com' },
      include: { preferences: true },
    });

    if (user) {
      console.log('✅ Test user found:', user.email);

      if (user.preferences) {
        console.log('✅ User preferences exist');

        const profileData = user.preferences.dashboardLayout?.profile;
        if (profileData) {
          console.log('✅ Profile data found:', {
            title: profileData.title,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
          });
        } else {
          console.log('❌ No profile data in preferences');
          console.log(
            'Dashboard layout keys:',
            Object.keys(user.preferences.dashboardLayout || {})
          );
        }
      } else {
        console.log('❌ No preferences found for user');
      }
    } else {
      console.log('❌ Test user not found');
    }

    await prisma.$disconnect();
    console.log('✅ Database test complete');
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

// Test 2: Simple API call
async function testApiCall() {
  try {
    console.log('\n📡 Testing API endpoint...');

    // Try a simple GET request to the profile endpoint
    const response = await fetch('http://localhost:3000/api/profile');

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    if (response.status === 401) {
      console.log('⚠️  API requires authentication (expected)');
    } else if (response.status === 200) {
      const data = await response.json();
      console.log('✅ API response data:', data);
    } else {
      const text = await response.text();
      console.log('❌ Unexpected response:', text);
    }
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🔍 SIMPLE PROFILE PERSISTENCE TEST');
  console.log('==================================');

  await testBasicConnection();
  await testApiCall();

  console.log('\n✅ Tests complete');
}

runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
