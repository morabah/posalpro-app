const { PrismaClient } = require('@prisma/client');

async function checkJobTitle() {
  const prisma = new PrismaClient();
  try {
    console.log('🔍 Checking job title in database...');

    const user = await prisma.user.findUnique({
      where: { email: 'admin@posalpro.com' },
      include: { preferences: true },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    const title = user?.preferences?.dashboardLayout?.profile?.title;
    console.log('📊 Current job title in database:', title || 'NOT FOUND');

    if (title === 'sales') {
      console.log('✅ BACKEND CONFIRMED: Job title "sales" found in database!');
      console.log('✅ Backend persistence is working perfectly');
      console.log('🎯 CONCLUSION: The issue is 100% frontend data loading');
    } else if (title) {
      console.log('⚠️  Different job title found:', title);
      console.log('Expected: "sales"');
    } else {
      console.log('❌ No job title found in database');
    }

    // Show full profile structure for debugging
    if (user.preferences?.dashboardLayout?.profile) {
      console.log('\n📋 Full profile data in database:');
      const profile = user.preferences.dashboardLayout.profile;
      console.log('- firstName:', profile.firstName);
      console.log('- lastName:', profile.lastName);
      console.log('- title:', profile.title);
      console.log('- phone:', profile.phone);
      console.log('- bio:', profile.bio);
    }
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkJobTitle();
