/**
 * Check database users
 */

const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking database users...\n');

    // Count total users
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);

    if (userCount > 0) {
      // Get first few users
      const users = await prisma.user.findMany({
        take: 5,
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          roles: {
            select: {
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      console.log('\n👥 Sample users:');
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.name}) - Status: ${user.status} - Roles: ${user.roles.map(r => r.role.name).join(', ') || 'None'}`);
      });
    }

    // Count users by status
    const activeCount = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const inactiveCount = await prisma.user.count({ where: { status: 'INACTIVE' } });

    console.log(`\n📈 User status breakdown:`);
    console.log(`  - Active: ${activeCount}`);
    console.log(`  - Inactive: ${inactiveCount}`);

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
