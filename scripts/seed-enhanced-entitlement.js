/*
  Upserts the 'feature.analytics.enhanced' entitlement for the admin tenant.
  Usage:
    DATABASE_URL="postgresql://..." node scripts/seed-enhanced-entitlement.js
*/

const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const admin = await prisma.user.findFirst({ where: { email: 'admin@posalpro.com' } });
    if (!admin) {
      console.error('Admin user not found');
      process.exit(1);
    }
    const upserted = await prisma.entitlement.upsert({
      where: { tenantId_key: { tenantId: admin.tenantId, key: 'feature.analytics.enhanced' } },
      update: { enabled: true },
      create: { tenantId: admin.tenantId, key: 'feature.analytics.enhanced', enabled: true },
    });
    console.log('Entitlement ensured:', upserted.tenantId, upserted.key, upserted.enabled);
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Seeding entitlement failed:', e?.message || e);
    try {
      await prisma.$disconnect();
    } catch (e2) {}
    process.exit(1);
  }
})();
