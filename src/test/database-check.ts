/**
 * Database integrity check for Phase 2.2.4 validation
 */

import { prisma } from '../lib/prisma';

async function checkDatabaseIntegrity() {
  console.log('🔍 Checking database data integrity...');

  // Check tables exist and have data
  const tables = [
    { name: 'Customer', query: () => prisma.customer.count() },
    { name: 'Product', query: () => prisma.product.count() },
    { name: 'Content', query: () => prisma.content.count() },
    { name: 'Proposal', query: () => prisma.proposal.count() },
    { name: 'User', query: () => prisma.user.count() },
  ];

  for (const table of tables) {
    try {
      const count = await table.query();
      console.log(`✅ ${table.name}: ${count} records`);
    } catch (error) {
      console.log(
        `❌ ${table.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Check recent data from API tests
  console.log('\n🔍 Checking recent test data...');

  try {
    const recentCustomers = await prisma.customer.findMany({
      where: {
        OR: [{ name: { contains: 'API Test' } }, { name: { contains: 'Test Corporation' } }],
      },
      select: { id: true, name: true, tier: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.log(`📋 Test Customers: ${recentCustomers.length}`);
    recentCustomers.forEach(c => console.log(`  - ${c.name} (${c.tier}) - ${c.id}`));

    const recentProducts = await prisma.product.findMany({
      where: {
        OR: [{ name: { contains: 'API Test' } }, { name: { contains: 'Enterprise Analytics' } }],
      },
      select: { id: true, name: true, sku: true, price: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.log(`📦 Test Products: ${recentProducts.length}`);
    recentProducts.forEach(p => console.log(`  - ${p.name} (${p.sku}) - $${p.price}`));

    const recentContent = await prisma.content.findMany({
      where: {
        OR: [
          { title: { contains: 'API Test' } },
          { title: { contains: 'Enterprise Implementation' } },
        ],
      },
      select: { id: true, title: true, type: true, isPublic: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.log(`📄 Test Content: ${recentContent.length}`);
    recentContent.forEach(c => console.log(`  - ${c.title} (${c.type}, public: ${c.isPublic})`));
  } catch (error) {
    console.log(
      `❌ Error checking test data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Check schema consistency
  console.log('\n🔍 Checking schema and type consistency...');

  try {
    // Test enum values are working
    const customer = await prisma.customer.findFirst({
      select: { tier: true, createdAt: true },
    });
    if (customer) {
      console.log(`✅ Customer tier enum: ${customer.tier}`);
      console.log(
        `✅ Date type: ${customer.createdAt instanceof Date ? 'Date object' : typeof customer.createdAt}`
      );
    }

    const product = await prisma.product.findFirst({
      select: { price: true, isActive: true, attributes: true },
    });
    if (product) {
      console.log(`✅ Product price type: ${typeof product.price} (${product.price})`);
      console.log(`✅ Product isActive type: ${typeof product.isActive} (${product.isActive})`);
      console.log(`✅ Product attributes type: ${typeof product.attributes}`);
    }
  } catch (error) {
    console.log(
      `❌ Error checking schema: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  await prisma.$disconnect();
  console.log('\n✅ Database integrity check completed');
}

// Run if called directly
if (require.main === module) {
  checkDatabaseIntegrity().catch(console.error);
}

export { checkDatabaseIntegrity };
