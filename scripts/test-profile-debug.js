#!/usr/bin/env node

/**
 * Direct Database Profile Test Script
 * Tests what's actually stored in the database after profile updates
 */

// Load environment variables
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

console.log('🚀 Starting profile persistence test...');
console.log('Database URL exists:', !!process.env.DATABASE_URL);

async function testProfilePersistence() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 DIRECT DATABASE PROFILE TEST');
    console.log('====================================');

    // Query the user and their preferences directly
    const user = await prisma.user.findUnique({
      where: { email: 'admin@posalpro.com' },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('\n📊 USER DATA:');
    console.log('- ID:', user.id);
    console.log('- Name:', user.name);
    console.log('- Email:', user.email);
    console.log('- Department:', user.department);

    console.log('\n📊 USER PREFERENCES:');
    if (user.preferences) {
      console.log('- Preferences exist:', true);
      console.log('- Theme:', user.preferences.theme);
      console.log('- Language:', user.preferences.language);
      console.log('- Dashboard Layout Type:', typeof user.preferences.dashboardLayout);

      if (user.preferences.dashboardLayout) {
        const layout = user.preferences.dashboardLayout;
        console.log('- Dashboard Layout Keys:', Object.keys(layout));

        if (layout.profile) {
          console.log('\n🎯 PROFILE DATA IN DATABASE:');
          console.log('- Profile exists in dashboard layout:', true);
          console.log('- Profile keys:', Object.keys(layout.profile));
          console.log('- Title value:', layout.profile.title);
          console.log('- First name:', layout.profile.firstName);
          console.log('- Last name:', layout.profile.lastName);
          console.log('- Phone:', layout.profile.phone);
          console.log('- Bio:', layout.profile.bio);
          console.log('- Full profile object:', JSON.stringify(layout.profile, null, 2));
        } else {
          console.log('\n❌ NO PROFILE DATA FOUND in dashboardLayout!');
          console.log('Dashboard layout contents:', JSON.stringify(layout, null, 2));
        }
      } else {
        console.log('\n❌ NO DASHBOARD LAYOUT FOUND!');
      }
    } else {
      console.log('❌ No preferences found for user!');
    }

    console.log('\n📈 SUMMARY:');
    console.log('- User exists:', !!user);
    console.log('- Preferences exist:', !!user.preferences);
    console.log('- Dashboard layout exists:', !!user.preferences?.dashboardLayout);
    console.log('- Profile data exists:', !!user.preferences?.dashboardLayout?.profile);
    console.log(
      '- Title value in DB:',
      user.preferences?.dashboardLayout?.profile?.title || 'NOT FOUND'
    );
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testProfilePersistence().catch(console.error);
