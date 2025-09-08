#!/usr/bin/env node

/**
 * Enable Any Feature Entitlement
 *
 * Generic script to enable any feature entitlement for the current tenant.
 *
 * Usage: node scripts/enable-feature.js <feature-key> [value]
 *
 * Examples:
 *   node scripts/enable-feature.js feature.analytics.enhanced
 *   node scripts/enable-feature.js feature.workflow.automation premium
 */

const { PrismaClient } = require('@prisma/client');

async function enableFeature() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('❌ Usage: node scripts/enable-feature.js <feature-key> [value]');
    console.log('📝 Examples:');
    console.log('   node scripts/enable-feature.js feature.analytics.enhanced');
    console.log('   node scripts/enable-feature.js feature.workflow.automation premium');
    console.log('');
    console.log('🔍 Available feature keys:');
    console.log('   feature.analytics.dashboard');
    console.log('   feature.analytics.insights');
    console.log('   feature.analytics.enhanced');
    console.log('   feature.products.analytics');
    process.exit(1);
  }

  const featureKey = args[0];
  const value = args[1] || 'enabled';

  console.log(`🔓 Enabling feature: ${featureKey}`);

  const prisma = new PrismaClient();

  try {
    // Get tenant ID from environment
    const tenantId =
      process.env.DEFAULT_TENANT_ID ||
      process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ||
      'tenant_default';

    console.log(`📍 Using Tenant ID: ${tenantId}`);

    // Check current status
    const existingEntitlement = await prisma.entitlement.findUnique({
      where: {
        tenantId_key: {
          tenantId: tenantId,
          key: featureKey,
        },
      },
    });

    if (existingEntitlement?.enabled) {
      console.log(`✅ Feature "${featureKey}" is already enabled!`);
      return;
    }

    // Enable the feature
    const entitlement = await prisma.entitlement.upsert({
      where: {
        tenantId_key: {
          tenantId: tenantId,
          key: featureKey,
        },
      },
      update: {
        enabled: true,
        value: value,
      },
      create: {
        tenantId: tenantId,
        key: featureKey,
        enabled: true,
        value: value,
      },
    });

    console.log(`✅ Feature "${featureKey}" enabled successfully!`);
    console.log(`📋 Details:`);
    console.log(`   - Key: ${entitlement.key}`);
    console.log(`   - Value: ${entitlement.value}`);
    console.log(`   - Tenant: ${entitlement.tenantId}`);
    console.log(`   - Created: ${entitlement.createdAt}`);
  } catch (error) {
    console.error('❌ Failed to enable feature:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  enableFeature();
}

module.exports = { enableFeature };
