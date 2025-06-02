/**
 * PosalPro MVP2 - Database Seed Script
 * Initializes authentication system with default roles, permissions, and configuration
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PosalPro MVP2 database seeding...');

  // ========================================
  // PERMISSIONS SETUP
  // ========================================

  console.log('📝 Creating permissions...');

  const permissions = [
    // User Management
    { resource: 'users', action: 'create', scope: 'ALL' },
    { resource: 'users', action: 'read', scope: 'ALL' },
    { resource: 'users', action: 'read', scope: 'TEAM' },
    { resource: 'users', action: 'read', scope: 'OWN' },
    { resource: 'users', action: 'update', scope: 'ALL' },
    { resource: 'users', action: 'update', scope: 'OWN' },
    { resource: 'users', action: 'delete', scope: 'ALL' },

    // Proposal Management
    { resource: 'proposals', action: 'create', scope: 'ALL' },
    { resource: 'proposals', action: 'create', scope: 'TEAM' },
    { resource: 'proposals', action: 'read', scope: 'ALL' },
    { resource: 'proposals', action: 'read', scope: 'TEAM' },
    { resource: 'proposals', action: 'read', scope: 'OWN' },
    { resource: 'proposals', action: 'update', scope: 'ALL' },
    { resource: 'proposals', action: 'update', scope: 'TEAM' },
    { resource: 'proposals', action: 'update', scope: 'OWN' },
    { resource: 'proposals', action: 'delete', scope: 'ALL' },
    { resource: 'proposals', action: 'delete', scope: 'OWN' },
    { resource: 'proposals', action: 'approve', scope: 'ALL' },
    { resource: 'proposals', action: 'approve', scope: 'TEAM' },
    { resource: 'proposals', action: 'submit', scope: 'ALL' },
    { resource: 'proposals', action: 'submit', scope: 'OWN' },

    // Product Management
    { resource: 'products', action: 'create', scope: 'ALL' },
    { resource: 'products', action: 'read', scope: 'ALL' },
    { resource: 'products', action: 'update', scope: 'ALL' },
    { resource: 'products', action: 'delete', scope: 'ALL' },
    { resource: 'products', action: 'validate', scope: 'ALL' },

    // Customer Management
    { resource: 'customers', action: 'create', scope: 'ALL' },
    { resource: 'customers', action: 'create', scope: 'TEAM' },
    { resource: 'customers', action: 'read', scope: 'ALL' },
    { resource: 'customers', action: 'read', scope: 'TEAM' },
    { resource: 'customers', action: 'update', scope: 'ALL' },
    { resource: 'customers', action: 'update', scope: 'TEAM' },
    { resource: 'customers', action: 'delete', scope: 'ALL' },

    // Analytics & Reporting
    { resource: 'analytics', action: 'read', scope: 'ALL' },
    { resource: 'analytics', action: 'read', scope: 'TEAM' },
    { resource: 'analytics', action: 'read', scope: 'OWN' },
    { resource: 'reports', action: 'create', scope: 'ALL' },
    { resource: 'reports', action: 'create', scope: 'TEAM' },
    { resource: 'reports', action: 'read', scope: 'ALL' },
    { resource: 'reports', action: 'read', scope: 'TEAM' },
    { resource: 'reports', action: 'export', scope: 'ALL' },
    { resource: 'reports', action: 'export', scope: 'TEAM' },

    // System Administration
    { resource: 'system', action: 'configure', scope: 'ALL' },
    { resource: 'system', action: 'monitor', scope: 'ALL' },
    { resource: 'audit', action: 'read', scope: 'ALL' },
    { resource: 'security', action: 'manage', scope: 'ALL' },

    // Role & Permission Management
    { resource: 'roles', action: 'create', scope: 'ALL' },
    { resource: 'roles', action: 'read', scope: 'ALL' },
    { resource: 'roles', action: 'update', scope: 'ALL' },
    { resource: 'roles', action: 'delete', scope: 'ALL' },
    { resource: 'permissions', action: 'assign', scope: 'ALL' },
    { resource: 'permissions', action: 'revoke', scope: 'ALL' },

    // Hypothesis Testing & Validation
    { resource: 'hypotheses', action: 'create', scope: 'ALL' },
    { resource: 'hypotheses', action: 'read', scope: 'ALL' },
    { resource: 'hypotheses', action: 'validate', scope: 'ALL' },
    { resource: 'experiments', action: 'run', scope: 'ALL' },
    { resource: 'experiments', action: 'analyze', scope: 'ALL' },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: {
        resource_action_scope: {
          resource: perm.resource,
          action: perm.action,
          scope: perm.scope as 'ALL' | 'TEAM' | 'OWN',
        },
      },
      update: {},
      create: {
        resource: perm.resource,
        action: perm.action,
        scope: perm.scope as 'ALL' | 'TEAM' | 'OWN',
      },
    });
    createdPermissions.push(permission);
  }

  console.log(`✅ Created ${createdPermissions.length} permissions`);

  // ========================================
  // ROLES SETUP
  // ========================================

  console.log('🎭 Creating roles...');

  // System Admin Role
  const systemAdminRole = await prisma.role.upsert({
    where: { name: 'System Administrator' },
    update: {},
    create: {
      name: 'System Administrator',
      description: 'Full system access with all administrative capabilities',
      level: 1,
      isSystem: true,
      performanceExpectations: {
        systemUptime: 99.9,
        responseTime: 2.0,
        securityIncidents: 0,
      },
    },
  });

  // Executive Role
  const executiveRole = await prisma.role.upsert({
    where: { name: 'Executive' },
    update: {},
    create: {
      name: 'Executive',
      description: 'Executive-level access with strategic oversight capabilities',
      level: 2,
      isSystem: true,
      performanceExpectations: {
        proposalApprovalTime: 24.0,
        strategicDecisionQuality: 95.0,
        teamPerformance: 90.0,
      },
    },
  });

  // Proposal Manager Role
  const proposalManagerRole = await prisma.role.upsert({
    where: { name: 'Proposal Manager' },
    update: {},
    create: {
      name: 'Proposal Manager',
      description: 'Comprehensive proposal management with team coordination',
      level: 3,
      isSystem: true,
      performanceExpectations: {
        proposalCompletionRate: 95.0,
        teamCoordination: 90.0,
        qualityScore: 85.0,
        timelineAdherence: 88.0,
      },
    },
  });

  // Senior SME Role
  const seniorSMERole = await prisma.role.upsert({
    where: { name: 'Senior SME' },
    update: {},
    create: {
      name: 'Senior SME',
      description: 'Senior subject matter expert with mentoring responsibilities',
      level: 4,
      isSystem: true,
      performanceExpectations: {
        expertiseAccuracy: 95.0,
        contentQuality: 90.0,
        mentoring: 85.0,
        responseTime: 4.0,
      },
    },
  });

  // SME Role
  const smeRole = await prisma.role.upsert({
    where: { name: 'SME' },
    update: {},
    create: {
      name: 'SME',
      description: 'Subject matter expert with content creation capabilities',
      level: 5,
      isSystem: true,
      performanceExpectations: {
        contentQuality: 85.0,
        responseTime: 6.0,
        collaboration: 80.0,
      },
    },
  });

  // Contributor Role
  const contributorRole = await prisma.role.upsert({
    where: { name: 'Contributor' },
    update: {},
    create: {
      name: 'Contributor',
      description: 'Basic contribution access with limited proposal capabilities',
      level: 6,
      isSystem: true,
      performanceExpectations: {
        taskCompletion: 90.0,
        qualityScore: 75.0,
        timeliness: 85.0,
      },
    },
  });

  // Viewer Role
  const viewerRole = await prisma.role.upsert({
    where: { name: 'Viewer' },
    update: {},
    create: {
      name: 'Viewer',
      description: 'Read-only access for observation and learning',
      level: 7,
      isSystem: true,
      performanceExpectations: {
        engagementLevel: 70.0,
      },
    },
  });

  console.log('✅ Created system roles');

  // ========================================
  // DEFAULT ADMIN USER
  // ========================================

  console.log('👤 Creating default admin user...');

  const hashedPassword = await bcrypt.hash('PosalPro2024!', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@posalpro.com' },
    update: {},
    create: {
      email: 'admin@posalpro.com',
      name: 'System Administrator',
      password: hashedPassword,
      department: 'IT',
      status: 'ACTIVE',
    },
  });

  // Assign System Administrator role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: systemAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: systemAdminRole.id,
      assignedBy: 'system',
      isActive: true,
    },
  });

  console.log('✅ Created default admin user (admin@posalpro.com)');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
