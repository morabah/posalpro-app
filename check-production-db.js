// PosalPro MVP2 - Production Database Check Script
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProductionDatabase() {
  console.log('🔍 Checking production database...');

  try {
    // Check if users exist
    const userCount = await prisma.user.count();
    console.log(`👥 Users found: ${userCount}`);

    if (userCount === 0) {
      console.log('❌ No users found! Database needs seeding.');
      console.log('📝 Run the following commands to seed the database:');
      console.log('   npm run db:seed');
      console.log('');
      console.log('🔑 Default admin credentials after seeding:');
      console.log('   Email: admin@posalpro.com');
      console.log('   Password: ProposalPro2024!');
      return;
    }

    // Check for admin user specifically
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@posalpro.com' },
      select: { id: true, email: true, name: true }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found!');
      console.log('🔧 Creating admin user...');

      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('ProposalPro2024!', 12);

      const newAdmin = await prisma.user.create({
        data: {
          tenantId: 'tenant_default',
          email: 'admin@posalpro.com',
          name: 'System Administrator',
          password: hashedPassword,
          department: 'IT',
          status: 'ACTIVE'
        }
      });

      console.log('✅ Admin user created:', newAdmin.email);
    } else {
      console.log('✅ Admin user found:', adminUser.email);
    }

    // Check other essential data
    const roleCount = await prisma.role.count();
    const customerCount = await prisma.customer.count();
    const productCount = await prisma.product.count();

    console.log(`🎭 Roles: ${roleCount}`);
    console.log(`🏢 Customers: ${customerCount}`);
    console.log(`📦 Products: ${productCount}`);

    if (roleCount === 0 || customerCount === 0 || productCount === 0) {
      console.log('⚠️  Some data is missing. Consider running: npm run db:seed');
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.log('🔧 Make sure your DATABASE_URL is correct and database is accessible');
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionDatabase();
