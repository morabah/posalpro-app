#!/usr/bin/env node

/**
 * List All Feature Entitlements
 *
 * Display all feature entitlements and their current status for the tenant.
 *
 * Usage: node scripts/list-features.js [--all]
 *
 * Options:
 *   --all    Show all tenants (admin only)
 */

const { PrismaClient } = require('@prisma/client');

async function listFeatures() {
  const args = process.argv.slice(2);
  const showAll = args.includes('--all');

  const prisma = new PrismaClient();

  try {
    // Get tenant ID from environment
    const tenantId =
      process.env.DEFAULT_TENANT_ID ||
      process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ||
      'tenant_default';

    console.log('🔍 Feature Entitlement Status\n');

    let entitlements;

    if (showAll) {
      console.log('📊 Showing ALL tenants:\n');
      entitlements = await prisma.entitlement.findMany({
        orderBy: [{ tenantId: 'asc' }, { key: 'asc' }],
      });
    } else {
      console.log(`📍 Showing tenant: ${tenantId}\n`);
      entitlements = await prisma.entitlement.findMany({
        where: { tenantId },
        orderBy: { key: 'asc' },
      });
    }

    if (entitlements.length === 0) {
      console.log('❌ No entitlements found.');
      console.log('💡 Use scripts/enable-feature.js to add entitlements.');
      return;
    }

    // Group by tenant if showing all
    if (showAll) {
      const grouped = entitlements.reduce((acc, ent) => {
        if (!acc[ent.tenantId]) acc[ent.tenantId] = [];
        acc[ent.tenantId].push(ent);
        return acc;
      }, {});

      Object.entries(grouped).forEach(([tid, ents]) => {
        console.log(`🏢 Tenant: ${tid}`);
        displayEntitlements(ents);
        console.log('');
      });
    } else {
      displayEntitlements(entitlements);
    }

    console.log('\n📋 Summary:');
    console.log(`   Total entitlements: ${entitlements.length}`);
    console.log(`   Enabled features: ${entitlements.filter(e => e.enabled).length}`);
    console.log(`   Disabled features: ${entitlements.filter(e => !e.enabled).length}`);
  } catch (error) {
    console.error('❌ Failed to list features:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function displayEntitlements(entitlements) {
  const enabled = entitlements.filter(e => e.enabled);
  const disabled = entitlements.filter(e => !e.enabled);

  if (enabled.length > 0) {
    console.log('  ✅ Enabled:');
    enabled.forEach(ent => {
      console.log(`     • ${ent.key} ${ent.value ? `(${ent.value})` : ''}`);
    });
  }

  if (disabled.length > 0) {
    console.log('  ❌ Disabled:');
    disabled.forEach(ent => {
      console.log(`     • ${ent.key} ${ent.value ? `(${ent.value})` : ''}`);
    });
  }

  if (enabled.length === 0 && disabled.length === 0) {
    console.log('     (no entitlements)');
  }
}

// Run the script
if (require.main === module) {
  listFeatures();
}

module.exports = { listFeatures };
