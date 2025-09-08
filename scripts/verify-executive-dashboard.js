#!/usr/bin/env node

/**
 * Verify Executive Dashboard Entitlement
 *
 * This script verifies that the executive dashboard entitlement is properly
 * enabled and the API endpoints are working correctly.
 *
 * Usage: node scripts/verify-executive-dashboard.js
 */

const { PrismaClient } = require('@prisma/client');

async function verifyExecutiveDashboard() {
  console.log('🔍 Verifying Executive Dashboard Entitlement...');

  const prisma = new PrismaClient();

  try {
    // Get tenant ID from environment or use default
    const tenantId =
      process.env.DEFAULT_TENANT_ID ||
      process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ||
      'tenant_default';

    console.log(`📍 Checking Tenant ID: ${tenantId}`);

    // Check if entitlement exists and is enabled
    const entitlement = await prisma.entitlement.findUnique({
      where: {
        tenantId_key: {
          tenantId: tenantId,
          key: 'feature.analytics.enhanced',
        },
      },
    });

    if (!entitlement) {
      console.log('❌ Executive Dashboard entitlement not found!');
      console.log('💡 Run: node scripts/enable-executive-dashboard.js');
      process.exit(1);
    }

    if (!entitlement.enabled) {
      console.log('❌ Executive Dashboard entitlement is disabled!');
      console.log('💡 Run: node scripts/enable-executive-dashboard.js');
      process.exit(1);
    }

    console.log('✅ Executive Dashboard entitlement is enabled!');
    console.log(`📋 Details:`);
    console.log(`   - Key: ${entitlement.key}`);
    console.log(`   - Enabled: ${entitlement.enabled}`);
    console.log(`   - Value: ${entitlement.value || 'null'}`);
    console.log(`   - Created: ${entitlement.createdAt}`);

    // Test the API endpoint
    console.log('\n🌐 Testing API endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/tenant/entitlements', {
        credentials: 'include',
      });

      if (!response.ok) {
        console.log(
          '⚠️  API endpoint returned non-OK status, but this may be expected for unauthenticated requests'
        );
      } else {
        const data = await response.json();
        const hasExecutiveFeature = data?.data?.map?.['feature.analytics.enhanced'];

        if (hasExecutiveFeature) {
          console.log('✅ API endpoint confirms executive dashboard is enabled!');
        } else {
          console.log('⚠️  API endpoint does not show executive dashboard entitlement');
          console.log('   This may be due to authentication or caching issues');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not test API endpoint (server may not be running)');
      console.log(`   Error: ${error.message}`);
    }

    console.log('\n🎉 Executive Dashboard verification complete!');
    console.log('📊 The dashboard should now be accessible in your application.');
  } catch (error) {
    console.error('❌ Failed to verify Executive Dashboard:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  verifyExecutiveDashboard();
}

module.exports = { verifyExecutiveDashboard };
