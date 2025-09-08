#!/usr/bin/env node

/**
 * Disable Feature Entitlement
 *
 * Disable a specific feature entitlement for the current tenant.
 *
 * Usage: node scripts/disable-feature.js <feature-key>
 *
 * Examples:
 *   node scripts/disable-feature.js feature.analytics.enhanced
 *   node scripts/disable-feature.js feature.workflow.automation
 */

const { PrismaClient } = require('@prisma/client');

async function disableFeature() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('❌ Usage: node scripts/disable-feature.js <feature-key>');
    console.log('📝 Examples:');
    console.log('   node scripts/disable-feature.js feature.analytics.enhanced');
    console.log('   node scripts/disable-feature.js feature.workflow.automation');
    process.exit(1);
  }

  const featureKey = args[0];
  console.log(`🔒 Disabling feature: ${featureKey}`);

  const prisma = new PrismaClient();

  try {
    // Get tenant ID from environment
    const tenantId =
      process.env.DEFAULT_TENANT_ID ||
      process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ||
      'tenant_default';

    console.log(`📍 Using Tenant ID: ${tenantId}`);

    // Check if entitlement exists
    const existingEntitlement = await prisma.entitlement.findUnique({
      where: {
        tenantId_key: {
          tenantId: tenantId,
          key: featureKey,
        },
      },
    });

    if (!existingEntitlement) {
      console.log(`❌ Feature "${featureKey}" is not enabled for this tenant.`);
      return;
    }

    if (!existingEntitlement.enabled) {
      console.log(`⚠️  Feature "${featureKey}" is already disabled.`);
      return;
    }

    // Disable the feature
    await prisma.entitlement.update({
      where: {
        tenantId_key: {
          tenantId: tenantId,
          key: featureKey,
        },
      },
      data: {
        enabled: false,
      },
    });

    console.log(`✅ Feature "${featureKey}" disabled successfully!`);
    console.log('🔄 Users will see the locked banner when they refresh the page.');
  } catch (error) {
    console.error('❌ Failed to disable feature:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  disableFeature();
}

module.exports = { disableFeature };
