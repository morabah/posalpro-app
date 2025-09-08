#!/usr/bin/env node

/**
 * Enable Executive Dashboard Entitlement
 *
 * This script enables the executive dashboard feature by creating/updating
 * the entitlement record for "feature.analytics.enhanced" in the database.
 *
 * Usage: node scripts/enable-executive-dashboard.js
 */

const { PrismaClient } = require('@prisma/client');

async function enableExecutiveDashboard() {
  console.log('🔓 Unlocking Executive Dashboard...');

  const prisma = new PrismaClient();

  try {
    // Get tenant ID from environment or use default
    const tenantId =
      process.env.DEFAULT_TENANT_ID ||
      process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ||
      'tenant_default';

    console.log(`📍 Using Tenant ID: ${tenantId}`);

    // Check if entitlement already exists
    const existingEntitlement = await prisma.entitlement.findUnique({
      where: {
        tenantId_key: {
          tenantId: tenantId,
          key: 'feature.analytics.enhanced',
        },
      },
    });

    if (existingEntitlement) {
      if (existingEntitlement.enabled) {
        console.log('✅ Executive Dashboard is already unlocked!');
        return;
      } else {
        // Enable the existing entitlement
        await prisma.entitlement.update({
          where: {
            tenantId_key: {
              tenantId: tenantId,
              key: 'feature.analytics.enhanced',
            },
          },
          data: {
            enabled: true,
          },
        });
        console.log('✅ Executive Dashboard entitlement enabled!');
      }
    } else {
      // Create new entitlement
      await prisma.entitlement.create({
        data: {
          tenantId: tenantId,
          key: 'feature.analytics.enhanced',
          enabled: true,
          value: 'premium',
        },
      });
      console.log('✅ Executive Dashboard entitlement created and enabled!');
    }

    console.log('\n🎉 Executive Dashboard is now unlocked!');
    console.log('📊 You can now access high-end visualizations and KPIs.');
    console.log('🔄 Refresh your dashboard page to see the changes.');
  } catch (error) {
    console.error('❌ Failed to enable Executive Dashboard:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  enableExecutiveDashboard();
}

module.exports = { enableExecutiveDashboard };
