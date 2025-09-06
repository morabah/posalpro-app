'use strict';

// Toggle an entitlement for a tenant
// Usage:
//   node scripts/toggle-entitlement.js <tenantId> <key> <enable|disable> [value]

const { PrismaClient } = require('@prisma/client');

async function main() {
  const [tenantId, key, action, value] = process.argv.slice(2);
  if (!tenantId || !key || !action) {
    console.error('Usage: node scripts/toggle-entitlement.js <tenantId> <key> <enable|disable> [value]');
    process.exit(1);
  }
  const enable = action.toLowerCase() === 'enable' ? true : action.toLowerCase() === 'disable' ? false : null;
  if (enable === null) {
    console.error('Third arg must be "enable" or "disable"');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    // Upsert entitlement
    const existing = await prisma.entitlement.findFirst({ where: { tenantId, key } });
    if (existing) {
      const updated = await prisma.entitlement.update({
        where: { id: existing.id },
        data: { enabled: enable, value: typeof value === 'string' ? value : existing.value },
      });
      console.log(`Updated entitlement ${key} for tenant ${tenantId}: enabled=${updated.enabled}, value=${updated.value ?? 'null'}`);
    } else {
      const created = await prisma.entitlement.create({
        data: { tenantId, key, enabled: enable, value: typeof value === 'string' ? value : null },
      });
      console.log(`Created entitlement ${key} for tenant ${tenantId}: enabled=${created.enabled}, value=${created.value ?? 'null'}`);
    }
  } catch (err) {
    console.error('Failed to toggle entitlement:', err && err.message ? err.message : err);
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main();

