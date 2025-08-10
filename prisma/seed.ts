/**
 * PosalPro MVP2 - Database Seed Script
 * Initializes production-ready data with comprehensive sample data
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Platform compatibility: Using bcryptjs (pure JS) instead of bcrypt (native)
// This ensures consistent behavior across all environments (dev, CI, production)

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PosalPro MVP2 production database seeding...');

  // ========================================
  // PRE-FLIGHT: Seed only if database is empty
  // ========================================
  const [userCount, roleCount, customerCount, productCount, contentCount, proposalCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.role.count(),
      prisma.customer.count(),
      prisma.product.count(),
      prisma.content.count(),
      prisma.proposal.count(),
    ]);

  const totalExisting =
    userCount + roleCount + customerCount + productCount + contentCount + proposalCount;
  if (totalExisting > 0) {
    console.log(
      `ℹ️ Database already contains some data (users: ${userCount}, roles: ${roleCount}, customers: ${customerCount}, products: ${productCount}, content: ${contentCount}, proposals: ${proposalCount}). Performing selective seeding for empty tables only.`
    );

    // Helpers for top-ups
    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const randomInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    // Ensure Content has at least a baseline of templates/documents
    if (contentCount === 0) {
      console.log('📄 Content empty — creating initial templates/resources...');
      const fallbackUser = await prisma.user.findFirst({ select: { id: true, email: true } });
      const contentItems = [
        {
          title: 'Executive Summary Template',
          type: 'TEMPLATE' as const,
          category: ['Executive'],
          content: 'Executive summary template for high-level proposal overview...',
          tags: ['executive', 'summary', 'overview'],
        },
        {
          title: 'Technical Architecture Overview',
          type: 'TEMPLATE' as const,
          category: ['Technical'],
          content: 'Technical architecture template for system design proposals...',
          tags: ['technical', 'architecture', 'system-design'],
        },
        {
          title: 'Security Compliance Framework',
          type: 'DOCUMENT' as const,
          category: ['Security'],
          content: 'Comprehensive security compliance framework and requirements...',
          tags: ['security', 'compliance', 'framework'],
        },
      ];
      for (const item of contentItems) {
        await prisma.content.create({
          data: {
            title: item.title,
            type: item.type,
            category: item.category,
            content: item.content,
            tags: item.tags,
            isActive: true,
            createdBy: fallbackUser?.id ?? 'unknown',
          },
        });
      }
      console.log('✅ Seeded initial Content items');
    }

    // Top-up templates if below minimum threshold
    const templateCount = await prisma.content.count({
      where: { type: 'TEMPLATE', isActive: true },
    });
    if (templateCount < 2) {
      console.log(`📄 TEMPLATE content low (${templateCount}) — topping up...`);
      const fallbackUser2 = await prisma.user.findFirst({ select: { id: true } });
      const toCreate = 2 - templateCount;
      const templates = [
        {
          title: 'Proposal Strategy Template',
          category: ['Executive'],
          content: 'Standard strategy outline including goals, risks, and KPIs...',
          tags: ['strategy', 'executive'],
        },
        {
          title: 'Implementation Plan Template',
          category: ['Project Management'],
          content: 'Milestones, tasks, dependencies, and timeline structure...',
          tags: ['implementation', 'timeline'],
        },
      ];
      for (let i = 0; i < toCreate; i++) {
        await prisma.content.create({
          data: {
            title: templates[i].title,
            type: 'TEMPLATE',
            category: templates[i].category,
            content: templates[i].content,
            tags: templates[i].tags,
            isActive: true,
            createdBy: fallbackUser2?.id ?? 'unknown',
          },
        });
      }
      console.log('✅ TEMPLATE content topped up');
    }

    // Top-up PRODUCTS to at least 25 for realistic variety
    const TARGET_PRODUCTS = 25;
    const currentProducts = await prisma.product.count();
    if (currentProducts < TARGET_PRODUCTS) {
      console.log(`📦 Products low (${currentProducts}) — generating up to ${TARGET_PRODUCTS}...`);
      const categories = [
        'Cloud Infrastructure',
        'Analytics',
        'Security',
        'Data Management',
        'Development Tools',
        'IoT',
        'AI/ML',
        'Integration',
        'Monitoring',
      ];
      const baseSkus = ['ECP', 'AAS', 'SMS', 'DIP', 'MDF', 'IMP', 'AIM', 'INT', 'MON'];
      const toCreate = TARGET_PRODUCTS - currentProducts;
      for (let i = 0; i < toCreate; i++) {
        const name = `${pick([
          'Enterprise',
          'Advanced',
          'NextGen',
          'Pro',
          'Ultra',
          'Cloud',
          'Edge',
        ])} ${pick(['Platform', 'Suite', 'System', 'Service', 'Toolkit'])}`;
        const sku = `${pick(baseSkus)}-${randomInt(1, 9)}.${randomInt(0, 9)}-${Date.now()}-${i}`;
        await prisma.product.create({
          data: {
            name,
            description: `${name} for ${pick(['scalability', 'security', 'analytics', 'productivity'])}`,
            sku,
            price: randomInt(3000, 25000),
            currency: 'USD',
            category: [pick(categories)],
            tags: [pick(['cloud', 'ai', 'security', 'etl', 'mobile', 'iot', 'ops'])],
            isActive: true,
          },
        });
      }
      console.log('✅ Products topped up');
    }

    // Top-up PROPOSALS to at least 50 with realistic fields and relationships
    const TARGET_PROPOSALS = 50;
    const currentProposals = await prisma.proposal.count();
    if (currentProposals < TARGET_PROPOSALS) {
      console.log(
        `📋 Proposals low (${currentProposals}) — generating up to ${TARGET_PROPOSALS}...`
      );

      // Resolve helper maps
      const customers = await prisma.customer.findMany({
        select: { id: true, name: true, industry: true },
      });
      const products = await prisma.product.findMany({
        select: { id: true, name: true, price: true },
      });
      const users = await prisma.user.findMany({ select: { id: true, email: true } });

      const emailToId = new Map(users.map(u => [u.email, u.id] as const));

      const pickUserId = (emails: string[]) => {
        const choices = emails.map(e => emailToId.get(e)).filter(Boolean) as string[];
        return choices.length ? pick(choices) : users.length ? pick(users).id : undefined;
      };

      const toCreate = TARGET_PROPOSALS - currentProposals;
      for (let i = 0; i < toCreate; i++) {
        const customer = pick(customers);
        const creatorId = pick(users).id;
        const dueDate = new Date(Date.now() + randomInt(20, 120) * 24 * 60 * 60 * 1000);
        const rfp = `RFP-${new Date().getFullYear()}-${String(currentProposals + i + 1).padStart(3, '0')}`;
        const selectedProducts = Array.from({ length: randomInt(1, 3) }, () => pick(products));
        const value = selectedProducts.reduce((sum, p) => sum + p.price * randomInt(1, 3), 0);

        const teamLead = pickUserId(['pm1@posalpro.com', 'pm2@posalpro.com']);
        const salesRep = pickUserId(['pm2@posalpro.com', 'pm1@posalpro.com']);
        const sme = pickUserId(['sme1@posalpro.com', 'sme2@posalpro.com', 'sme3@posalpro.com']);

        const newProposal = await prisma.proposal.create({
          data: {
            title: `${pick(['Cloud', 'Analytics', 'Security', 'IoT', 'Data'])} ${pick([
              'Transformation',
              'Implementation',
              'Optimization',
              'Migration',
              'Modernization',
            ])} for ${customer.name}`,
            description: 'Auto-generated realistic project with full metadata and assignments.',
            status: pick(['DRAFT', 'IN_REVIEW', 'APPROVED', 'SUBMITTED']) as any,
            priority: pick(['LOW', 'MEDIUM', 'HIGH']) as any,
            customerId: customer.id,
            createdBy: creatorId,
            dueDate,
            // Store RFP only in metadata wizardData to match current schema
            metadata: {
              wizardData: {
                step1: {
                  client: {
                    name: customer.name,
                    industry: customer.industry,
                    contactPerson: 'Primary Contact',
                    contactEmail: 'contact@example.com',
                    contactPhone: '+1-555-0000',
                  },
                  details: {
                    title: 'Auto Generated Proposal',
                    rfpReferenceNumber: rfp,
                    dueDate,
                    estimatedValue: value,
                    priority: 'MEDIUM',
                    description: 'Generated by seed for realistic testing',
                  },
                },
                step2: {
                  teamLead,
                  salesRepresentative: salesRep,
                  subjectMatterExperts: { TECHNICAL: sme },
                },
                step3: { selectedContent: [] },
                step4: { products: selectedProducts.map(p => p.id) },
                step5: {
                  sections: [
                    { id: '1', title: 'Executive Summary', required: true, estimatedHours: 6 },
                    {
                      id: '2',
                      title: 'Understanding & Requirements',
                      required: true,
                      estimatedHours: 10,
                    },
                    { id: '3', title: 'Technical Approach', required: true, estimatedHours: 18 },
                    { id: '4', title: 'Implementation Plan', required: true, estimatedHours: 14 },
                    {
                      id: '5',
                      title: 'Pricing & Commercial Terms',
                      required: true,
                      estimatedHours: 10,
                    },
                  ],
                  sectionAssignments: {
                    'Executive Summary': teamLead,
                    'Technical Approach': sme,
                    'Pricing & Commercial Terms': salesRep,
                  },
                },
              },
              teamAssignments: {
                teamLead,
                salesRepresentative: salesRep,
                subjectMatterExperts: { TECHNICAL: sme },
              },
            },
            value,
            currency: 'USD',
            tags: ['auto', 'seed', 'demo'],
            assignedTo: { connect: [teamLead, salesRep, sme].filter(Boolean).map(id => ({ id })) },
          },
        });

        // Link products
        for (const prod of selectedProducts) {
          await prisma.proposalProduct.create({
            data: {
              proposalId: newProposal.id,
              productId: prod.id,
              quantity: randomInt(1, 3),
              unitPrice: prod.price,
              total: prod.price,
            },
          });
        }

        // Add sections
        const secDefs = [
          { title: 'Executive Summary', type: 'TEXT', order: 1 },
          { title: 'Technical Requirements', type: 'TEXT', order: 2 },
          { title: 'Product Configuration', type: 'PRODUCTS', order: 3 },
          { title: 'Implementation Plan', type: 'TEXT', order: 4 },
          { title: 'Pricing and Terms', type: 'PRICING', order: 5 },
        ];
        for (const s of secDefs) {
          await prisma.proposalSection.create({
            data: {
              proposalId: newProposal.id,
              title: s.title,
              content: `${s.title} details for ${newProposal.title}`,
              type: s.type as any,
              order: s.order,
            },
          });
        }

        // Update counts
        const productCount = await prisma.proposalProduct.count({
          where: { proposalId: newProposal.id },
        });
        const sectionCount = await prisma.proposalSection.count({
          where: { proposalId: newProposal.id },
        });
        await prisma.proposal.update({
          where: { id: newProposal.id },
          data: { productCount, sectionCount },
        });
      }
      console.log('✅ Proposals topped up');
    }

    // Backfill missing rfpReferenceNumber and counts for any existing proposals
    {
      const toBackfill = await prisma.proposal.findMany({
        where: { OR: [{ productCount: 0 }, { sectionCount: 0 }] },
        select: { id: true, productCount: true, sectionCount: true },
      });
      for (const p of toBackfill) {
        const productCount =
          p.productCount || (await prisma.proposalProduct.count({ where: { proposalId: p.id } }));
        const sectionCount =
          p.sectionCount || (await prisma.proposalSection.count({ where: { proposalId: p.id } }));
        await prisma.proposal.update({
          where: { id: p.id },
          data: { productCount, sectionCount },
        });
      }
      if (toBackfill.length) console.log(`🔧 Backfilled proposals: ${toBackfill.length}`);
    }

    // Ensure at least a couple of ApprovalWorkflow templates exist
    const workflowCount = await prisma.approvalWorkflow.count();
    if (workflowCount === 0) {
      console.log('🧭 ApprovalWorkflow empty — creating baseline workflows...');
      const creator = await prisma.user.findFirst({ select: { id: true } });
      const proposalWorkflow = await prisma.approvalWorkflow.create({
        data: {
          name: 'Standard Proposal Approval',
          description: 'Two-stage review and approval for proposals',
          entityType: 'PROPOSAL',
          createdBy: creator?.id ?? 'unknown',
          stages: {
            create: [
              { name: 'Manager Review', order: 1, slaHours: 24 },
              { name: 'Executive Approval', order: 2, slaHours: 48 },
            ],
          },
        },
      });
      await prisma.approvalWorkflow.create({
        data: {
          name: 'Content Quality Review',
          description: 'Quality and compliance review for content items',
          entityType: 'CONTENT',
          createdBy: creator?.id ?? 'unknown',
          stages: { create: [{ name: 'Content Manager Review', order: 1, slaHours: 12 }] },
        },
      });
      console.log('✅ Created baseline ApprovalWorkflow templates:', proposalWorkflow.name);
    }

    // Assign participants to proposals if none assigned
    const proposals = await prisma.proposal.findMany({ select: { id: true } });
    if (proposals.length > 0) {
      const assignableUsers = await prisma.user.findMany({ take: 2, select: { id: true } });
      if (assignableUsers.length > 0) {
        for (const p of proposals.slice(0, 3)) {
          await prisma.proposal.update({
            where: { id: p.id },
            data: {
              assignedTo: { connect: assignableUsers.map(u => ({ id: u.id })) },
            },
          });
        }
        console.log('✅ Assigned users to proposals for initial participants');
      }
    }

    // Done with selective seeding
    return;
  }

  // ========================================
  // CLEAN EXISTING DATA (if needed)
  // ========================================

  console.log('🧹 Cleaning existing data...');

  // Clean in dependency order
  await prisma.proposalProduct.deleteMany();
  await prisma.proposalSection.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.productRelationship.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customerContact.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.content.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

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

    // Content Management
    { resource: 'content', action: 'create', scope: 'ALL' },
    { resource: 'content', action: 'read', scope: 'ALL' },
    { resource: 'content', action: 'update', scope: 'ALL' },
    { resource: 'content', action: 'delete', scope: 'ALL' },

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

  const roles = [
    {
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
    {
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
    {
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
    {
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
    {
      name: 'SME',
      description: 'Subject matter expert providing technical expertise',
      level: 5,
      isSystem: true,
      performanceExpectations: {
        expertiseAccuracy: 90.0,
        contentQuality: 85.0,
        responseTime: 6.0,
      },
    },
    {
      name: 'Content Manager',
      description: 'Content creation and management specialist',
      level: 6,
      isSystem: true,
      performanceExpectations: {
        contentQuality: 88.0,
        contentVolume: 75.0,
        turnaroundTime: 48.0,
      },
    },
  ];

  const createdRoles: Record<string, any> = {};
  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    createdRoles[roleData.name] = role;
  }

  console.log(`✅ Created ${Object.keys(createdRoles).length} roles`);

  // ========================================
  // ROLE PERMISSIONS ASSIGNMENT
  // ========================================

  console.log('🔐 Assigning role permissions...');

  // System Administrator - All permissions
  const adminRole = createdRoles['System Administrator'];
  for (const permission of createdPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: permission.id,
        grantedBy: 'SYSTEM',
      },
    });
  }

  // Proposal Manager - Proposal and team permissions
  const proposalManagerRole = createdRoles['Proposal Manager'];
  const proposalManagerPermissions = createdPermissions.filter(
    p =>
      ['proposals', 'customers', 'content', 'analytics', 'reports', 'users'].includes(p.resource) &&
      ['ALL', 'TEAM', 'OWN'].includes(p.scope)
  );

  for (const permission of proposalManagerPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: proposalManagerRole.id,
        permissionId: permission.id,
        grantedBy: 'SYSTEM',
      },
    });
  }

  // SME - Content and validation permissions
  const smeRole = createdRoles['SME'];
  const smePermissions = createdPermissions.filter(
    p =>
      ['content', 'products', 'proposals'].includes(p.resource) &&
      ['read', 'validate', 'update'].includes(p.action) &&
      ['ALL', 'TEAM', 'OWN'].includes(p.scope)
  );

  for (const permission of smePermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: smeRole.id,
        permissionId: permission.id,
        grantedBy: 'SYSTEM',
      },
    });
  }

  // Content Manager - Content management permissions
  const contentManagerRole = createdRoles['Content Manager'];
  const contentManagerPermissions = createdPermissions.filter(
    p =>
      ['content', 'proposals'].includes(p.resource) &&
      ['create', 'read', 'update'].includes(p.action)
  );

  for (const permission of contentManagerPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: contentManagerRole.id,
        permissionId: permission.id,
        grantedBy: 'SYSTEM',
      },
    });
  }

  console.log('✅ Role permissions assigned');

  // ========================================
  // USERS SETUP
  // ========================================

  console.log('👥 Creating users...');

  const defaultPassword = await bcrypt.hash('ProposalPro2024!', 12);

  const usersData = [
    {
      email: 'admin@posalpro.com',
      name: 'System Administrator',
      password: defaultPassword,
      department: 'IT',
      status: 'ACTIVE',
      roleName: 'System Administrator',
    },
    {
      email: 'ceo@posalpro.com',
      name: 'Sarah Johnson',
      password: defaultPassword,
      department: 'Executive',
      status: 'ACTIVE',
      roleName: 'Executive',
    },
    {
      email: 'pm1@posalpro.com',
      name: 'Michael Chen',
      password: defaultPassword,
      department: 'Business Development',
      status: 'ACTIVE',
      roleName: 'Proposal Manager',
    },
    {
      email: 'pm2@posalpro.com',
      name: 'Emma Rodriguez',
      password: defaultPassword,
      department: 'Business Development',
      status: 'ACTIVE',
      roleName: 'Proposal Manager',
    },
    {
      email: 'sme1@posalpro.com',
      name: 'Dr. James Wilson',
      password: defaultPassword,
      department: 'Technology',
      status: 'ACTIVE',
      roleName: 'Senior SME',
    },
    {
      email: 'sme2@posalpro.com',
      name: 'Lisa Zhang',
      password: defaultPassword,
      department: 'Engineering',
      status: 'ACTIVE',
      roleName: 'SME',
    },
    {
      email: 'sme3@posalpro.com',
      name: 'David Kim',
      password: defaultPassword,
      department: 'Security',
      status: 'ACTIVE',
      roleName: 'SME',
    },
    {
      email: 'content1@posalpro.com',
      name: 'Maria Garcia',
      password: defaultPassword,
      department: 'Marketing',
      status: 'ACTIVE',
      roleName: 'Content Manager',
    },
    {
      email: 'content2@posalpro.com',
      name: 'Robert Taylor',
      password: defaultPassword,
      department: 'Documentation',
      status: 'ACTIVE',
      roleName: 'Content Manager',
    },
    {
      email: 'demo@posalpro.com',
      name: 'Demo User',
      password: defaultPassword,
      department: 'Demo',
      status: 'ACTIVE',
      roleName: 'Proposal Manager',
    },
  ];

  const createdUsers: Record<string, any> = {};
  for (const userData of usersData) {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: userData.password,
        department: userData.department,
        status: userData.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
      },
    });

    // Assign role to user
    const role = createdRoles[userData.roleName];
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        assignedBy: 'SYSTEM',
      },
    });

    createdUsers[userData.email] = user;
  }

  console.log(`✅ Created ${Object.keys(createdUsers).length} users`);

  // ========================================
  // CUSTOMERS SETUP
  // ========================================

  console.log('🏢 Creating customers...');

  const customersData = [
    {
      name: 'TechCorp Solutions',
      industry: 'Technology',
      tier: 'ENTERPRISE',
      status: 'ACTIVE',
      description: 'Leading technology solutions provider',
      contacts: [
        {
          name: 'Alice Johnson',
          email: 'alice.johnson@techcorp.com',
          phone: '+1-555-0101',
          title: 'CTO',
          isPrimary: true,
        },
        {
          name: 'Bob Smith',
          email: 'bob.smith@techcorp.com',
          phone: '+1-555-0102',
          title: 'Procurement Manager',
          isPrimary: false,
        },
      ],
    },
    {
      name: 'Global Financial Services',
      industry: 'Financial Services',
      tier: 'ENTERPRISE',
      status: 'ACTIVE',
      description: 'International banking and financial services',
      contacts: [
        {
          name: 'Carol Davis',
          email: 'carol.davis@globalfin.com',
          phone: '+1-555-0201',
          title: 'VP of Technology',
          isPrimary: true,
        },
      ],
    },
    {
      name: 'Healthcare Innovations Inc',
      industry: 'Healthcare',
      tier: 'PREMIUM',
      status: 'ACTIVE',
      description: 'Healthcare technology and innovation',
      contacts: [
        {
          name: 'Dr. Emily Wilson',
          email: 'emily.wilson@healthinnov.com',
          phone: '+1-555-0301',
          title: 'Chief Medical Officer',
          isPrimary: true,
        },
      ],
    },
    {
      name: 'Manufacturing Excellence LLC',
      industry: 'Manufacturing',
      tier: 'STANDARD',
      status: 'ACTIVE',
      description: 'Advanced manufacturing solutions',
      contacts: [
        {
          name: 'Frank Miller',
          email: 'frank.miller@manufexcel.com',
          phone: '+1-555-0401',
          title: 'Operations Director',
          isPrimary: true,
        },
      ],
    },
    {
      name: 'EduTech Systems',
      industry: 'Education',
      tier: 'STANDARD',
      status: 'ACTIVE',
      description: 'Educational technology solutions',
      contacts: [
        {
          name: 'Grace Lee',
          email: 'grace.lee@edutech.com',
          phone: '+1-555-0501',
          title: 'Technology Manager',
          isPrimary: true,
        },
      ],
    },
  ];

  const createdCustomers: Record<string, any> = {};
  for (const customerData of customersData) {
    const customer = await prisma.customer.create({
      data: {
        name: customerData.name,
        industry: customerData.industry,
        tier: customerData.tier as 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' | 'VIP',
        status: customerData.status as 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'CHURNED',
        metadata: {
          description: customerData.description,
        },
      },
    });

    // Create customer contacts
    for (const contactData of customerData.contacts) {
      await prisma.customerContact.create({
        data: {
          customerId: customer.id,
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          role: contactData.title,
          isPrimary: contactData.isPrimary,
        },
      });
    }

    createdCustomers[customerData.name] = customer;
  }

  console.log(`✅ Created ${Object.keys(createdCustomers).length} customers`);

  // ========================================
  // PRODUCTS SETUP
  // ========================================

  console.log('📦 Creating products...');

  const productsData = [
    {
      name: 'Enterprise Cloud Platform',
      description: 'Comprehensive cloud infrastructure and management platform',
      sku: 'ECP-3.0',
      price: 15000.0,
      category: ['Cloud Infrastructure'],
      isActive: true,
      tags: ['cloud', 'infrastructure', 'enterprise', 'scalable'],
    },
    {
      name: 'AI Analytics Suite',
      description: 'Advanced AI-powered analytics and business intelligence platform',
      sku: 'AAS-2.1',
      price: 12000.0,
      category: ['Analytics'],
      isActive: true,
      tags: ['ai', 'analytics', 'business-intelligence', 'machine-learning'],
    },
    {
      name: 'Security Monitoring System',
      description: 'Real-time security monitoring and threat detection system',
      sku: 'SMS-4.2',
      price: 8000.0,
      category: ['Security'],
      isActive: true,
      tags: ['security', 'monitoring', 'threat-detection', 'compliance'],
    },
    {
      name: 'Data Integration Platform',
      description: 'Enterprise data integration and ETL platform',
      sku: 'DIP-1.8',
      price: 10000.0,
      category: ['Data Management'],
      isActive: true,
      tags: ['data-integration', 'etl', 'data-warehouse', 'enterprise'],
    },
    {
      name: 'Mobile Development Framework',
      description: 'Cross-platform mobile application development framework',
      sku: 'MDF-5.0',
      price: 5000.0,
      category: ['Development Tools'],
      isActive: true,
      tags: ['mobile', 'development', 'cross-platform', 'framework'],
    },
    {
      name: 'IoT Management Platform',
      description: 'Internet of Things device management and analytics platform',
      sku: 'IMP-2.3',
      price: 7500.0,
      category: ['IoT'],
      isActive: true,
      tags: ['iot', 'device-management', 'analytics', 'connectivity'],
    },
  ];

  const createdProducts: Record<string, any> = {};
  for (const productData of productsData) {
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        sku: productData.sku,
        price: productData.price,
        category: productData.category,
        tags: productData.tags,
        isActive: productData.isActive,
      },
    });

    createdProducts[productData.name] = product;
  }

  console.log(`✅ Created ${Object.keys(createdProducts).length} products`);

  // ========================================
  // CONTENT SETUP
  // ========================================

  console.log('📄 Creating content templates...');

  const contentData = [
    {
      title: 'Executive Summary Template',
      type: 'TEMPLATE',
      category: ['Executive'],
      content: 'Executive summary template for high-level proposal overview...',
      tags: ['executive', 'summary', 'overview'],
    },
    {
      title: 'Technical Architecture Overview',
      type: 'TEMPLATE',
      category: ['Technical'],
      content: 'Technical architecture template for system design proposals...',
      tags: ['technical', 'architecture', 'system-design'],
    },
    {
      title: 'Security Compliance Framework',
      type: 'DOCUMENT',
      category: ['Security'],
      content: 'Comprehensive security compliance framework and requirements...',
      tags: ['security', 'compliance', 'framework'],
    },
    {
      title: 'Cost Benefit Analysis Template',
      type: 'TEMPLATE',
      category: ['Financial'],
      content: 'Cost benefit analysis template for ROI calculations...',
      tags: ['financial', 'roi', 'cost-benefit'],
    },
    {
      title: 'Implementation Timeline Template',
      type: 'TEMPLATE',
      category: ['Project Management'],
      content: 'Project implementation timeline and milestone template...',
      tags: ['timeline', 'implementation', 'milestones'],
    },
  ];

  const createdContent: Record<string, any> = {};
  for (const contentItem of contentData) {
    const content = await prisma.content.create({
      data: {
        title: contentItem.title,
        type: contentItem.type as 'TEXT' | 'TEMPLATE' | 'IMAGE' | 'DOCUMENT' | 'MEDIA',
        category: contentItem.category,
        content: contentItem.content,
        tags: contentItem.tags,
        isActive: true,
        createdBy: createdUsers['content1@posalpro.com'].id,
      },
    });

    createdContent[contentItem.title] = content;
  }

  console.log(`✅ Created ${Object.keys(createdContent).length} content items`);

  // ========================================
  // PROPOSALS SETUP
  // ========================================

  console.log('📋 Creating sample proposals...');

  const proposalsData = [
    {
      title: 'TechCorp Cloud Migration Project',
      description: 'Complete cloud infrastructure migration for TechCorp Solutions',
      status: 'IN_REVIEW',
      priority: 'HIGH',
      customerName: 'TechCorp Solutions',
      creatorEmail: 'pm1@posalpro.com',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      products: ['Enterprise Cloud Platform', 'Security Monitoring System'],
      rfpReferenceNumber: 'RFP-2025-001',
      value: 250000,
      currency: 'USD',
      tags: ['cloud', 'migration', 'enterprise'],
      team: {
        teamLead: 'pm1@posalpro.com',
        salesRepresentative: 'pm2@posalpro.com',
        subjectMatterExperts: {
          TECHNICAL: 'sme1@posalpro.com',
          SECURITY: 'sme3@posalpro.com',
        },
      },
    },
    {
      title: 'Global Financial Analytics Implementation',
      description: 'AI-powered analytics solution for financial services',
      status: 'DRAFT',
      priority: 'HIGH',
      customerName: 'Global Financial Services',
      creatorEmail: 'pm2@posalpro.com',
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      products: ['AI Analytics Suite', 'Data Integration Platform'],
      rfpReferenceNumber: 'RFP-2025-002',
      value: 180000,
      currency: 'USD',
      tags: ['analytics', 'ai', 'finance'],
      team: {
        teamLead: 'pm2@posalpro.com',
        salesRepresentative: 'pm1@posalpro.com',
        subjectMatterExperts: {
          TECHNICAL: 'sme1@posalpro.com',
          SECURITY: 'sme3@posalpro.com',
        },
      },
    },
    {
      title: 'Healthcare IoT Monitoring Solution',
      description: 'IoT platform for healthcare device monitoring',
      status: 'APPROVED',
      priority: 'MEDIUM',
      customerName: 'Healthcare Innovations Inc',
      creatorEmail: 'sme1@posalpro.com',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      products: ['IoT Management Platform'],
      rfpReferenceNumber: 'RFP-2025-003',
      value: 90000,
      currency: 'USD',
      tags: ['healthcare', 'iot'],
      team: {
        teamLead: 'pm1@posalpro.com',
        salesRepresentative: 'pm2@posalpro.com',
        subjectMatterExperts: {
          TECHNICAL: 'sme2@posalpro.com',
        },
      },
    },
    {
      title: 'Manufacturing Process Optimization',
      description: 'Digital transformation for manufacturing processes',
      status: 'SUBMITTED',
      priority: 'MEDIUM',
      customerName: 'Manufacturing Excellence LLC',
      creatorEmail: 'pm1@posalpro.com',
      dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
      products: ['Data Integration Platform', 'AI Analytics Suite'],
      rfpReferenceNumber: 'RFP-2025-004',
      value: 140000,
      currency: 'USD',
      tags: ['manufacturing', 'optimization'],
      team: {
        teamLead: 'pm1@posalpro.com',
        salesRepresentative: 'pm2@posalpro.com',
        subjectMatterExperts: {
          TECHNICAL: 'sme1@posalpro.com',
        },
      },
    },
    {
      title: 'EduTech Mobile Learning Platform',
      description: 'Mobile learning solution for educational institutions',
      status: 'DRAFT',
      priority: 'LOW',
      customerName: 'EduTech Systems',
      creatorEmail: 'sme2@posalpro.com',
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      products: ['Mobile Development Framework'],
      rfpReferenceNumber: 'RFP-2025-005',
      value: 60000,
      currency: 'USD',
      tags: ['education', 'mobile'],
      team: {
        teamLead: 'pm2@posalpro.com',
        salesRepresentative: 'pm1@posalpro.com',
        subjectMatterExperts: {
          TECHNICAL: 'sme2@posalpro.com',
        },
      },
    },
  ];

  const createdProposals: Record<string, any> = {};
  for (const proposalData of proposalsData) {
    const customer = createdCustomers[proposalData.customerName];
    const creator = createdUsers[proposalData.creatorEmail];

    // Resolve team user IDs
    const resolveUserId = (email?: string) => (email ? createdUsers[email]?.id : undefined);
    const teamLeadId = resolveUserId(proposalData.team?.teamLead);
    const salesRepId = resolveUserId(proposalData.team?.salesRepresentative);
    const smes = proposalData.team?.subjectMatterExperts || ({} as Record<string, string>);
    const smeIds = Object.fromEntries(
      Object.entries(smes)
        .map(([k, v]) => [k, resolveUserId(v)])
        .filter(([, id]) => !!id)
    ) as Record<string, string>;

    const newProposal = await prisma.proposal.create({
      data: {
        title: proposalData.title,
        description: proposalData.description,
        status: proposalData.status as
          | 'DRAFT'
          | 'IN_REVIEW'
          | 'PENDING_APPROVAL'
          | 'APPROVED'
          | 'REJECTED'
          | 'SUBMITTED'
          | 'ACCEPTED'
          | 'DECLINED',
        priority: proposalData.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        customerId: customer.id,
        createdBy: creator.id,
        dueDate: proposalData.dueDate,
        value: proposalData.value,
        currency: proposalData.currency,
        tags: proposalData.tags,
        metadata: {
          createdBy: creator.id,
          createdAt: new Date().toISOString(),
          userStories: ['US-5.1', 'US-5.2'],
          hypothesis: ['H4', 'H7'],
          teamAssignments: {
            teamLead: teamLeadId,
            salesRepresentative: salesRepId,
            subjectMatterExperts: smeIds,
          },
          wizardData: {
            step1: {
              client: {
                name: proposalData.customerName,
                industry: customer.industry,
                contactPerson: 'Primary Contact',
                contactEmail: 'contact@example.com',
                contactPhone: '+1-555-0100',
              },
              details: {
                title: proposalData.title,
                rfpReferenceNumber: proposalData.rfpReferenceNumber,
                dueDate: proposalData.dueDate,
                estimatedValue: proposalData.value,
                priority: proposalData.priority,
                description: proposalData.description,
              },
            },
            step2: {
              teamLead: teamLeadId,
              salesRepresentative: salesRepId,
              subjectMatterExperts: smeIds,
            },
            step3: {
              selectedContent: [
                {
                  id: 'content-exec-summary',
                  section: 'Executive Summary',
                  assignedTo: teamLeadId,
                },
              ],
            },
            step4: { products: proposalData.products },
            step5: {
              sections: [
                { id: '1', title: 'Executive Summary', required: true, estimatedHours: 8 },
                {
                  id: '2',
                  title: 'Understanding & Requirements',
                  required: true,
                  estimatedHours: 12,
                },
                { id: '3', title: 'Technical Approach', required: true, estimatedHours: 20 },
                { id: '4', title: 'Implementation Plan', required: true, estimatedHours: 16 },
                {
                  id: '5',
                  title: 'Pricing & Commercial Terms',
                  required: true,
                  estimatedHours: 12,
                },
              ],
              sectionAssignments: {
                'Executive Summary': teamLeadId,
                'Technical Approach': Object.values(smeIds)[0],
                'Pricing & Commercial Terms': salesRepId,
              },
            },
            step6: { finalValidation: { isValid: false, completeness: 0, issues: [] } },
          },
        },
        assignedTo: {
          connect: [teamLeadId, salesRepId, ...Object.values(smeIds)]
            .filter(Boolean)
            .map(id => ({ id })),
        },
      },
    });

    // Add products to proposal
    for (const productName of proposalData.products) {
      const product = createdProducts[productName];
      if (product) {
        await prisma.proposalProduct.create({
          data: {
            proposalId: newProposal.id,
            productId: product.id,
            quantity: 1,
            unitPrice: product.price,
            total: product.price,
          },
        });
      }
    }

    // Add proposal sections
    const sections = [
      { title: 'Executive Summary', type: 'TEXT', order: 1 },
      { title: 'Technical Requirements', type: 'TEXT', order: 2 },
      { title: 'Product Configuration', type: 'PRODUCTS', order: 3 },
      { title: 'Implementation Plan', type: 'TEXT', order: 4 },
      { title: 'Pricing and Terms', type: 'PRICING', order: 5 },
    ];

    for (const sectionData of sections) {
      await prisma.proposalSection.create({
        data: {
          proposalId: newProposal.id,
          title: sectionData.title,
          content: `${sectionData.title} content for ${proposalData.title}`,
          type: sectionData.type as 'TEXT' | 'PRODUCTS' | 'TERMS' | 'PRICING' | 'CUSTOM',
          order: sectionData.order,
        },
      });
    }

    // Optional: update computed counts
    const productCount = await prisma.proposalProduct.count({
      where: { proposalId: newProposal.id },
    });
    const sectionCount = await prisma.proposalSection.count({
      where: { proposalId: newProposal.id },
    });
    await prisma.proposal.update({
      where: { id: newProposal.id },
      data: { productCount, sectionCount, lastActivityAt: new Date() },
    });

    createdProposals[proposalData.title] = newProposal;
  }

  console.log(`✅ Created ${Object.keys(createdProposals).length} proposals`);

  // ========================================
  // OPTIONAL: COMMUNICATIONS SUPPORT SEEDING
  // ========================================

  // Seed hypothesis validation events if none exist to provide initial communications
  const hvCount = await prisma.hypothesisValidationEvent.count();
  if (hvCount === 0) {
    console.log('🧪 Seeding hypothesis validation events...');
    const hypotheses: Array<'H1' | 'H3' | 'H4' | 'H6' | 'H7' | 'H8'> = [
      'H1',
      'H3',
      'H4',
      'H6',
      'H7',
      'H8',
    ];
    const eventUsers = [
      createdUsers['pm1@posalpro.com']?.id,
      createdUsers['sme1@posalpro.com']?.id,
      createdUsers['admin@posalpro.com']?.id,
    ].filter(Boolean) as string[];

    for (let i = 0; i < 12; i++) {
      const userId = eventUsers[i % eventUsers.length];
      await prisma.hypothesisValidationEvent.create({
        data: {
          userId,
          hypothesis: hypotheses[i % hypotheses.length],
          userStoryId: `US-${(i % 7) + 1}.${(i % 3) + 1}`,
          componentId: 'CommunicationsSeed',
          action: 'seed_event',
          measurementData: { source: 'seed', idx: i },
          targetValue: 100,
          actualValue: 100 + Math.random() * 20 - 10,
          performanceImprovement: Math.random() * 10,
          userRole: 'System',
          sessionId: `seed-${Date.now()}-${i}`,
          testCaseId: `TC-SEED-${i}`,
        },
      });
    }
    console.log('✅ Seeded hypothesis validation events');
  }

  // Assign a few users to proposals if none assigned to support participants API
  console.log('👥 Assigning users to proposals for initial participants...');
  const proposalList = await prisma.proposal.findMany({ select: { id: true } });
  const assignableUsers = await prisma.user.findMany({
    where: { email: { in: ['pm1@posalpro.com', 'sme1@posalpro.com'] } },
    select: { id: true },
  });
  for (const p of proposalList.slice(0, 3)) {
    await prisma.proposal.update({
      where: { id: p.id },
      data: {
        assignedTo: {
          connect: assignableUsers.map(u => ({ id: u.id })),
        },
      },
    });
  }

  // ========================================
  // FINAL STATISTICS
  // ========================================

  console.log('\n📊 Database seeding completed successfully!');
  console.log('='.repeat(50));
  console.log(`👥 Users: ${Object.keys(createdUsers).length}`);
  console.log(`🎭 Roles: ${Object.keys(createdRoles).length}`);
  console.log(`📝 Permissions: ${createdPermissions.length}`);
  console.log(`🏢 Customers: ${Object.keys(createdCustomers).length}`);
  console.log(`📦 Products: ${Object.keys(createdProducts).length}`);
  console.log(`📄 Content Items: ${Object.keys(createdContent).length}`);
  console.log(`📋 Proposals: ${Object.keys(createdProposals).length}`);
  console.log('='.repeat(50));
  console.log('\n🎉 PosalPro MVP2 is ready for production use!');
  console.log('\n🔑 Default login credentials:');
  console.log('   Email: demo@posalpro.com');
  console.log('   Password: ProposalPro2024!');
  console.log('\n🔗 Additional test accounts available with same password:');
  console.log('   - admin@posalpro.com (System Administrator)');
  console.log('   - pm1@posalpro.com (Proposal Manager)');
  console.log('   - sme1@posalpro.com (Senior SME)');
  console.log('   - content1@posalpro.com (Content Manager)');
}

main()
  .catch(e => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
