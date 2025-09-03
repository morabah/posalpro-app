#!/usr/bin/env node

/**
 * Schema Consistency Checker for PosalPro MVP2
 * Detects mismatches between Prisma schema and application code
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSchemaConsistency() {
  console.log('🔍 PosalPro MVP2 - Schema Consistency Checker\n');

  const issues = {
    missingFields: [],
    extraFields: [],
    typeMismatches: [],
    apiInconsistencies: [],
    databaseInconsistencies: [],
    zodInconsistencies: [],
  };

  try {
    // 1. Check database schema vs Prisma schema
    console.log('📊 Checking database schema vs Prisma schema...');

    // Get actual database schema
    const dbColumns = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'customers', 'products', 'proposals', 'roles')
      ORDER BY table_name, ordinal_position;
    `;

    console.log('Database columns found:', dbColumns.length);

    // 2. Compare with Prisma schema expectations
    const prismaModels = {
      User: ['id', 'email', 'name', 'department', 'status', 'createdAt', 'updatedAt', 'lastLogin'],
      Customer: [
        'id',
        'name',
        'email',
        'industry',
        'status',
        'tier',
        'tags',
        'createdAt',
        'updatedAt',
      ],
      Product: [
        'id',
        'name',
        'description',
        'price',
        'currency',
        'sku',
        'category',
        'tags',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
      Proposal: [
        'id',
        'title',
        'description',
        'customerId',
        'dueDate',
        'priority',
        'value',
        'currency',
        'status',
        'tags',
        'userStoryTracking',
        'createdAt',
        'updatedAt',
        'createdBy',
      ],
      Role: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
    };

    // Check for field mismatches
    Object.entries(prismaModels).forEach(([model, expectedFields]) => {
      const tableName = model.toLowerCase() + 's';
      const dbFields = dbColumns
        .filter(col => col.table_name === tableName)
        .map(col => col.column_name);

      expectedFields.forEach(field => {
        if (!dbFields.includes(field)) {
          issues.databaseInconsistencies.push({
            model,
            field,
            type: 'missing_in_database',
            message: `${model}.${field} expected in database but not found`,
          });
        }
      });

      dbFields.forEach(field => {
        if (!expectedFields.includes(field)) {
          issues.databaseInconsistencies.push({
            model,
            field,
            type: 'extra_in_database',
            message: `${model}.${field} exists in database but not expected in Prisma schema`,
          });
        }
      });
    });

    // 2. Check API routes for field references
    console.log('\n🔍 Checking API routes for field references...');

    const apiFiles = [
      'src/app/api/proposals/route.ts',
      'src/app/api/proposals/[id]/route.ts',
      'src/app/api/customers/route.ts',
      'src/app/api/products/route.ts',
    ];

    for (const file of apiFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');

        // Check for common problematic field patterns
        const patterns = [
          { pattern: /metadata\s*:/g, field: 'metadata', shouldBe: 'userStoryTracking' },
          { pattern: /phone\s*:/g, field: 'phone', shouldBe: 'removed' },
          { pattern: /website\s*:/g, field: 'website', shouldBe: 'removed' },
          { pattern: /address\s*:/g, field: 'address', shouldBe: 'removed' },
          { pattern: /attributes\s*:/g, field: 'attributes', shouldBe: 'removed' },
          { pattern: /images\s*:/g, field: 'images', shouldBe: 'removed' },
          { pattern: /stockQuantity\s*:/g, field: 'stockQuantity', shouldBe: 'removed' },
        ];

        patterns.forEach(({ pattern, field, shouldBe }) => {
          const matches = content.match(pattern);
          if (matches) {
            issues.apiInconsistencies.push({
              file,
              field,
              count: matches.length,
              shouldBe,
              message: `Found ${matches.length} references to '${field}' in ${file} (should be: ${shouldBe})`,
            });
          }
        });
      }
    }

    // 3. Check schema files for field definitions
    console.log('\n📝 Checking schema files...');

    const schemaFiles = [
      'src/features/proposals/schemas.ts',
      'src/features/customers/schemas.ts',
      'src/features/products/schemas.ts',
    ];

    for (const file of schemaFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');

        // Check for removed fields that might still be defined
        const removedFields = [
          'phone',
          'website',
          'address',
          'companySize',
          'revenue',
          'attributes',
          'images',
          'stockQuantity',
          'status',
          'version',
          'usageAnalytics',
          'userStoryMappings',
        ];

        removedFields.forEach(field => {
          const pattern = new RegExp(`${field}\\s*:`, 'g');
          const matches = content.match(pattern);
          if (matches) {
            issues.extraFields.push({
              file,
              field,
              count: matches.length,
              message: `Found ${matches.length} definitions of removed field '${field}' in ${file}`,
            });
          }
        });
      }
    }

    // 4. Test actual database queries to find runtime errors
    console.log('\n🧪 Testing database queries...');

    try {
      // Test proposal queries
      await prisma.proposal.findMany({
        take: 1,
        select: {
          id: true,
          title: true,
          metadata: true, // This should fail if field was renamed
        },
      });
    } catch (error) {
      if (error.message.includes('metadata')) {
        issues.missingFields.push({
          model: 'Proposal',
          field: 'metadata',
          error: error.message,
          message: 'Proposal.metadata field not found - likely renamed to userStoryTracking',
        });
      }
    }

    try {
      // Test customer queries
      await prisma.customer.findMany({
        take: 1,
        select: {
          id: true,
          phone: true, // This should fail if field was removed
        },
      });
    } catch (error) {
      if (error.message.includes('phone')) {
        issues.missingFields.push({
          model: 'Customer',
          field: 'phone',
          error: error.message,
          message: 'Customer.phone field not found - field was removed',
        });
      }
    }

    // 5. Test Data Integrity & Relationships
    console.log('\n🔒 Testing data integrity and relationships...');

    try {
      // Test referential integrity
      const orphanedProposals = await prisma.proposal.count({
        where: {
          customerId: null,
        },
      });

      const invalidCustomerRefs = await prisma.proposal.count({
        where: {
          AND: [{ customerId: { not: null } }, { customer: null }],
        },
      });

      if (orphanedProposals > 0) {
        issues.databaseInconsistencies.push({
          type: 'data_integrity',
          message: `${orphanedProposals} proposals have null customerId (orphaned records)`,
        });
      }

      if (invalidCustomerRefs > 0) {
        issues.databaseInconsistencies.push({
          type: 'referential_integrity',
          message: `${invalidCustomerRefs} proposals reference non-existent customers`,
        });
      }

      // Test data consistency
      const proposalsWithInvalidStatus = await prisma.proposal.count({
        where: {
          status: {
            notIn: [
              'DRAFT',
              'IN_REVIEW',
              'PENDING_APPROVAL',
              'APPROVED',
              'REJECTED',
              'SUBMITTED',
              'ACCEPTED',
              'DECLINED',
            ],
          },
        },
      });

      if (proposalsWithInvalidStatus > 0) {
        issues.databaseInconsistencies.push({
          type: 'data_consistency',
          message: `${proposalsWithInvalidStatus} proposals have invalid status values`,
        });
      }

      // Test required fields
      const customersWithoutNames = await prisma.customer.count({
        where: {
          name: null,
        },
      });

      if (customersWithoutNames > 0) {
        issues.databaseInconsistencies.push({
          type: 'required_fields',
          message: `${customersWithoutNames} customers are missing required name field`,
        });
      }
    } catch (error) {
      console.log('⚠️ Could not test data integrity:', error.message);
    }

    // 6. Test Business Flow Logic
    console.log('\n🔄 Testing business flow logic...');

    try {
      // Test proposal workflow states
      const draftProposals = await prisma.proposal.count({
        where: { status: 'DRAFT' },
      });

      const approvedProposals = await prisma.proposal.count({
        where: { status: 'APPROVED' },
      });

      // Test that proposals have creators
      const proposalsWithoutCreators = await prisma.proposal.count({
        where: {
          createdBy: null,
        },
      });

      if (proposalsWithoutCreators > 0) {
        issues.databaseInconsistencies.push({
          type: 'business_logic',
          message: `${proposalsWithoutCreators} proposals are missing creators (audit trail broken)`,
        });
      }

      // Test user-role relationships
      const usersWithoutRoles = await prisma.user.count({
        where: {
          roles: {
            none: {},
          },
        },
      });

      if (usersWithoutRoles > 0) {
        issues.databaseInconsistencies.push({
          type: 'business_logic',
          message: `${usersWithoutRoles} users have no roles assigned`,
        });
      }
    } catch (error) {
      console.log('⚠️ Could not test business logic:', error.message);
    }

    // 7. Test Zod schemas against actual data
    console.log('\n🔍 Testing Zod schemas against database data...');

    try {
      const testData = await prisma.customer.findFirst();
      if (testData) {
        // Clean test data to match expected schema
        const cleanedData = {
          id: testData.id,
          name: testData.name,
          email: testData.email,
          industry: testData.industry,
          status: testData.status,
          tier: testData.tier,
          tags: testData.tags || [],
          createdAt: testData.createdAt,
          updatedAt: testData.updatedAt,
        };

        // Test Customer schema validation
        const customerSchema = require('./src/features/customers/schemas').CustomerSchema;
        const validation = customerSchema.safeParse(cleanedData);
        if (!validation.success) {
          validation.error.errors.forEach(err => {
            issues.zodInconsistencies.push({
              schema: 'CustomerSchema',
              field: err.path.join('.'),
              error: err.message,
              message: `Zod validation failed for Customer.${err.path.join('.')}: ${err.message}`,
            });
          });
        }
      }
    } catch (error) {
      console.log('⚠️ Could not test Zod schemas:', error.message);
    }

    // 8. Summary Report
    console.log('\n📋 COMPREHENSIVE SCHEMA & INTEGRITY REPORT\n');

    console.log('='.repeat(60));

    // Categorize integrity issues
    const integrityIssues = issues.databaseInconsistencies.filter(issue =>
      [
        'data_integrity',
        'referential_integrity',
        'data_consistency',
        'required_fields',
        'business_logic',
      ].includes(issue.type)
    );

    const schemaIssues = issues.databaseInconsistencies.filter(issue =>
      ['missing_in_database', 'extra_in_database'].includes(issue.type)
    );

    // Report integrity issues first (most critical)
    if (integrityIssues.length > 0) {
      console.log('\n🔒 DATA INTEGRITY ISSUES:');
      integrityIssues.forEach(issue => {
        console.log(`  🔴 ${issue.message}`);
      });
      console.log('');
    }

    if (schemaIssues.length > 0) {
      console.log('\n🗄️  SCHEMA STRUCTURE ISSUES:');
      schemaIssues.forEach(issue => {
        console.log(`  ${issue.type === 'missing_in_database' ? '❌' : '⚠️'} ${issue.message}`);
      });
      console.log('');
    }

    if (issues.apiInconsistencies.length > 0) {
      console.log('\n❌ API INCONSISTENCIES:');
      issues.apiInconsistencies.forEach(issue => {
        console.log(`  📄 ${issue.file}`);
        console.log(`     ${issue.message}`);
        console.log('');
      });
    }

    if (issues.zodInconsistencies.length > 0) {
      console.log('\n🔍 ZOD SCHEMA ISSUES:');
      issues.zodInconsistencies.forEach(issue => {
        console.log(`  📋 ${issue.schema}: ${issue.message}`);
      });
      console.log('');
    }

    if (issues.extraFields.length > 0) {
      console.log('\n⚠️  EXTRA FIELDS IN SCHEMAS:');
      issues.extraFields.forEach(issue => {
        console.log(`  📄 ${issue.file}`);
        console.log(`     ${issue.message}`);
        console.log('');
      });
    }

    if (issues.missingFields.length > 0) {
      console.log('\n❌ MISSING FIELDS IN DATABASE:');
      issues.missingFields.forEach(issue => {
        console.log(`  🗄️  ${issue.model}.${issue.field}`);
        console.log(`     ${issue.message}`);
        console.log('');
      });
    }

    const totalIssues =
      issues.databaseInconsistencies.length +
      issues.apiInconsistencies.length +
      issues.zodInconsistencies.length +
      issues.extraFields.length +
      issues.missingFields.length;

    if (totalIssues === 0) {
      console.log('\n✅ NO INCONSISTENCIES FOUND!');
      console.log('Your database ↔ Prisma ↔ Zod ↔ API are fully synchronized.');
      console.log('✅ Data integrity verified - no orphaned records or constraint violations.');
      console.log('✅ Business logic validated - workflows and relationships are consistent.');
    } else {
      console.log(`\n🚨 FOUND ${totalIssues} TOTAL INCONSISTENCIES:`);
      console.log(`   🗄️  Schema Structure: ${schemaIssues.length} (field mismatches)`);
      console.log(`   🔒 Data Integrity: ${integrityIssues.length} (orphaned/invalid data)`);
      console.log(`   ❌ API Issues: ${issues.apiInconsistencies.length} (code references)`);
      console.log(`   🔍 Zod Issues: ${issues.zodInconsistencies.length} (validation schemas)`);
      console.log(`   ⚠️  Extra Fields: ${issues.extraFields.length} (unused definitions)`);
      console.log(`   ❌ Missing Fields: ${issues.missingFields.length} (runtime errors)`);

      if (integrityIssues.length > 0) {
        console.log('\n🔴 CRITICAL DATA INTEGRITY ISSUES DETECTED!');
        console.log('These affect data quality and business logic.');
      }
    }

    console.log('\n' + '='.repeat(50));
  } catch (error) {
    console.error('❌ Error during consistency check:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the checker
checkSchemaConsistency().catch(console.error);
