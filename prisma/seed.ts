/**
 * PosalPro MVP2 - Database Seed Script
 * Initializes production-ready data with comprehensive sample data
 */

import { toPrismaJson } from '@/lib/utils/prismaUtils';
import {
  AccessType,
  ContentType,
  EntityType,
  HypothesisType,
  PermissionScope,
  Priority,
  PrismaClient,
  ProposalStatus,
  RelationshipType,
  RuleKind,
  RuleStatus,
  SectionType,
  Severity,
  ValidationRuleType,
  PlanTier,
  SubscriptionStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PLAN_TIER_ENTITLEMENTS } from '@/lib/billing/entitlementMapping';

// Platform compatibility: Using bcryptjs (pure JS) instead of bcrypt (native)
// This ensures consistent behavior across all environments (dev, CI, production)

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PosalPro MVP2 production database seeding...');

  // ========================================
  // TENANT SETUP: Create default tenant
  // ========================================
  console.log('🏢 Setting up multi-tenant structure...');

  const existingTenant = await prisma.tenant.findUnique({
    where: { id: 'tenant_default' },
  });

  if (!existingTenant) {
    await prisma.tenant.create({
      data: {
        id: 'tenant_default',
        name: 'Default Tenant',
        domain: 'posalpro.com',
        subdomain: 'app',
        status: 'ACTIVE',
        settings: {
          theme: 'default',
          features: ['basic', 'advanced'],
          limits: {
            users: 100,
            customers: 1000,
            products: 500,
          },
        },
      },
    });
    console.log('✅ Created default tenant');
  } else {
    console.log('ℹ️ Default tenant already exists');
  }

  // ========================================
  // ENTITLEMENTS: Seed dev entitlements for default tenant
  // ========================================
  console.log('🔐 Ensuring default entitlements for tenant_default...');
  const devTenantId = 'tenant_default';
  const entitlementKeys: Array<{ key: string; value?: string | null }> = [
    { key: 'feature.products.create' },
    { key: 'feature.products.advanced' },
    { key: 'feature.products.analytics' },
    { key: 'feature.analytics.dashboard' },
    { key: 'feature.analytics.enhanced' },
    { key: 'feature.analytics.insights' },
    { key: 'feature.analytics.users' },
    { key: 'feature.search.suggestions' },
    { key: 'feature.users.activity' },
  ];

  for (const ent of entitlementKeys) {
    const exists = await prisma.entitlement.findFirst({
      where: { tenantId: devTenantId, key: ent.key },
      select: { id: true },
    });
    if (!exists) {
      await prisma.entitlement.create({
        data: {
          tenantId: devTenantId,
          key: ent.key,
          enabled: true,
          value: ent.value ?? null,
        },
      });
      console.log(`  ✅ Entitlement created: ${ent.key}`);
    }
  }
  console.log('✅ Default entitlements ensured');

  // Align enabled entitlements exactly to FREE plan mapping
  const freeEntitlements = new Set(PLAN_TIER_ENTITLEMENTS['FREE'] || []);
  // Ensure all FREE entitlements exist and are enabled
  for (const key of freeEntitlements) {
    await prisma.entitlement.upsert({
      where: { tenantId_key: { tenantId: devTenantId, key } },
      update: { enabled: true, value: null },
      create: { tenantId: devTenantId, key, enabled: true },
    });
  }
  // Disable any entitlement not part of FREE
  await prisma.entitlement.updateMany({
    where: { tenantId: devTenantId, key: { notIn: Array.from(freeEntitlements) } },
    data: { enabled: false, value: null },
  });
  console.log('✅ Entitlements aligned to FREE plan mapping');

  // ========================================
  // BILLING: Ensure FREE plan + active subscription for default tenant
  // ========================================
  console.log('💳 Ensuring FREE plan and active subscription for tenant_default...');
  const freePlan = await prisma.plan.upsert({
    where: { name: 'FREE' },
    update: { tier: PlanTier.FREE, active: true },
    create: { name: 'FREE', tier: PlanTier.FREE, active: true },
  });

  const existingSub = await prisma.subscription.findFirst({ where: { tenantId: devTenantId } });
  if (existingSub) {
    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        planId: freePlan.id,
        status: SubscriptionStatus.ACTIVE,
        seats: existingSub.seats || Number(process.env.DEFAULT_PLAN_SEATS || 5),
      },
    });
    console.log('✅ Updated existing subscription to FREE/ACTIVE');
  } else {
    await prisma.subscription.create({
      data: {
        tenantId: devTenantId,
        planId: freePlan.id,
        status: SubscriptionStatus.ACTIVE,
        seats: Number(process.env.DEFAULT_PLAN_SEATS || 5),
      },
    });
    console.log('✅ Created active FREE subscription for tenant_default');
  }

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
          type: ContentType.TEMPLATE,
          category: ['Executive'],
          content: 'Executive summary template for high-level proposal overview...',
          tags: ['executive', 'summary', 'overview'],
        },
        {
          title: 'Technical Architecture Overview',
          type: ContentType.TEMPLATE,
          category: ['Technical'],
          content: 'Technical architecture template for system design proposals...',
          tags: ['technical', 'architecture', 'system-design'],
        },
        {
          title: 'Security Compliance Framework',
          type: ContentType.DOCUMENT,
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
            keywords: item.tags,
            allowedRoles: [],
            isActive: true,
            createdBy: fallbackUser?.id ?? 'unknown',
          },
        });
      }
      console.log('✅ Seeded initial Content items');
    }

    // Top-up templates if below minimum threshold
    const templateCount = await prisma.content.count({
      where: { type: ContentType.TEMPLATE, isActive: true },
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
            type: ContentType.TEMPLATE,
            category: templates[i].category,
            content: templates[i].content,
            tags: templates[i].tags,
            keywords: templates[i].tags,
            allowedRoles: [],
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
            tenantId: 'tenant_default',
            name,
            description: `${name} for ${pick(['scalability', 'security', 'analytics', 'productivity'])}`,
            sku,
            price: randomInt(3000, 25000),
            currency: 'USD',
            category: [pick(categories)],
            tags: [pick(['cloud', 'ai', 'security', 'etl', 'mobile', 'iot', 'ops'])],
            images: [],
            userStoryMappings: [],
            isActive: true,
          },
        });
      }
      console.log('✅ Products topped up');
    }

    // Top-up PROPOSALS to at least 50 with realistic fields and relationships
    const TARGET_PROPOSALS = 50;
    const currentProposals = await prisma.proposal.count();
    const currentCustomers = await prisma.customer.count();

    if (currentProposals < TARGET_PROPOSALS) {
      if (currentCustomers === 0) {
        console.log('⚠️ No customers found, skipping proposal creation for now');
        console.log('💡 Run full seed (npm run db:reset) or ensure customers exist first');
      } else {
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
          // Spread dates across past and future to create overdue and upcoming
          const dueDate = new Date(Date.now() + randomInt(-60, 120) * 24 * 60 * 60 * 1000);
          const rfp = `RFP-${new Date().getFullYear()}-${String(currentProposals + i + 1).padStart(3, '0')}`;
          const selectedProducts = Array.from({ length: randomInt(1, 3) }, () => pick(products));

          // Calculate adjusted prices for each product (same multiplier for consistency)
          const productPricing = selectedProducts.map(p => {
            const multiplier = randomInt(1, 3);
            return {
              product: p,
              multiplier,
              adjustedPrice: Number(p.price) * multiplier,
              quantity: 1,
            };
          });

          const value = productPricing.reduce((sum, pp) => sum + pp.adjustedPrice, 0);

          const teamLead = pickUserId(['pm1@posalpro.com', 'pm2@posalpro.com']);
          const salesRep = pickUserId(['pm2@posalpro.com', 'pm1@posalpro.com']);
          const sme = pickUserId(['sme1@posalpro.com', 'sme2@posalpro.com', 'sme3@posalpro.com']);

          const status = pick([
            ProposalStatus.DRAFT,
            ProposalStatus.IN_REVIEW,
            ProposalStatus.PENDING_APPROVAL,
            ProposalStatus.APPROVED,
            ProposalStatus.SUBMITTED,
            ProposalStatus.ACCEPTED,
            ProposalStatus.DECLINED,
          ]);

          const submittedAt =
            status === ProposalStatus.SUBMITTED ||
            status === ProposalStatus.ACCEPTED ||
            status === ProposalStatus.DECLINED
              ? new Date(Date.now() - randomInt(2, 30) * 24 * 60 * 60 * 1000)
              : undefined;
          const approvedAt =
            status === ProposalStatus.APPROVED || status === ProposalStatus.ACCEPTED
              ? new Date(Date.now() - randomInt(1, 10) * 24 * 60 * 60 * 1000)
              : undefined;

          const newProposal = await prisma.proposal.create({
            data: {
              tenantId: 'tenant_default',
              title: `${pick(['Cloud', 'Analytics', 'Security', 'IoT', 'Data'])} ${pick([
                'Transformation',
                'Implementation',
                'Optimization',
                'Migration',
                'Modernization',
              ])} for ${customer?.name || 'Unknown Customer'}`,
              description: 'Auto-generated realistic project with full metadata and assignments.',
              status,
              priority: pick([Priority.LOW, Priority.MEDIUM, Priority.HIGH]),
              customerId: customer?.id || 'unknown-customer',
              createdBy: creatorId,
              dueDate,
              submittedAt,
              approvedAt,
              // Store RFP only in metadata wizardData to match current schema
              metadata: toPrismaJson({
                wizardData: {
                  step1: {
                    client: {
                      name: customer?.name || 'Unknown Customer',
                      industry: customer?.industry || 'Technology',
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
              }),
              value,
              currency: 'USD',
              tags: ['auto', 'seed', 'demo'],
              creatorEmail: pick(users).email,
              customerName: customer?.name || 'Unknown Customer',
              assignedTo: {
                connect: [teamLead, salesRep, sme].filter(Boolean).map(id => ({ id })),
              },
            },
          });

          // Link products with consistent pricing
          for (const pp of productPricing) {
            await prisma.proposalProduct.create({
              data: {
                proposalId: newProposal.id,
                productId: pp.product.id,
                quantity: pp.quantity,
                unitPrice: pp.adjustedPrice,
                total: pp.adjustedPrice,
              },
            });
          }

          // Add sections
          const secDefs: { title: string; type: SectionType; order: number }[] = [
            { title: 'Executive Summary', type: SectionType.TEXT, order: 1 },
            { title: 'Technical Requirements', type: SectionType.TEXT, order: 2 },
            { title: 'Product Configuration', type: SectionType.PRODUCTS, order: 3 },
            { title: 'Implementation Plan', type: SectionType.TEXT, order: 4 },
            { title: 'Pricing and Terms', type: SectionType.PRICING, order: 5 },
          ];
          for (const s of secDefs) {
            await prisma.proposalSection.create({
              data: {
                proposalId: newProposal.id,
                title: s.title,
                content: `${s.title} details for ${newProposal.title}`,
                type: s.type,
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
          entityType: EntityType.PROPOSAL,
          createdBy: creator?.id ?? 'unknown',
          userStoryMappings: [],
          stages: {
            create: [
              { name: 'Manager Review', order: 1, slaHours: 24, approvers: [] },
              { name: 'Executive Approval', order: 2, slaHours: 48, approvers: [] },
            ],
          },
        },
      });
      await prisma.approvalWorkflow.create({
        data: {
          name: 'Content Quality Review',
          description: 'Quality and compliance review for content items',
          entityType: EntityType.CONTENT,
          createdBy: creator?.id ?? 'unknown',
          userStoryMappings: [],
          stages: {
            create: [{ name: 'Content Manager Review', order: 1, slaHours: 12, approvers: [] }],
          },
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

    // Additional baseline seeding for missing models (top-ups)
    console.log(
      '🧩 Performing additional top-ups for preferences, rules, relationships, versions, and logs...'
    );

    // User & Communication Preferences top-up
    const usersAll = await prisma.user.findMany({ select: { id: true } });
    for (const u of usersAll) {
      await prisma.userPreferences.upsert({
        where: { userId: u.id },
        update: {},
        create: {
          userId: u.id,
          theme: 'system',
          language: 'en',
          analyticsConsent: false,
          performanceTracking: false,
        },
      });
      await prisma.communicationPreferences.upsert({
        where: { userId: u.id },
        update: {},
        create: {
          userId: u.id,
          language: 'en',
          timezone: 'UTC',
          quietHoursStart: null,
          quietHoursEnd: null,
          channels: toPrismaJson({ email: true, inApp: true }),
          frequency: toPrismaJson({ general: 'daily' }),
          categories: toPrismaJson({ proposals: true, content: true }),
        },
      });
    }

    // Validation rules baseline
    const vrCount = await prisma.validationRule.count();
    if (vrCount === 0) {
      const creator = await prisma.user.findFirst({ select: { id: true } });
      const anyProduct = await prisma.product.findFirst({ select: { id: true } });
      await prisma.validationRule.createMany({
        data: [
          {
            name: 'Basic Proposal Completeness',
            description: 'Ensure proposals have at least one section and one product',
            category: 'Proposal',
            ruleType: ValidationRuleType.COMPLIANCE,
            conditions: toPrismaJson({ minSections: 1, minProducts: 1 }),
            actions: toPrismaJson({ severity: 'WARNING' }),
            severity: Severity.WARNING,
            isActive: true,
            createdBy: creator?.id ?? 'unknown',
            userStoryMappings: ['US-1.1'],
            hypothesesSupported: ['H1'],
          },
          {
            name: 'Product Active Compatibility',
            description: 'If a product is inactive, warn about selection',
            category: 'Product',
            ruleType: ValidationRuleType.COMPATIBILITY,
            conditions: toPrismaJson({ requireActive: true }),
            actions: toPrismaJson({ warnIfInactive: true }),
            severity: Severity.INFO,
            isActive: true,
            createdBy: creator?.id ?? 'unknown',
            productId: anyProduct?.id,
            userStoryMappings: ['US-2.3'],
            hypothesesSupported: ['H3'],
          },
        ],
      });
    }

    // Product relationships baseline
    const prRelCount = await prisma.productRelationship.count();
    if (prRelCount === 0) {
      const creator = await prisma.user.findFirst({ select: { id: true } });
      const prods = await prisma.product.findMany({ take: 2, select: { id: true } });
      if (prods.length >= 2) {
        await prisma.productRelationship.create({
          data: {
            sourceProductId: prods[0].id,
            targetProductId: prods[1].id,
            type: RelationshipType.RECOMMENDS,
            createdBy: creator?.id ?? 'unknown',
            condition: toPrismaJson({ minVersion: 1 }),
          },
        });
      }
    }

    // Product relationship rules baseline
    const prRuleCount = await prisma.productRelationshipRule.count();
    if (prRuleCount === 0) {
      const creator = await prisma.user.findFirst({ select: { id: true } });
      const prod = await prisma.product.findFirst({ select: { id: true } });
      if (prod) {
        const rule = await prisma.productRelationshipRule.create({
          data: {
            productId: prod.id,
            name: 'Recommend Security Monitoring',
            ruleType: RuleKind.RECOMMENDS,
            status: RuleStatus.PUBLISHED,
            isPublished: true,
            version: 1,
            precedence: 1,
            rule: toPrismaJson({
              if: { category: 'Cloud Infrastructure' },
              then: { recommends: 'Security Monitoring System' },
            }),
            scope: toPrismaJson({ region: 'global' }),
            explain: 'Recommends security for cloud platform',
            createdBy: creator?.id ?? 'unknown',
          },
        });
        await prisma.productRelationshipRuleVersion.create({
          data: {
            ruleId: rule.id,
            version: 1,
            status: RuleStatus.PUBLISHED,
            rule: toPrismaJson(rule.rule),
            explain: rule.explain ?? undefined,
            createdBy: creator?.id ?? 'unknown',
          },
        });
      }
    }

    // Proposal versions baseline
    const proposalsAll = await prisma.proposal.findMany({ select: { id: true, createdBy: true } });
    for (const p of proposalsAll) {
      const existing = await prisma.proposalVersion.count({ where: { proposalId: p.id } });
      if (existing === 0) {
        await prisma.proposalVersion.create({
          data: {
            proposalId: p.id,
            version: 1,
            createdBy: p.createdBy,
            changeType: 'INITIAL',
            changesSummary: 'Initial snapshot',
            snapshot: toPrismaJson({ seeded: true }),
            productIds: [],
          },
        });
      }
    }

    // Content access logs baseline
    const someContent = await prisma.content.findMany({ take: 2, select: { id: true } });
    const someUsers = await prisma.user.findMany({ take: 2, select: { id: true } });
    if (someContent.length && someUsers.length) {
      for (const c of someContent) {
        for (const u of someUsers) {
          await prisma.contentAccessLog.create({
            data: {
              contentId: c.id,
              userId: u.id,
              accessType: AccessType.VIEW,
              userStory: 'US-0.0',
              performanceImpact: 0,
            },
          });
        }
      }
    }

    console.log('✅ Additional top-ups completed');

    // Ensure we have some ACCEPTED (won) and overdue proposals for reporting
    {
      const [acceptedCount, overdueCount] = await Promise.all([
        prisma.proposal.count({ where: { status: ProposalStatus.ACCEPTED } }),
        prisma.proposal.count({
          where: {
            dueDate: { lt: new Date() },
            status: {
              in: [
                ProposalStatus.DRAFT,
                ProposalStatus.IN_REVIEW,
                ProposalStatus.PENDING_APPROVAL,
                ProposalStatus.SUBMITTED,
              ],
            },
          },
        }),
      ]);

      const customers = await prisma.customer.findMany({
        select: { id: true, name: true, industry: true },
      });
      const products = await prisma.product.findMany({
        select: { id: true, name: true, price: true },
      });
      const users = await prisma.user.findMany({ select: { id: true, email: true } });

      const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
      const day = 24 * 60 * 60 * 1000;

      if (acceptedCount === 0 && customers.length && products.length && users.length) {
        for (let i = 0; i < 3; i++) {
          const customer = pick(customers);
          const creator = pick(users);
          const dueDate = new Date(Date.now() - (i + 5) * day);
          const selectedProducts = [pick(products)];
          const value = selectedProducts.reduce((sum, p) => sum + Number(p.price), 0);
          await prisma.proposal.create({
            data: {
              tenantId: 'tenant_default',
              title: `Won Proposal ${i + 1} for ${customer?.name || 'Unknown Customer'}`,
              description: 'Seeded accepted proposal for reporting metrics.',
              status: ProposalStatus.ACCEPTED,
              priority: pick([Priority.LOW, Priority.MEDIUM, Priority.HIGH]),
              customerId: customer?.id || 'unknown-customer',
              createdBy: creator.id,
              dueDate,
              submittedAt: new Date(Date.now() - (i + 10) * day),
              approvedAt: new Date(Date.now() - (i + 3) * day),
              value,
              currency: 'USD',
              tags: ['won', 'seed'],
              creatorEmail: creator.email,
              customerName: customer?.name || 'Unknown Customer',
              products: {
                create: selectedProducts.map(p => ({
                  productId: p.id,
                  quantity: 1,
                  unitPrice: p.price,
                  total: p.price,
                })),
              },
              assignedTo: {
                connect: Array.from(new Set([creator.id, pick(users).id, pick(users).id]))
                  .filter(Boolean)
                  .map(id => ({ id })),
              },
            },
          });
        }
      }

      if (overdueCount === 0 && customers.length && products.length && users.length) {
        for (let i = 0; i < 3; i++) {
          const customer = pick(customers);
          const creator = pick(users);
          const dueDate = new Date(Date.now() - (i + 7) * day);
          const selectedProducts = [pick(products)];
          const value = selectedProducts.reduce((sum, p) => sum + Number(p.price), 0);
          await prisma.proposal.create({
            data: {
              tenantId: 'tenant_default',
              title: `Overdue Proposal ${i + 1} for ${customer?.name || 'Unknown Customer'}`,
              description: 'Seeded overdue proposal for reporting metrics.',
              status: pick([
                ProposalStatus.DRAFT,
                ProposalStatus.IN_REVIEW,
                ProposalStatus.PENDING_APPROVAL,
                ProposalStatus.SUBMITTED,
              ]),
              priority: pick([Priority.LOW, Priority.MEDIUM, Priority.HIGH]),
              customerId: customer?.id || 'unknown-customer',
              createdBy: creator.id,
              dueDate,
              submittedAt: new Date(Date.now() - (i + 12) * day),
              value,
              currency: 'USD',
              tags: ['overdue', 'seed'],
              creatorEmail: creator.email,
              customerName: customer?.name || 'Unknown Customer',
              products: {
                create: selectedProducts.map(p => ({
                  productId: p.id,
                  quantity: 1,
                  unitPrice: p.price,
                  total: p.price,
                })),
              },
              assignedTo: {
                connect: Array.from(new Set([creator.id, pick(users).id, pick(users).id]))
                  .filter(Boolean)
                  .map(id => ({ id })),
              },
            },
          });
        }
      }
    }

    // Ensure balanced status distribution for funnel analytics
    {
      const statusCounts = await prisma.proposal.groupBy({
        by: ['status'],
        _count: { _all: true },
      });
      const statusMinTarget: Record<string, number> = {
        DRAFT: 5,
        IN_REVIEW: 5,
        PENDING_APPROVAL: 5,
        SUBMITTED: 5,
        ACCEPTED: 3,
        DECLINED: 3,
      };
      const statusToCreate: Array<{ status: ProposalStatus; missing: number }> = [];
      for (const [key, min] of Object.entries(statusMinTarget)) {
        const existing = statusCounts.find(s => String(s.status) === key)?._count._all || 0;
        if (existing < min)
          statusToCreate.push({
            status: ProposalStatus[key as keyof typeof ProposalStatus],
            missing: min - existing,
          });
      }
      if (statusToCreate.length) {
        const customers = await prisma.customer.findMany({
          select: { id: true, name: true, industry: true },
        });
        const products = await prisma.product.findMany({
          select: { id: true, name: true, price: true },
        });
        const users = await prisma.user.findMany({ select: { id: true, email: true } });

        if (customers.length === 0) {
          console.log('⚠️ No customers available for balanced status seeding');
          return;
        }
        const pick = <T>(arr: Array<T>): T => arr[Math.floor(Math.random() * arr.length)];
        const randomInt = (min: number, max: number) =>
          Math.floor(Math.random() * (max - min + 1)) + min;
        for (const entry of statusToCreate) {
          for (let i = 0; i < entry.missing; i++) {
            const customer = pick(customers);
            const creator = pick(users);
            const selectedProducts = Array.from({ length: 2 }, () => pick(products));
            const value = selectedProducts.reduce(
              (sum, p) => sum + Number(p.price) * randomInt(1, 2),
              0
            );
            const dueDate = new Date(Date.now() + randomInt(-30, 60) * 24 * 60 * 60 * 1000);
            await prisma.proposal.create({
              data: {
                tenantId: 'tenant_default',
                title: `${String(entry.status)} Proposal for ${customer?.name || 'Unknown Customer'}`,
                description: 'Balanced status seed entry',
                status: entry.status,
                priority: pick([Priority.LOW, Priority.MEDIUM, Priority.HIGH]),
                customerId: customer?.id || 'unknown-customer',
                createdBy: creator.id,
                dueDate,
                value,
                currency: 'USD',
                tags: ['seed', 'balanced'],
                customerName: customer?.name || 'Unknown Customer',
                creatorEmail: creator.email,
                products: {
                  create: selectedProducts.map(p => ({
                    productId: p.id,
                    quantity: 1,
                    unitPrice: p.price,
                    total: p.price,
                  })),
                },
                assignedTo: {
                  connect: Array.from(new Set([creator.id, pick(users).id, pick(users).id]))
                    .filter(Boolean)
                    .map(id => ({ id })),
                },
              },
            });
          }
        }
        console.log('✅ Ensured balanced status distribution for funnel charts');
      }
    }

    // Ensure overdue by priority coverage (at least one overdue per priority)
    {
      const priorities: Array<Priority> = [Priority.LOW, Priority.MEDIUM, Priority.HIGH];
      const now = new Date();
      for (const pr of priorities) {
        const exists = await prisma.proposal.count({
          where: {
            priority: pr,
            dueDate: { lt: now },
            status: {
              in: [
                ProposalStatus.DRAFT,
                ProposalStatus.IN_REVIEW,
                ProposalStatus.PENDING_APPROVAL,
                ProposalStatus.SUBMITTED,
              ],
            },
          },
        });
        if (exists === 0) {
          const customer = await prisma.customer.findFirst({ select: { id: true, name: true } });
          const product = await prisma.product.findFirst({
            select: { id: true, name: true, price: true },
          });
          const user = await prisma.user.findFirst({ select: { id: true, email: true } });
          if (customer && product && user) {
            await prisma.proposal.create({
              data: {
                tenantId: 'tenant_default',
                title: `Overdue ${String(pr)} Priority for ${customer?.name || 'Unknown Customer'}`,
                status: ProposalStatus.IN_REVIEW,
                priority: pr,
                customerId: customer?.id || 'unknown-customer',
                createdBy: user.id,
                dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                value: Number(product.price.toString()),
                currency: 'USD',
                customerName: customer?.name || 'Unknown Customer',
                creatorEmail: user.email,
                products: {
                  create: [
                    {
                      productId: product.id,
                      quantity: 1,
                      unitPrice: Number(product.price.toString()),
                      total: Number(product.price.toString()),
                    },
                  ],
                },
                assignedTo: {
                  connect: [{ id: user.id }],
                },
              },
            });
          }
        }
      }
      console.log('✅ Ensured overdue-by-priority coverage');
    }

    // Ensure enough multi-product proposals for bundle analytics
    {
      const multiProductCount = await prisma.proposal.count({
        where: { products: { some: {} } },
      });
      if (multiProductCount < 10) {
        const customers = await prisma.customer.findMany({ select: { id: true, name: true } });
        const products = await prisma.product.findMany({
          select: { id: true, price: true, name: true },
        });
        const user = await prisma.user.findFirst({ select: { id: true, email: true } });
        const pick = <T>(arr: Array<T>): T => arr[Math.floor(Math.random() * arr.length)];
        for (let i = 0; i < 5; i++) {
          const customer = pick(customers);
          const selected = Array.from(
            new Set([pick(products), pick(products), pick(products)])
          ).slice(0, 3);
          const value = selected.reduce((sum, p) => sum + Number(p.price.toString()), 0);
          const proposal = await prisma.proposal.create({
            data: {
              tenantId: 'tenant_default',
              title: `Bundle Combo ${i + 1} for ${customer?.name || 'Unknown Customer'}`,
              status: ProposalStatus.SUBMITTED,
              priority: pick([Priority.LOW, Priority.MEDIUM, Priority.HIGH]),
              customerId: customer?.id || 'unknown-customer',
              createdBy: user?.id || pick(await prisma.user.findMany({ select: { id: true } })).id,
              dueDate: new Date(Date.now() + (i + 10) * 24 * 60 * 60 * 1000),
              value,
              currency: 'USD',
              customerName: customer?.name || 'Unknown Customer',
              creatorEmail: user?.email,
              assignedTo: user ? { connect: [{ id: user.id }] } : undefined,
            },
          });
          for (const p of selected) {
            await prisma.proposalProduct.create({
              data: {
                proposalId: proposal.id,
                productId: p.id,
                quantity: 1,
                unitPrice: p.price,
                total: p.price,
              },
            });
          }
        }
        console.log('✅ Added multi-product proposals for bundle analytics');
      }
    }

    // Done with selective seeding
    // Adjust win rate to ~70% by updating a portion of non-closed proposals to ACCEPTED
    {
      const total = await prisma.proposal.count();
      const targetWon = Math.floor(total * 0.7);
      const currentWon = await prisma.proposal.count({
        where: { status: ProposalStatus.ACCEPTED },
      });
      if (currentWon < targetWon) {
        const need = targetWon - currentWon;
        const candidates = await prisma.proposal.findMany({
          where: {
            status: {
              in: [
                ProposalStatus.DRAFT,
                ProposalStatus.IN_REVIEW,
                ProposalStatus.PENDING_APPROVAL,
                ProposalStatus.SUBMITTED,
              ],
            },
          },
          select: { id: true },
          take: need,
          orderBy: { updatedAt: 'desc' },
        });
        if (candidates.length) {
          for (const c of candidates) {
            await prisma.proposal.update({
              where: { id: c.id },
              data: {
                status: ProposalStatus.ACCEPTED,
                approvedAt: new Date(),
                submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              },
            });
          }
          console.log(`✅ Adjusted win rate: converted ${candidates.length} proposals to ACCEPTED`);
        }
      }
    }

    // Ensure near-due open proposals (next 14 days)
    {
      const now = new Date();
      const upper = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const openStatuses = [
        ProposalStatus.DRAFT,
        ProposalStatus.IN_REVIEW,
        ProposalStatus.PENDING_APPROVAL,
        ProposalStatus.APPROVED,
      ];
      const countNear = await prisma.proposal.count({
        where: { status: { in: openStatuses }, dueDate: { gte: now, lte: upper } },
      });
      if (countNear < 10) {
        const need = 10 - countNear;
        const candidates = await prisma.proposal.findMany({
          where: { status: { in: openStatuses } },
          select: { id: true },
          take: need,
          orderBy: { updatedAt: 'desc' },
        });
        for (const c of candidates) {
          const offsetDays = Math.floor(Math.random() * 14) + 1;
          await prisma.proposal.update({
            where: { id: c.id },
            data: { dueDate: new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000) },
          });
        }
        if (candidates.length)
          console.log(`✅ Ensured near-due coverage by updating ${candidates.length} proposals`);
      }
    }

    // Normalize names to Arabic transliteration for existing users/customers and denormalized proposal labels
    {
      const renameUser: Record<string, string> = {
        'Michael Chen': 'Ahmed Al-Farsi',
        'Emma Rodriguez': 'Layla Hassan',
        'David Kim': 'Youssef Mahmoud',
        'Dr. James Wilson': 'Dr. Omar Khalid',
        'Lisa Zhang': 'Fatima Al-Zahra',
        'Sarah Johnson': 'Sara Ahmed',
        'Maria Garcia': 'Mariam Nasser',
        'Robert Taylor': 'Khalid Rahman',
        'Demo User': 'Ayyub Demo',
      };
      for (const [from, to] of Object.entries(renameUser)) {
        await prisma.user.updateMany({ where: { name: from }, data: { name: to } });
      }

      const renameCustomer: Record<string, string> = {
        'Al Noor Technologies': 'Al Noor Technologies',
        'Al Quds Financial': 'Al Quds Financial',
        'Healthcare Innovations Inc': 'Shifa Health Innovations',
        'Manufacturing Excellence LLC': 'Al Hadid Manufacturing',
        'EduTech Systems': 'Al Ilm Education Systems',
      };
      for (const [from, to] of Object.entries(renameCustomer)) {
        await prisma.customer.updateMany({ where: { name: from }, data: { name: to } });
      }

      // Refresh denormalized creatorName/customerName on proposals
      const batch = await prisma.proposal.findMany({
        select: { id: true, createdBy: true, customerId: true },
        take: 500,
      });
      for (const p of batch) {
        const [u, c] = await Promise.all([
          prisma.user.findUnique({ where: { id: p.createdBy }, select: { name: true } }),
          prisma.customer.findUnique({ where: { id: p.customerId }, select: { name: true } }),
        ]);
        await prisma.proposal.update({
          where: { id: p.id },
          data: { creatorName: u?.name ?? undefined, customerName: c?.name ?? undefined },
        });
      }
      console.log('✅ Updated names to Arabic transliteration and refreshed proposal labels');
    }

    // Ensure team assignment distribution (at least 2 members per proposal where possible)
    {
      const candidateUsers = await prisma.user.findMany({
        where: {
          email: {
            in: [
              'pm1@posalpro.com',
              'pm2@posalpro.com',
              'sme1@posalpro.com',
              'sme2@posalpro.com',
              'sme3@posalpro.com',
            ],
          },
        },
        select: { id: true },
      });
      const ids = candidateUsers.map(u => u.id);
      if (ids.length >= 2) {
        const unassigned = await prisma.proposal.findMany({
          where: { assignedTo: { none: {} } },
          select: { id: true },
          take: 2000,
        });
        for (const p of unassigned) {
          const a = ids[Math.floor(Math.random() * ids.length)];
          let b = ids[Math.floor(Math.random() * ids.length)];
          if (b === a) b = ids[(ids.indexOf(a) + 1) % ids.length];
          await prisma.proposal.update({
            where: { id: p.id },
            data: { assignedTo: { connect: [{ id: a }, { id: b }] } },
          });
        }
        if (unassigned.length) console.log(`✅ Assigned teams to ${unassigned.length} proposals`);
      }
    }

    // Backfill financials: ensure ProposalProduct totals and Proposal.value match sum of products
    {
      // Ensure every proposal has at least one product selection
      const noProducts = await prisma.proposal.findMany({
        where: { products: { none: {} } },
        select: { id: true },
        take: 5000,
      });
      if (noProducts.length) {
        const prods = await prisma.product.findMany({
          select: { id: true, price: true },
          take: 50,
        });
        for (const p of noProducts) {
          const pick = prods[Math.floor(Math.random() * prods.length)];
          if (pick) {
            await prisma.proposalProduct.create({
              data: {
                proposalId: p.id,
                productId: pick.id,
                quantity: 1,
                unitPrice: pick.price,
                total: pick.price,
              },
            });
          }
        }
        console.log(`✅ Added at least one product to ${noProducts.length} proposals with none`);
      }

      const items = await prisma.proposalProduct.findMany({
        select: { id: true, proposalId: true, quantity: true, unitPrice: true, total: true },
        take: 100000,
      });
      const changed: Array<Promise<any>> = [];
      const sumByProposal = new Map<string, number>();
      for (const it of items) {
        const correct = Number(it.unitPrice) * Number(it.quantity || 0);
        if (Math.abs(Number(it.total) - correct) > 0.5) {
          changed.push(
            prisma.proposalProduct.update({ where: { id: it.id }, data: { total: correct } })
          );
        }
        sumByProposal.set(it.proposalId, (sumByProposal.get(it.proposalId) || 0) + correct);
      }
      if (changed.length) await Promise.allSettled(changed);
      const updates: Array<Promise<any>> = [];
      for (const [pid, sum] of Array.from(sumByProposal.entries())) {
        updates.push(
          prisma.proposal.update({ where: { id: pid }, data: { value: sum, totalValue: sum } })
        );
      }
      if (updates.length) await Promise.allSettled(updates);
      if (changed.length || updates.length)
        console.log(
          `✅ Financials backfilled (products updated: ${changed.length}, proposals updated: ${updates.length})`
        );
    }

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
          scope: PermissionScope[perm.scope as keyof typeof PermissionScope],
        },
      },
      update: {},
      create: {
        resource: perm.resource,
        action: perm.action,
        scope: PermissionScope[perm.scope as keyof typeof PermissionScope],
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
      performanceExpectations: toPrismaJson({
        systemUptime: 99.9,
        responseTime: 2.0,
        securityIncidents: 0,
      }),
    },
    {
      name: 'Executive',
      description: 'Executive-level access with strategic oversight capabilities',
      level: 2,
      isSystem: true,
      performanceExpectations: toPrismaJson({
        proposalApprovalTime: 24.0,
        strategicDecisionQuality: 95.0,
        teamPerformance: 90.0,
      }),
    },
    {
      name: 'Proposal Manager',
      description: 'Comprehensive proposal management with team coordination',
      level: 3,
      isSystem: true,
      performanceExpectations: toPrismaJson({
        proposalCompletionRate: 95.0,
        teamCoordination: 90.0,
        qualityScore: 85.0,
        timelineAdherence: 88.0,
      }),
    },
    {
      name: 'Senior SME',
      description: 'Senior subject matter expert with mentoring responsibilities',
      level: 4,
      isSystem: true,
      performanceExpectations: toPrismaJson({
        expertiseAccuracy: 95.0,
        contentQuality: 90.0,
        mentoring: 85.0,
        responseTime: 4.0,
      }),
    },
    {
      name: 'SME',
      description: 'Subject matter expert providing technical expertise',
      level: 5,
      isSystem: true,
      performanceExpectations: toPrismaJson({
        expertiseAccuracy: 90.0,
        contentQuality: 85.0,
        responseTime: 6.0,
      }),
    },
    {
      name: 'Content Manager',
      description: 'Content creation and management specialist',
      level: 6,
      isSystem: true,
      performanceExpectations: toPrismaJson({
        contentQuality: 88.0,
        contentVolume: 75.0,
        turnaroundTime: 48.0,
      }),
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
      name: 'Sara Ahmed',
      password: defaultPassword,
      department: 'Executive',
      status: 'ACTIVE',
      roleName: 'Executive',
    },
    {
      email: 'pm1@posalpro.com',
      name: 'Ahmed Al-Farsi',
      password: defaultPassword,
      department: 'Business Development',
      status: 'ACTIVE',
      roleName: 'Proposal Manager',
    },
    {
      email: 'pm2@posalpro.com',
      name: 'Layla Hassan',
      password: defaultPassword,
      department: 'Business Development',
      status: 'ACTIVE',
      roleName: 'Proposal Manager',
    },
    {
      email: 'sme1@posalpro.com',
      name: 'Dr. Omar Khalid',
      password: defaultPassword,
      department: 'Technology',
      status: 'ACTIVE',
      roleName: 'Senior SME',
    },
    {
      email: 'sme2@posalpro.com',
      name: 'Fatima Al-Zahra',
      password: defaultPassword,
      department: 'Engineering',
      status: 'ACTIVE',
      roleName: 'SME',
    },
    {
      email: 'sme3@posalpro.com',
      name: 'Youssef Mahmoud',
      password: defaultPassword,
      department: 'Security',
      status: 'ACTIVE',
      roleName: 'SME',
    },
    {
      email: 'content1@posalpro.com',
      name: 'Mariam Nasser',
      password: defaultPassword,
      department: 'Marketing',
      status: 'ACTIVE',
      roleName: 'Content Manager',
    },
    {
      email: 'content2@posalpro.com',
      name: 'Khalid Rahman',
      password: defaultPassword,
      department: 'Documentation',
      status: 'ACTIVE',
      roleName: 'Content Manager',
    },
    {
      email: 'demo@posalpro.com',
      name: 'Ayyub Demo',
      password: defaultPassword,
      department: 'Demo',
      status: 'ACTIVE',
      roleName: 'Proposal Manager',
    },
    // Additional QA test users
    {
      email: 'qa.manager@posalpro.com',
      name: 'QA Manager',
      password: defaultPassword,
      department: 'Quality Assurance',
      status: 'ACTIVE',
      roleName: 'Proposal Manager',
    },
    {
      email: 'qa.sme@posalpro.com',
      name: 'QA SME',
      password: defaultPassword,
      department: 'Quality Assurance',
      status: 'ACTIVE',
      roleName: 'SME',
    },
    {
      email: 'qa.content@posalpro.com',
      name: 'QA Content Manager',
      password: defaultPassword,
      department: 'Quality Assurance',
      status: 'ACTIVE',
      roleName: 'Content Manager',
    },
    {
      email: 'qa.admin@posalpro.com',
      name: 'QA Admin',
      password: defaultPassword,
      department: 'Quality Assurance',
      status: 'ACTIVE',
      roleName: 'System Administrator',
    },
  ];

  const createdUsers: Record<string, any> = {};
  for (const userData of usersData) {
    const user = await prisma.user.create({
      data: {
        tenantId: 'tenant_default',
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

  // ----------------------------------------
  // Baseline: User & Communication Preferences (for empty DB)
  // ----------------------------------------
  console.log('⚙️ Seeding user preferences and communication preferences...');
  {
    const usersAll = Object.values(createdUsers);
    for (const u of usersAll) {
      await prisma.userPreferences.create({
        data: {
          userId: u.id,
          theme: 'system',
          language: 'en',
          analyticsConsent: false,
          performanceTracking: false,
        },
      });
      await prisma.communicationPreferences.create({
        data: {
          userId: u.id,
          language: 'en',
          timezone: 'UTC',
          quietHoursStart: null,
          quietHoursEnd: null,
          channels: { email: true, inApp: true },
          frequency: { general: 'daily' },
          categories: { proposals: true, content: true },
        },
      });
    }
  }

  // ========================================
  // CUSTOMERS SETUP
  // ========================================

  console.log('🏢 Creating customers...');

  const customersData = [
    {
      name: 'Al Noor Technologies',
      email: 'contact@alnoor-tech.com',
      industry: 'Technology',
      tier: 'ENTERPRISE',
      status: 'ACTIVE',
      description: 'Leading technology solutions provider',
      contacts: [
        {
          name: 'Aisha Saleh',
          email: 'alice.johnson@techcorp.com',
          phone: '+1-555-0101',
          title: 'CTO',
          isPrimary: true,
        },
        {
          name: 'Bilal Hamdan',
          email: 'bob.smith@techcorp.com',
          phone: '+1-555-0102',
          title: 'Procurement Manager',
          isPrimary: false,
        },
      ],
    },
    {
      name: 'Al Quds Financial',
      email: 'contact@alquds-financial.com',
      industry: 'Financial Services',
      tier: 'ENTERPRISE',
      status: 'ACTIVE',
      description: 'International banking and financial services',
      contacts: [
        {
          name: 'Carim Dawood',
          email: 'carol.davis@globalfin.com',
          phone: '+1-555-0201',
          title: 'VP of Technology',
          isPrimary: true,
        },
      ],
    },
    {
      name: 'Shifa Health Innovations',
      email: 'contact@shifa-health.com',
      industry: 'Healthcare',
      tier: 'PREMIUM',
      status: 'ACTIVE',
      description: 'Healthcare technology and innovation',
      contacts: [
        {
          name: 'Dr. Huda Mansour',
          email: 'emily.wilson@healthinnov.com',
          phone: '+1-555-0301',
          title: 'Chief Medical Officer',
          isPrimary: true,
        },
      ],
    },
    {
      name: 'Al Hadid Manufacturing',
      email: 'contact@alhadid-mfg.com',
      industry: 'Manufacturing',
      tier: 'STANDARD',
      status: 'ACTIVE',
      description: 'Advanced manufacturing solutions',
      contacts: [
        {
          name: 'Faris Milad',
          email: 'frank.miller@manufexcel.com',
          phone: '+1-555-0401',
          title: 'Operations Director',
          isPrimary: true,
        },
      ],
    },
    {
      name: 'Al Ilm Education Systems',
      email: 'contact@alilm-edu.com',
      industry: 'Education',
      tier: 'STANDARD',
      status: 'ACTIVE',
      description: 'Educational technology solutions',
      contacts: [
        {
          name: 'Ghada Ali',
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
        tenantId: 'tenant_default',
        name: customerData.name,
        email: customerData.email,
        industry: customerData.industry,
        tier: customerData.tier as 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' | 'VIP',
        status: customerData.status as 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'CHURNED',
        tags: [customerData.industry],
        metadata: {
          description: customerData.description,
        },
      },
    });

    // Create customer contacts
    for (const contactData of customerData.contacts) {
      await prisma.customerContact.create({
        data: {
          customerId: customer?.id || 'unknown-customer',
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
      name: 'Sahab Cloud Platform',
      description: 'Comprehensive cloud infrastructure and management platform',
      sku: 'ECP-3.0',
      price: 15000.0,
      category: ['Cloud Infrastructure'],
      isActive: true,
      tags: ['cloud', 'infrastructure', 'enterprise', 'scalable'],
    },
    {
      name: 'Bayan Analytics Suite',
      description: 'Advanced AI-powered analytics and business intelligence platform',
      sku: 'AAS-2.1',
      price: 12000.0,
      category: ['Analytics'],
      isActive: true,
      tags: ['ai', 'analytics', 'business-intelligence', 'machine-learning'],
    },
    {
      name: 'Amn Security Monitoring',
      description: 'Real-time security monitoring and threat detection system',
      sku: 'SMS-4.2',
      price: 8000.0,
      category: ['Security'],
      isActive: true,
      tags: ['security', 'monitoring', 'threat-detection', 'compliance'],
    },
    {
      name: 'Rabt Data Integration',
      description: 'Enterprise data integration and ETL platform',
      sku: 'DIP-1.8',
      price: 10000.0,
      category: ['Data Management'],
      isActive: true,
      tags: ['data-integration', 'etl', 'data-warehouse', 'enterprise'],
    },
    {
      name: 'Jawwal Mobile Framework',
      description: 'Cross-platform mobile application development framework',
      sku: 'MDF-5.0',
      price: 5000.0,
      category: ['Development Tools'],
      isActive: true,
      tags: ['mobile', 'development', 'cross-platform', 'framework'],
    },
    {
      name: 'Raqib IoT Management',
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
        tenantId: 'tenant_default',
        name: productData.name,
        description: productData.description,
        sku: productData.sku,
        price: productData.price,
        images: [],
        userStoryMappings: [],
        category: productData.category,
        tags: productData.tags,
        isActive: productData.isActive,
      },
    });

    createdProducts[productData.name] = product;
  }

  console.log(`✅ Created ${Object.keys(createdProducts).length} products`);

  // ----------------------------------------
  // Baseline: Approval Workflows
  // ----------------------------------------
  console.log('🧭 Creating baseline approval workflows...');
  {
    const creator = Object.values(createdUsers)[0];
    await prisma.approvalWorkflow.create({
      data: {
        name: 'Standard Proposal Approval',
        description: 'Two-stage review and approval for proposals',
        entityType: 'PROPOSAL',
        userStoryMappings: [],
        createdBy: creator?.id ?? 'unknown',
        stages: {
          create: [
            { name: 'Manager Review', order: 1, slaHours: 24, approvers: [] },
            { name: 'Executive Approval', order: 2, slaHours: 48, approvers: [] },
          ],
        },
      },
    });
    await prisma.approvalWorkflow.create({
      data: {
        name: 'Content Quality Review',
        description: 'Quality and compliance review for content items',
        entityType: 'CONTENT',
        userStoryMappings: [],
        createdBy: creator?.id ?? 'unknown',
        stages: {
          create: [{ name: 'Content Manager Review', order: 1, slaHours: 12, approvers: [] }],
        },
      },
    });
  }

  // ----------------------------------------
  // Baseline: Validation Rules
  // ----------------------------------------
  console.log('📏 Creating baseline validation rules...');
  {
    const creator = Object.values(createdUsers)[0];
    const anyProduct = Object.values(createdProducts)[0];
    await prisma.validationRule.createMany({
      data: [
        {
          name: 'Basic Proposal Completeness',
          description: 'Ensure proposals have at least one section and one product',
          category: 'Proposal',
          ruleType: ValidationRuleType.COMPLIANCE,
          conditions: toPrismaJson({ minSections: 1, minProducts: 1 }),
          actions: toPrismaJson({ severity: 'WARNING' }),
          severity: Severity.WARNING,
          isActive: true,
          createdBy: creator?.id ?? 'unknown',
          userStoryMappings: ['US-1.1'],
          hypothesesSupported: ['H1'],
        },
        {
          name: 'Product Active Compatibility',
          description: 'If a product is inactive, warn about selection',
          category: 'Product',
          ruleType: ValidationRuleType.COMPATIBILITY,
          conditions: toPrismaJson({ requireActive: true }),
          actions: toPrismaJson({ warnIfInactive: true }),
          severity: Severity.INFO,
          isActive: true,
          createdBy: creator?.id ?? 'unknown',
          productId: anyProduct?.id,
          userStoryMappings: ['US-2.3'],
          hypothesesSupported: ['H3'],
        },
      ],
    });
  }

  // ----------------------------------------
  // Baseline: Product Relationships and Rules
  // ----------------------------------------
  console.log('🔗 Creating baseline product relationships and rules...');
  {
    const creator = Object.values(createdUsers)[0];
    const productList = Object.values(createdProducts);
    if (productList.length >= 2) {
      await prisma.productRelationship.create({
        data: {
          sourceProductId: productList[0].id,
          targetProductId: productList[1].id,
          type: RelationshipType.RECOMMENDS,
          createdBy: creator?.id ?? 'unknown',
          condition: toPrismaJson({ minVersion: 1 }),
        },
      });
    }

    const prod = productList[0];
    if (prod) {
      const rule = await prisma.productRelationshipRule.create({
        data: {
          productId: prod.id,
          name: 'Recommend Security Monitoring',
          ruleType: RuleKind.RECOMMENDS,
          status: RuleStatus.PUBLISHED,
          isPublished: true,
          version: 1,
          precedence: 1,
          rule: toPrismaJson({
            if: { category: 'Cloud Infrastructure' },
            then: { recommends: 'Security Monitoring System' },
          }),
          scope: toPrismaJson({ region: 'global' }),
          explain: 'Recommends security for cloud platform',
          createdBy: creator?.id ?? 'unknown',
        },
      });
      await prisma.productRelationshipRuleVersion.create({
        data: {
          ruleId: rule.id,
          version: 1,
          status: RuleStatus.PUBLISHED,
          rule: toPrismaJson(rule.rule),
          explain: rule.explain ?? undefined,
          createdBy: creator?.id ?? 'unknown',
        },
      });
    }
  }

  // ========================================
  // CONTENT SETUP
  // ========================================

  console.log('📄 Creating content templates...');

  const contentData = [
    {
      title: 'Executive Summary Template',
      type: ContentType.TEMPLATE,
      category: ['Executive'],
      content: 'Executive summary template for high-level proposal overview...',
      tags: ['executive', 'summary', 'overview'],
    },
    {
      title: 'Technical Architecture Overview',
      type: ContentType.TEMPLATE,
      category: ['Technical'],
      content: 'Technical architecture template for system design proposals...',
      tags: ['technical', 'architecture', 'system-design'],
    },
    {
      title: 'Security Compliance Framework',
      type: ContentType.DOCUMENT,
      category: ['Security'],
      content: 'Comprehensive security compliance framework and requirements...',
      tags: ['security', 'compliance', 'framework'],
    },
    {
      title: 'Cost Benefit Analysis Template',
      type: ContentType.TEMPLATE,
      category: ['Financial'],
      content: 'Cost benefit analysis template for ROI calculations...',
      tags: ['financial', 'roi', 'cost-benefit'],
    },
    {
      title: 'Implementation Timeline Template',
      type: ContentType.TEMPLATE,
      category: ['Project Management'],
      content: 'Project implementation timeline and milestone template...',
      tags: ['timeline', 'implementation', 'milestones'],
    },
  ];

  const createdContent: Record<string, { id: string }> = {};
  for (const contentItem of contentData) {
    const content = await prisma.content.create({
      data: {
        title: contentItem.title,
        type: contentItem.type,
        category: contentItem.category,
        content: contentItem.content,
        tags: contentItem.tags,
        keywords: contentItem.tags,
        allowedRoles: [],
        isActive: true,
        createdBy: createdUsers['content1@posalpro.com'].id,
      },
    });

    createdContent[contentItem.title] = { id: content.id };
  }

  console.log(`✅ Created ${Object.keys(createdContent).length} content items`);

  // ----------------------------------------
  // Baseline: Content Access Logs
  // ----------------------------------------
  console.log('📚 Creating baseline content access logs...');
  {
    const contentList = Object.values(createdContent).slice(0, 2);
    const userList = Object.values(createdUsers).slice(0, 2);
    for (const c of contentList) {
      for (const u of userList) {
        await prisma.contentAccessLog.create({
          data: {
            contentId: c.id,
            userId: u.id,
            accessType: AccessType.VIEW,
            userStory: 'US-0.0',
            performanceImpact: 0,
          },
        });
      }
    }
  }

  // ========================================
  // PROPOSALS SETUP
  // ========================================

  console.log('📋 Creating sample proposals...');

  const proposalsData = [
    // Won Proposals (for revenue tracking)
    {
      title: 'TechCorp Cloud Migration Project',
      description: 'Complete cloud infrastructure migration for Al Noor Technologies',
      status: ProposalStatus.ACCEPTED,
      priority: Priority.HIGH,
      customerName: 'Al Noor Technologies',
      creatorEmail: 'pm1@posalpro.com',
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago (completed)
      products: ['Sahab Cloud Platform', 'Amn Security Monitoring'],
      rfpReferenceNumber: 'RFP-2024-001',
      value: 320000,
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
      status: ProposalStatus.ACCEPTED,
      priority: Priority.HIGH,
      customerName: 'Al Quds Financial',
      creatorEmail: 'pm2@posalpro.com',
      dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago (completed)
      products: ['Bayan Analytics Suite', 'Rabt Data Integration'],
      rfpReferenceNumber: 'RFP-2024-002',
      value: 280000,
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
      status: ProposalStatus.ACCEPTED,
      priority: Priority.MEDIUM,
      customerName: 'Shifa Health Innovations',
      creatorEmail: 'sme1@posalpro.com',
      dueDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago (completed)
      products: ['Raqib IoT Management'],
      rfpReferenceNumber: 'RFP-2024-003',
      value: 150000,
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
    // Active Proposals (in progress)
    {
      title: 'Manufacturing Process Optimization',
      description: 'Digital transformation for manufacturing processes',
      status: ProposalStatus.IN_REVIEW,
      priority: Priority.HIGH,
      customerName: 'Al Hadid Manufacturing',
      creatorEmail: 'pm1@posalpro.com',
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      products: ['Rabt Data Integration', 'Bayan Analytics Suite'],
      rfpReferenceNumber: 'RFP-2025-001',
      value: 220000,
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
      status: ProposalStatus.IN_REVIEW,
      priority: Priority.MEDIUM,
      customerName: 'Al Ilm Education Systems',
      creatorEmail: 'sme2@posalpro.com',
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      products: ['Jawwal Mobile Framework'],
      rfpReferenceNumber: 'RFP-2025-002',
      value: 95000,
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
    // Overdue Proposals (for risk indicators)
    {
      title: 'Enterprise Security Audit',
      description: 'Comprehensive security assessment and compliance audit',
      status: ProposalStatus.IN_REVIEW,
      priority: Priority.HIGH,
      customerName: 'Al Noor Technologies',
      creatorEmail: 'pm1@posalpro.com',
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue
      products: ['Amn Security Monitoring'],
      rfpReferenceNumber: 'RFP-2025-003',
      value: 85000,
      currency: 'USD',
      tags: ['security', 'audit', 'compliance'],
      team: {
        teamLead: 'pm1@posalpro.com',
        salesRepresentative: 'pm2@posalpro.com',
        subjectMatterExperts: {
          SECURITY: 'sme3@posalpro.com',
        },
      },
    },
    // Draft Proposals (pipeline)
    {
      title: 'Smart City IoT Infrastructure',
      description: 'City-wide IoT infrastructure for smart city initiatives',
      status: ProposalStatus.DRAFT,
      priority: Priority.HIGH,
      customerName: 'Al Quds Financial',
      creatorEmail: 'pm2@posalpro.com',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      products: ['Raqib IoT Management', 'Sahab Cloud Platform'],
      rfpReferenceNumber: 'RFP-2025-004',
      value: 450000,
      currency: 'USD',
      tags: ['smart-city', 'iot', 'infrastructure'],
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
      title: 'Financial Risk Analytics Platform',
      description: 'Advanced risk modeling and analytics for financial institutions',
      status: ProposalStatus.DRAFT,
      priority: Priority.MEDIUM,
      customerName: 'Al Quds Financial',
      creatorEmail: 'pm1@posalpro.com',
      dueDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), // 75 days from now
      products: ['Bayan Analytics Suite'],
      rfpReferenceNumber: 'RFP-2025-005',
      value: 180000,
      currency: 'USD',
      tags: ['finance', 'risk', 'analytics'],
      team: {
        teamLead: 'pm1@posalpro.com',
        salesRepresentative: 'pm2@posalpro.com',
        subjectMatterExperts: {
          TECHNICAL: 'sme1@posalpro.com',
        },
      },
    },
  ];

  const createdProposals: Record<string, any> = {};
  for (const proposalData of proposalsData) {
    const customer = createdCustomers[proposalData.customerName];
    const creator = createdUsers[proposalData.creatorEmail];

    // Skip if customer or creator not found (defensive programming)
    if (!customer || !creator) {
      console.log(
        `⚠️ Skipping proposal for ${proposalData.customerName} - customer/creator not found`
      );
      continue;
    }

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
        tenantId: 'tenant_default',
        title: proposalData.title,
        description: proposalData.description,
        status: proposalData.status,
        priority: proposalData.priority,
        customerId: customer?.id || 'unknown-customer',
        createdBy: creator.id,
        dueDate: proposalData.dueDate,
        value: proposalData.value,
        currency: proposalData.currency,
        tags: proposalData.tags,

        metadata: toPrismaJson({
          createdBy: creator.id,
          createdAt: new Date().toISOString(),
          userStories: ['US-5.1', 'US-5.2'],
          hypothesis: ['H4', 'H7'],
          teamAssignments: {
            teamLead: teamLeadId,
            salesRepresentative: salesRepId,
            subjectMatterExperts: smeIds,
          },
          wizardProducts: (() => {
            const wizardProducts = proposalData.products
              .map(productName => {
                const product = createdProducts[productName];
                if (!product) return null;
                return {
                  id: product.id,
                  name: product.name,
                  included: true,
                  quantity: 1,
                  unitPrice: Number(product.price.toString()),
                  totalPrice: Number(product.price.toString()),
                  category: product.category?.[0] ?? 'General',
                  configuration: {},
                  customizations: [],
                  notes: '',
                };
              })
              .filter((p): p is NonNullable<typeof p> => p !== null);
            return wizardProducts;
          })(),
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
            step4: {
              products: (() => {
                const wizardProducts = proposalData.products
                  .map(productName => {
                    const product = createdProducts[productName];
                    if (!product) return null;
                    return {
                      id: product.id,
                      name: product.name,
                      included: true,
                      quantity: 1,
                      unitPrice: Number(product.price.toString()),
                      totalPrice: Number(product.price.toString()),
                      category: product.category?.[0] ?? 'General',
                      configuration: {},
                      customizations: [],
                      notes: '',
                    };
                  })
                  .filter((p): p is NonNullable<typeof p> => p !== null);
                return wizardProducts;
              })(),
            },
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
        }),
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
      { title: 'Executive Summary', type: SectionType.TEXT, order: 1 },
      { title: 'Technical Requirements', type: SectionType.TEXT, order: 2 },
      { title: 'Product Configuration', type: SectionType.PRODUCTS, order: 3 },
      { title: 'Implementation Plan', type: SectionType.TEXT, order: 4 },
      { title: 'Pricing and Terms', type: SectionType.TERMS, order: 5 },
    ];

    for (const sectionData of sections) {
      await prisma.proposalSection.create({
        data: {
          proposalId: newProposal.id,
          title: sectionData.title,
          content: `${sectionData.title} content for ${proposalData.title}`,
          type: sectionData.type,
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

  // ----------------------------------------
  // Baseline: Proposal Versions
  // ----------------------------------------
  console.log('🗂️ Creating baseline proposal versions...');
  {
    for (const proposal of Object.values(createdProposals)) {
      await prisma.proposalVersion.create({
        data: {
          proposalId: proposal.id,
          version: 1,
          createdBy: proposal.createdBy,
          changeType: 'INITIAL',
          changesSummary: 'Initial snapshot',
          snapshot: toPrismaJson({ seeded: true }),
          productIds: [],
        },
      });
    }
  }

  // ========================================
  // OPTIONAL: COMMUNICATIONS SUPPORT SEEDING
  // ========================================

  // Seed hypothesis validation events if none exist to provide initial communications
  const hvCount = await prisma.hypothesisValidationEvent.count();
  if (hvCount === 0) {
    console.log('🧪 Seeding hypothesis validation events...');
    const hypotheses = [
      HypothesisType.H1,
      HypothesisType.H3,
      HypothesisType.H4,
      HypothesisType.H6,
      HypothesisType.H7,
      HypothesisType.H8,
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
          measurementData: toPrismaJson({ source: 'seed', idx: i }),
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
  console.log('👥 Verifying proposal team assignments...');
  const orphanProposals = await prisma.proposal.findMany({
    where: { assignedTo: { none: {} } },
    select: { id: true, title: true },
  });
  console.log(`🔎 Proposals without team assignments: ${orphanProposals.length}`);
  if (orphanProposals.length > 0) {
    console.log(
      '👥 Assigning default users to a subset of unassigned proposals to support participants API...'
    );
    const assignableUsers = await prisma.user.findMany({
      where: { email: { in: ['pm1@posalpro.com', 'sme1@posalpro.com'] } },
      select: { id: true },
    });
    for (const p of orphanProposals.slice(0, 3)) {
      await prisma.proposal.update({
        where: { id: p.id },
        data: {
          assignedTo: {
            connect: assignableUsers.map(u => ({ id: u.id })),
          },
        },
      });
    }
    const remaining = await prisma.proposal.count({
      where: { assignedTo: { none: {} } },
    });
    console.log(`✅ Safety net complete. Remaining unassigned proposals: ${remaining}`);
  } else {
    console.log('✅ All proposals already have assigned team members.');
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
  console.log('   - pm2@posalpro.com (Proposal Manager)');
  console.log('   - sme1@posalpro.com (Senior SME)');
  console.log('   - sme2@posalpro.com (SME)');
  console.log('   - sme3@posalpro.com (SME)');
  console.log('   - content1@posalpro.com (Content Manager)');
  console.log('   - content2@posalpro.com (Content Manager)');
  console.log('   - qa.manager@posalpro.com (QA Proposal Manager)');
  console.log('   - qa.sme@posalpro.com (QA SME)');
  console.log('   - qa.content@posalpro.com (QA Content Manager)');
  console.log('   - qa.admin@posalpro.com (QA Administrator)');
}

main()
  .catch(e => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
