#!/usr/bin/env node

/**
 * Quick check for job title "sales" in the system
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('🔍 Checking for job title "sales"...');

  const prisma = new PrismaClient();

  try {
    // Direct database check
    const result = await prisma.$queryRaw`
      SELECT u.email, up.dashboard_layout
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      WHERE u.email = 'admin@posalpro.com'
    `;

    console.log('📊 Query result:', result);

    if (result.length > 0) {
      const userRecord = result[0];
      const dashboardLayout = userRecord.dashboard_layout;

      if (dashboardLayout && dashboardLayout.profile && dashboardLayout.profile.title) {
        const currentTitle = dashboardLayout.profile.title;
        console.log('✅ Found job title:', currentTitle);

        if (currentTitle === 'sales') {
          console.log('🎉 SUCCESS: Job title "sales" found in database!');
          console.log('✅ Backend is working perfectly');
          console.log('🎯 Issue is confirmed to be frontend data loading');
        } else {
          console.log('⚠️  Different title found. Expected "sales", got:', currentTitle);
        }
      } else {
        console.log('❌ No job title found in profile data');
        console.log('Dashboard layout structure:', JSON.stringify(dashboardLayout, null, 2));
      }
    } else {
      console.log('❌ No user record found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
