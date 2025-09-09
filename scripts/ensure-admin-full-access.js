#!/usr/bin/env node

/**
 * Ensure Admin User Has Full Access
 * This script ensures the admin user has:
 * - All entitlements enabled
 * - All permissions granted directly
 * - System Administrator role
 * - Full authentication capabilities
 */

const { PrismaClient } = require('@prisma/client');

// Hardcoded entitlement keys since we can't easily import from TypeScript module
const ALL_ENTITLEMENT_KEYS = [
  'feature.analytics.dashboard',
  'feature.analytics.insights',
  'feature.analytics.enhanced',
  'feature.analytics.users',
  'feature.products.create',
  'feature.products.advanced',
  'feature.products.analytics',
  'feature.search.suggestions',
  'feature.users.activity',
];

const prisma = new PrismaClient();

async function ensureAdminFullAccess() {
  console.log('🔐 Ensuring Admin User Has Full Access...\n');

  try {
    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@posalpro.com' },
      include: {
        roles: {
          include: { role: true }
        }
      }
    });

    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }

    console.log(`✅ Found admin user: ${adminUser.name} (${adminUser.email})`);

    // 1. Ensure admin has System Administrator role
    const systemAdminRole = await prisma.role.findFirst({
      where: { name: 'System Administrator' }
    });

    if (!systemAdminRole) {
      console.error('❌ System Administrator role not found');
      return;
    }

    const existingRoleAssignment = await prisma.userRole.findFirst({
      where: {
        userId: adminUser.id,
        roleId: systemAdminRole.id
      }
    });

    if (!existingRoleAssignment) {
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: systemAdminRole.id,
          assignedBy: 'SYSTEM',
          isActive: true
        }
      });
      console.log('✅ Assigned System Administrator role to admin user');
    } else {
      console.log('✅ Admin user already has System Administrator role');
    }

    // 2. Enable ALL entitlements for admin user
    console.log('\n🔑 Enabling all entitlements for admin user...');

    for (const key of ALL_ENTITLEMENT_KEYS) {
      await prisma.entitlement.upsert({
        where: {
          tenantId_key: {
            tenantId: adminUser.tenantId,
            key
          }
        },
        update: { enabled: true },
        create: {
          tenantId: adminUser.tenantId,
          key,
          enabled: true
        }
      });
    }

    console.log(`✅ Enabled ${ALL_ENTITLEMENT_KEYS.length} entitlements for admin`);

    // 3. Grant ALL permissions directly to admin user
    console.log('\n🛡️ Granting all permissions directly to admin user...');
    const allPermissions = await prisma.permission.findMany();

    for (const permission of allPermissions) {
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: adminUser.id,
            permissionId: permission.id
          }
        },
        update: {
          isActive: true,
          grantedBy: 'SYSTEM'
        },
        create: {
          userId: adminUser.id,
          permissionId: permission.id,
          grantedBy: 'SYSTEM',
          isActive: true
        }
      });
    }

    console.log(`✅ Granted ${allPermissions.length} permissions directly to admin`);

    // 4. Verify admin setup
    console.log('\n🔍 Verifying admin setup...');

    const adminEntitlements = await prisma.entitlement.findMany({
      where: {
        tenantId: adminUser.tenantId,
        enabled: true
      }
    });

    const adminPermissions = await prisma.userPermission.findMany({
      where: {
        userId: adminUser.id,
        isActive: true
      },
      include: { permission: true }
    });

    console.log(`📊 Admin entitlements: ${adminEntitlements.length} enabled`);
    console.log(`🛡️ Admin permissions: ${adminPermissions.length} granted`);
    console.log(`🎭 Admin roles: ${adminUser.roles.length} assigned`);

    // 5. Update admin user status if needed
    if (adminUser.status !== 'ACTIVE') {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { status: 'ACTIVE' }
      });
      console.log('✅ Admin user status set to ACTIVE');
    }

    console.log('\n🎉 Admin user now has FULL ACCESS!');
    console.log('   • All entitlements enabled');
    console.log('   • All permissions granted');
    console.log('   • System Administrator role');
    console.log('   • Authentication ready');

    console.log('\n🔑 Admin login credentials:');
    console.log(`   Email: ${adminUser.email}`);
    console.log('   Password: ProposalPro2024!');

  } catch (error) {
    console.error('❌ Error ensuring admin full access:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
ensureAdminFullAccess();
