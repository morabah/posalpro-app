#!/usr/bin/env tsx

/**
 * Proposal Data Integration Verification Script
 *
 * This script performs comprehensive verification of:
 * 1. Database schema alignment with frontend types
 * 2. API route validation and response formats
 * 3. Frontend component data mapping
 * 4. Zod validation schema consistency
 * 5. Database relations and foreign keys
 * 6. Name resolution (IDs to readable names)
 * 7. Analytics integration
 * 8. Error handling patterns
 *
 * Usage:
 *   npm run tsx scripts/verify-proposal-data-integration.ts
 */

import { prisma } from '../src/lib/db/prisma';
import { logError, logInfo } from '../src/lib/logger';
import {
  ProposalCreateSchema,
  ProposalQuerySchema,
} from '../src/lib/validation/proposalValidation';
import { ProposalSchema } from '../src/services/proposalService';

// ====================
// Type Definitions for Verification
// ====================

interface VerificationResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
  recommendations?: string[];
}

interface DataFlowVerification {
  database: VerificationResult[];
  api: VerificationResult[];
  frontend: VerificationResult[];
  validation: VerificationResult[];
  analytics: VerificationResult[];
  naming: VerificationResult[];
}

// ====================
// Database Schema Verification
// ====================

async function verifyDatabaseSchema(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  try {
    logInfo('Starting database schema verification', { component: 'DataVerification' });

    // 1. Check Proposal table structure
    const proposalTable = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'proposals'
      ORDER BY ordinal_position
    `;

    const expectedColumns = [
      'id',
      'title',
      'description',
      'customerId',
      'createdBy',
      'status',
      'version',
      'priority',
      'value',
      'currency',
      'validUntil',
      'createdAt',
      'updatedAt',
      'dueDate',
      'submittedAt',
      'approvedAt',
      'performanceData',
      'userStoryTracking',
      'riskScore',
      'tags',
      'metadata',
      'cloudId',
      'lastSyncedAt',
      'syncStatus',
      'projectType',
      'approvalCount',
      'completionRate',
      'creatorEmail',
      'creatorName',
      'customerName',
      'customerTier',
      'lastActivityAt',
      'productCount',
      'sectionCount',
      'statsUpdatedAt',
      'totalValue',
    ];

    const actualColumns = (proposalTable as any[]).map(col => col.column_name);
    const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
    const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));

    if (missingColumns.length === 0 && extraColumns.length === 0) {
      results.push({
        test: 'Proposal Table Schema',
        status: 'PASS',
        message: 'All expected columns present in proposals table',
        details: { columnCount: actualColumns.length },
      });
    } else {
      results.push({
        test: 'Proposal Table Schema',
        status: 'FAIL',
        message: 'Schema mismatch detected',
        details: { missingColumns, extraColumns },
        recommendations: [
          'Update Prisma schema to match expected columns',
          'Run prisma db push to sync schema changes',
        ],
      });
    }

    // 2. Check foreign key relationships
    const foreignKeys = await prisma.$queryRaw`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'proposals'
    `;

    const expectedFKs = [
      { column: 'customerId', references: 'customers.id' },
      { column: 'createdBy', references: 'users.id' },
    ];

    const actualFKs = (foreignKeys as any[]).map(fk => ({
      column: fk.column_name,
      references: `${fk.foreign_table_name}.${fk.foreign_column_name}`,
    }));

    const missingFKs = expectedFKs.filter(
      expected =>
        !actualFKs.some(
          actual => actual.column === expected.column && actual.references === expected.references
        )
    );

    if (missingFKs.length === 0) {
      results.push({
        test: 'Foreign Key Relationships',
        status: 'PASS',
        message: 'All expected foreign key relationships present',
        details: { foreignKeyCount: actualFKs.length },
      });
    } else {
      results.push({
        test: 'Foreign Key Relationships',
        status: 'FAIL',
        message: 'Missing foreign key relationships',
        details: { missingFKs },
        recommendations: [
          'Add missing foreign key constraints to Prisma schema',
          'Run prisma migrate to create constraints',
        ],
      });
    }

    // 3. Check indexes
    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'proposals'
    `;

    const expectedIndexes = [
      'proposals_pkey',
      'idx_proposals_status_due_date',
      'idx_proposals_customer_status',
      'idx_proposals_created_by',
      'idx_proposals_cloud_id',
    ];

    const actualIndexes = (indexes as any[]).map(idx => idx.indexname);
    const missingIndexes = expectedIndexes.filter(idx => !actualIndexes.includes(idx));

    if (missingIndexes.length === 0) {
      results.push({
        test: 'Database Indexes',
        status: 'PASS',
        message: 'All expected indexes present',
        details: { indexCount: actualIndexes.length },
      });
    } else {
      results.push({
        test: 'Database Indexes',
        status: 'WARNING',
        message: 'Some expected indexes missing',
        details: { missingIndexes },
        recommendations: [
          'Add missing indexes for performance optimization',
          'Consider adding indexes for frequently queried columns',
        ],
      });
    }
  } catch (error) {
    results.push({
      test: 'Database Schema Verification',
      status: 'FAIL',
      message: 'Database connection or query failed',
      details: { error: error instanceof Error ? error.message : String(error) },
    });
  }

  return results;
}

// ====================
// Data Sample Verification
// ====================

async function verifyDataSamples(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  try {
    logInfo('Starting data sample verification', { component: 'DataVerification' });

    // 1. Check if proposals exist
    const proposalCount = await prisma.proposal.count();

    if (proposalCount === 0) {
      results.push({
        test: 'Proposal Data Existence',
        status: 'WARNING',
        message: 'No proposals found in database',
        recommendations: ['Create sample proposals for testing', 'Run database seed script'],
      });
    } else {
      results.push({
        test: 'Proposal Data Existence',
        status: 'PASS',
        message: `Found ${proposalCount} proposals in database`,
        details: { count: proposalCount },
      });
    }

    // 2. Check sample proposal structure
    const sampleProposal = await prisma.proposal.findFirst({
      include: {
        customer: true,
        creator: true,
        products: {
          include: {
            product: true,
          },
        },
        sections: true,
      },
    });

    if (sampleProposal) {
      // Verify required fields
      const requiredFields = ['id', 'title', 'customerId', 'status', 'createdAt'];
      const missingFields = requiredFields.filter(field => !(field in sampleProposal));

      if (missingFields.length === 0) {
        results.push({
          test: 'Sample Proposal Structure',
          status: 'PASS',
          message: 'Sample proposal has all required fields',
          details: {
            id: sampleProposal.id,
            title: sampleProposal.title,
            status: sampleProposal.status,
            hasCustomer: !!sampleProposal.customer,
            hasCreator: !!sampleProposal.creator,
            productCount: sampleProposal.products.length,
            sectionCount: sampleProposal.sections.length,
          },
        });
      } else {
        results.push({
          test: 'Sample Proposal Structure',
          status: 'FAIL',
          message: 'Sample proposal missing required fields',
          details: { missingFields },
        });
      }

      // 3. Check name resolution
      const nameResolutionIssues: string[] = [];

      if (sampleProposal.customer && !sampleProposal.customer.name) {
        nameResolutionIssues.push('Customer has no name');
      }

      if (sampleProposal.creator && !sampleProposal.creator.name) {
        nameResolutionIssues.push('Creator has no name');
      }

      sampleProposal.products.forEach((pp, index) => {
        if (pp.product && !pp.product.name) {
          nameResolutionIssues.push(`Product ${index + 1} has no name`);
        }
      });

      if (nameResolutionIssues.length === 0) {
        results.push({
          test: 'Name Resolution',
          status: 'PASS',
          message: 'All entities have readable names',
          details: {
            customerName: sampleProposal.customer?.name,
            creatorName: sampleProposal.creator?.name,
            productNames: sampleProposal.products.map(pp => pp.product?.name),
          },
        });
      } else {
        results.push({
          test: 'Name Resolution',
          status: 'FAIL',
          message: 'Some entities missing readable names',
          details: { issues: nameResolutionIssues },
        });
      }
    } else {
      results.push({
        test: 'Sample Proposal Analysis',
        status: 'WARNING',
        message: 'No sample proposal available for detailed analysis',
      });
    }
  } catch (error) {
    results.push({
      test: 'Data Sample Verification',
      status: 'FAIL',
      message: 'Failed to analyze data samples',
      details: { error: error instanceof Error ? error.message : String(error) },
    });
  }

  return results;
}

// ====================
// Validation Schema Verification
// ====================

function verifyValidationSchemas(): VerificationResult[] {
  const results: VerificationResult[] = [];

  try {
    logInfo('Starting validation schema verification', { component: 'DataVerification' });

    // 1. Check Zod schema definitions
    const schemas = [
      { name: 'ProposalCreateSchema', schema: ProposalCreateSchema },
      { name: 'ProposalQuerySchema', schema: ProposalQuerySchema },
      { name: 'ProposalSchema', schema: ProposalSchema },
    ];

    schemas.forEach(({ name, schema }) => {
      try {
        // Test schema parsing with appropriate test data for each schema
        let testData: any;

        if (name === 'ProposalCreateSchema') {
          testData = {
            basicInfo: {
              title: 'Test Proposal',
              customerId: 'test-customer-id',
              priority: 'MEDIUM',
              value: 1000,
              currency: 'USD',
            },
            teamData: {
              teamLead: 'test-lead-id',
              salesRepresentative: 'test-sales-id',
              subjectMatterExperts: {},
              executiveReviewers: [],
            },
            contentData: {
              selectedContent: [],
              customContent: [],
              contentLibrary: [],
            },
            productData: {
              products: [],
              totalValue: 0,
            },
            sectionData: {
              sections: [],
              sectionTemplates: [],
            },
          };
        } else if (name === 'ProposalQuerySchema') {
          testData = {
            search: '',
            limit: 20,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          };
        } else if (name === 'ProposalSchema') {
          testData = {
            id: 'test-id',
            title: 'Test Proposal',
            description: 'Test description',
            customerId: 'test-customer-id',
            customer: {
              id: 'test-customer-id',
              name: 'Test Customer',
              email: 'test@example.com',
              industry: 'Technology',
            },
            status: 'DRAFT',
            priority: 'MEDIUM',
            dueDate: new Date('2025-12-31'),
            value: 1000,
            currency: 'USD',
            projectType: 'Software Development',
            tags: ['test', 'proposal'],
            metadata: { test: true },
            assignedTo: 'test-user-id',
            teamMembers: ['user1', 'user2'],
            progress: 25,
            stage: 'draft',
            riskLevel: 'low',
            sections: [
              {
                id: 'section1',
                title: 'Test Section',
                content: 'Test content',
                type: 'TEXT',
                order: 1,
                isRequired: true,
                assignedTo: 'user1',
                estimatedHours: 8,
                dueDate: new Date('2025-12-30'),
              },
            ],
            products: [
              {
                id: 'product1',
                productId: 'prod-1',
                name: 'Test Product',
                quantity: 1,
                unitPrice: 1000,
                discount: 0,
                total: 1000,
                category: 'Software',
                configuration: { test: true },
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1,
            userStoryMappings: ['US-3.1', 'US-3.2'],
          };
        }

        const parsed = schema.parse(testData);

        results.push({
          test: `${name} Validation`,
          status: 'PASS',
          message: `${name} successfully validates test data`,
          details: { parsedKeys: Object.keys(parsed) },
        });
      } catch (error) {
        results.push({
          test: `${name} Validation`,
          status: 'FAIL',
          message: `${name} validation failed`,
          details: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    });

    // 2. Check schema field alignment
    const createSchemaFields = Object.keys(ProposalCreateSchema.shape);
    const expectedCreateFields = [
      'basicInfo',
      'teamData',
      'contentData',
      'productData',
      'sectionData',
    ];

    const missingCreateFields = expectedCreateFields.filter(
      field => !createSchemaFields.includes(field)
    );
    const extraCreateFields = createSchemaFields.filter(
      field => !expectedCreateFields.includes(field)
    );

    if (missingCreateFields.length === 0 && extraCreateFields.length === 0) {
      results.push({
        test: 'Create Schema Field Alignment',
        status: 'PASS',
        message: 'ProposalCreateSchema has all expected fields',
        details: { fieldCount: createSchemaFields.length },
      });
    } else {
      results.push({
        test: 'Create Schema Field Alignment',
        status: 'FAIL',
        message: 'ProposalCreateSchema field mismatch',
        details: { missingFields: missingCreateFields, extraFields: extraCreateFields },
      });
    }
  } catch (error) {
    results.push({
      test: 'Validation Schema Verification',
      status: 'FAIL',
      message: 'Validation schema verification failed',
      details: { error: error instanceof Error ? error.message : String(error) },
    });
  }

  return results;
}

// ====================
// API Route Verification
// ====================

async function verifyAPIRoutes(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  try {
    logInfo('Starting API route verification', { component: 'DataVerification' });

    // Note: This would require a running server to test actual API endpoints
    // For now, we'll verify the route files exist and have proper structure

    const fs = require('fs');
    const path = require('path');

    const apiRoutes = [
      'src/app/api/proposals/route.ts',
      'src/app/api/proposals/[id]/route.ts',
      'src/app/api/proposals/stats/route.ts',
    ];

    apiRoutes.forEach(routePath => {
      const fullPath = path.join(process.cwd(), routePath);

      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');

        // Check for required exports
        const hasGET = content.includes('export const GET');
        const hasPOST = content.includes('export const POST');
        const hasPUT = content.includes('export const PUT');
        const hasDELETE = content.includes('export const DELETE');

        const requiredExports: string[] = [];
        if (routePath.includes('[id]')) {
          requiredExports.push('GET', 'PUT', 'DELETE');
        } else if (routePath.includes('stats')) {
          requiredExports.push('GET');
        } else {
          requiredExports.push('GET', 'POST');
        }

        const missingExports = requiredExports.filter(exp => {
          switch (exp) {
            case 'GET':
              return !hasGET;
            case 'POST':
              return !hasPOST;
            case 'PUT':
              return !hasPUT;
            case 'DELETE':
              return !hasDELETE;
            default:
              return false;
          }
        });

        if (missingExports.length === 0) {
          results.push({
            test: `API Route: ${routePath}`,
            status: 'PASS',
            message: `All required exports present in ${routePath}`,
            details: { exports: requiredExports },
          });
        } else {
          results.push({
            test: `API Route: ${routePath}`,
            status: 'FAIL',
            message: `Missing required exports in ${routePath}`,
            details: { missingExports },
          });
        }

        // Check for validation schemas
        const hasValidation = content.includes('z.object') || content.includes('zod');

        if (hasValidation) {
          results.push({
            test: `API Validation: ${routePath}`,
            status: 'PASS',
            message: `Validation schemas present in ${routePath}`,
          });
        } else {
          results.push({
            test: `API Validation: ${routePath}`,
            status: 'WARNING',
            message: `No validation schemas found in ${routePath}`,
            recommendations: ['Add Zod validation schemas for request validation'],
          });
        }
      } else {
        results.push({
          test: `API Route: ${routePath}`,
          status: 'FAIL',
          message: `API route file not found: ${routePath}`,
        });
      }
    });
  } catch (error) {
    results.push({
      test: 'API Route Verification',
      status: 'FAIL',
      message: 'API route verification failed',
      details: { error: error instanceof Error ? error.message : String(error) },
    });
  }

  return results;
}

// ====================
// Frontend Component Verification
// ====================

function verifyFrontendComponents(): VerificationResult[] {
  const results: VerificationResult[] = [];

  try {
    logInfo('Starting frontend component verification', { component: 'DataVerification' });

    const fs = require('fs');
    const path = require('path');

    const componentFiles = [
      'src/components/proposals/ProposalDetailView.tsx',
      'src/components/proposals/ProposalList.tsx',
      'src/hooks/useProposal.ts',
      'src/hooks/useUnifiedProposalData.ts',
      'src/services/proposalService.ts',
    ];

    componentFiles.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);

      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');

        // Check for proper imports
        const hasReactQuery = content.includes('@tanstack/react-query');
        const hasZod = content.includes('zod') || content.includes('z.');
        const hasLogger = content.includes('@/lib/logger');
        const hasErrorHandling =
          content.includes('ErrorHandlingService') || content.includes('ErrorCodes');

        const requiredImports: string[] = [];
        if (filePath.includes('hook') || filePath.includes('service')) {
          requiredImports.push('React Query', 'Logger', 'Error Handling');
        }
        if (filePath.includes('service')) {
          requiredImports.push('Zod');
        }

        const missingImports: string[] = [];
        if (requiredImports.includes('React Query') && !hasReactQuery)
          missingImports.push('React Query');
        if (requiredImports.includes('Zod') && !hasZod) missingImports.push('Zod');
        if (requiredImports.includes('Logger') && !hasLogger) missingImports.push('Logger');
        if (requiredImports.includes('Error Handling') && !hasErrorHandling)
          missingImports.push('Error Handling');

        if (missingImports.length === 0) {
          results.push({
            test: `Frontend Component: ${filePath}`,
            status: 'PASS',
            message: `All required imports present in ${filePath}`,
            details: { imports: requiredImports },
          });
        } else {
          results.push({
            test: `Frontend Component: ${filePath}`,
            status: 'WARNING',
            message: `Missing imports in ${filePath}`,
            details: { missingImports },
            recommendations: ['Add missing imports for proper functionality'],
          });
        }

        // Check for analytics integration
        const hasAnalytics =
          content.includes('analytics') ||
          content.includes('track') ||
          content.includes('useOptimizedAnalytics');

        if (hasAnalytics) {
          results.push({
            test: `Analytics Integration: ${filePath}`,
            status: 'PASS',
            message: `Analytics integration present in ${filePath}`,
          });
        } else {
          results.push({
            test: `Analytics Integration: ${filePath}`,
            status: 'WARNING',
            message: `No analytics integration found in ${filePath}`,
            recommendations: ['Add analytics tracking for user interactions'],
          });
        }
      } else {
        results.push({
          test: `Frontend Component: ${filePath}`,
          status: 'FAIL',
          message: `Component file not found: ${filePath}`,
        });
      }
    });
  } catch (error) {
    results.push({
      test: 'Frontend Component Verification',
      status: 'FAIL',
      message: 'Frontend component verification failed',
      details: { error: error instanceof Error ? error.message : String(error) },
    });
  }

  return results;
}

// ====================
// Main Verification Function
// ====================

async function runComprehensiveVerification(): Promise<DataFlowVerification> {
  logInfo('Starting comprehensive proposal data integration verification', {
    component: 'DataVerification',
    timestamp: new Date().toISOString(),
  });

  const results: DataFlowVerification = {
    database: [],
    api: [],
    frontend: [],
    validation: [],
    analytics: [],
    naming: [],
  };

  try {
    // Run all verification functions
    results.database = [...(await verifyDatabaseSchema()), ...(await verifyDataSamples())];

    results.validation = verifyValidationSchemas();
    results.api = await verifyAPIRoutes();
    results.frontend = verifyFrontendComponents();

    // Cross-reference naming consistency
    const namingResults = await verifyNamingConsistency();
    results.naming = namingResults;

    // Analytics verification
    const analyticsResults = verifyAnalyticsIntegration();
    results.analytics = analyticsResults;
  } catch (error) {
    logError('Comprehensive verification failed', {
      component: 'DataVerification',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return results;
}

// ====================
// Naming Consistency Verification
// ====================

async function verifyNamingConsistency(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  try {
    // Check if IDs are being resolved to names in components
    const fs = require('fs');
    const path = require('path');

    const detailViewPath = path.join(
      process.cwd(),
      'src/components/proposals/ProposalDetailView.tsx'
    );

    if (fs.existsSync(detailViewPath)) {
      const content = fs.readFileSync(detailViewPath, 'utf8');

      // Check for name resolution patterns
      const hasNameResolution =
        content.includes('resolveProductName') ||
        content.includes('customer?.name') ||
        content.includes('creator?.name');

      if (hasNameResolution) {
        results.push({
          test: 'Name Resolution in Detail View',
          status: 'PASS',
          message: 'Name resolution patterns found in ProposalDetailView',
          details: { patterns: ['resolveProductName', 'customer?.name', 'creator?.name'] },
        });
      } else {
        results.push({
          test: 'Name Resolution in Detail View',
          status: 'FAIL',
          message: 'No name resolution patterns found',
          recommendations: [
            'Implement name resolution for product IDs',
            'Ensure customer and creator names are displayed',
            'Add fallback display names for missing data',
          ],
        });
      }
    }

    // Check database for entities without names
    const customersWithoutNames = await prisma.customer.count({
      where: {
        OR: [{ name: { equals: null } }, { name: { equals: '' } }],
      },
    });

    if (customersWithoutNames === 0) {
      results.push({
        test: 'Customer Name Completeness',
        status: 'PASS',
        message: 'All customers have names',
      });
    } else {
      results.push({
        test: 'Customer Name Completeness',
        status: 'WARNING',
        message: `${customersWithoutNames} customers missing names`,
        recommendations: ['Update customer records with proper names'],
      });
    }

    const productsWithoutNames = await prisma.product.count({
      where: {
        OR: [{ name: { equals: null } }, { name: { equals: '' } }],
      },
    });

    if (productsWithoutNames === 0) {
      results.push({
        test: 'Product Name Completeness',
        status: 'PASS',
        message: 'All products have names',
      });
    } else {
      results.push({
        test: 'Product Name Completeness',
        status: 'WARNING',
        message: `${productsWithoutNames} products missing names`,
        recommendations: ['Update product records with proper names'],
      });
    }
  } catch (error) {
    results.push({
      test: 'Naming Consistency Verification',
      status: 'FAIL',
      message: 'Naming consistency verification failed',
      details: { error: error instanceof Error ? error.message : String(error) },
    });
  }

  return results;
}

// ====================
// Analytics Integration Verification
// ====================

function verifyAnalyticsIntegration(): VerificationResult[] {
  const results: VerificationResult[] = [];

  try {
    const fs = require('fs');
    const path = require('path');

    const componentFiles = [
      'src/components/proposals/ProposalDetailView.tsx',
      'src/components/proposals/ProposalList.tsx',
    ];

    componentFiles.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);

      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');

        // Check for analytics patterns
        const hasAnalyticsHook =
          content.includes('useOptimizedAnalytics') || content.includes('useAnalytics');
        const hasTrackingCalls = content.includes('analytics(') || content.includes('track(');
        const hasUserStory = content.includes('userStory') || content.includes('US-');
        const hasHypothesis = content.includes('hypothesis') || content.includes('H');

        const analyticsPatterns = [];
        if (hasAnalyticsHook) analyticsPatterns.push('Analytics Hook');
        if (hasTrackingCalls) analyticsPatterns.push('Tracking Calls');
        if (hasUserStory) analyticsPatterns.push('User Story Tracking');
        if (hasHypothesis) analyticsPatterns.push('Hypothesis Tracking');

        if (analyticsPatterns.length >= 3) {
          results.push({
            test: `Analytics Integration: ${filePath}`,
            status: 'PASS',
            message: `Comprehensive analytics integration in ${filePath}`,
            details: { patterns: analyticsPatterns },
          });
        } else if (analyticsPatterns.length > 0) {
          results.push({
            test: `Analytics Integration: ${filePath}`,
            status: 'WARNING',
            message: `Partial analytics integration in ${filePath}`,
            details: { patterns: analyticsPatterns },
            recommendations: ['Add missing analytics patterns for complete tracking'],
          });
        } else {
          results.push({
            test: `Analytics Integration: ${filePath}`,
            status: 'FAIL',
            message: `No analytics integration in ${filePath}`,
            recommendations: [
              'Add useOptimizedAnalytics hook',
              'Implement tracking calls for user interactions',
              'Add user story and hypothesis tracking',
            ],
          });
        }
      }
    });
  } catch (error) {
    results.push({
      test: 'Analytics Integration Verification',
      status: 'FAIL',
      message: 'Analytics integration verification failed',
      details: { error: error instanceof Error ? error.message : String(error) },
    });
  }

  return results;
}

// ====================
// Report Generation
// ====================

function generateReport(results: DataFlowVerification): void {
  console.log('\n' + '='.repeat(80));
  console.log('PROPOSAL DATA INTEGRATION VERIFICATION REPORT');
  console.log('='.repeat(80));
  console.log(`Generated: ${new Date().toISOString()}\n`);

  const categories = Object.keys(results) as (keyof DataFlowVerification)[];

  categories.forEach(category => {
    const categoryResults = results[category];

    console.log(`\n${category.toUpperCase()} VERIFICATION`);
    console.log('-'.repeat(50));

    if (categoryResults.length === 0) {
      console.log('No tests run for this category');
      return;
    }

    const passCount = categoryResults.filter(r => r.status === 'PASS').length;
    const failCount = categoryResults.filter(r => r.status === 'FAIL').length;
    const warningCount = categoryResults.filter(r => r.status === 'WARNING').length;

    console.log(`Results: ${passCount} PASS, ${warningCount} WARNING, ${failCount} FAIL\n`);

    categoryResults.forEach(result => {
      const statusIcon =
        result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${statusIcon} ${result.test}`);
      console.log(`   ${result.message}`);

      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }

      if (result.recommendations && result.recommendations.length > 0) {
        console.log('   Recommendations:');
        result.recommendations.forEach(rec => console.log(`   - ${rec}`));
      }

      console.log('');
    });
  });

  // Summary
  const allResults = Object.values(results).flat();
  const totalPass = allResults.filter(r => r.status === 'PASS').length;
  const totalWarning = allResults.filter(r => r.status === 'WARNING').length;
  const totalFail = allResults.filter(r => r.status === 'FAIL').length;
  const totalTests = allResults.length;

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ PASS: ${totalPass} (${((totalPass / totalTests) * 100).toFixed(1)}%)`);
  console.log(`⚠️  WARNING: ${totalWarning} (${((totalWarning / totalTests) * 100).toFixed(1)}%)`);
  console.log(`❌ FAIL: ${totalFail} (${((totalFail / totalTests) * 100).toFixed(1)}%)`);

  if (totalFail === 0) {
    console.log('\n🎉 All critical tests passed! Data integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the recommendations above.');
  }

  console.log('\n' + '='.repeat(80));
}

// ====================
// Main Execution
// ====================

async function main() {
  try {
    logInfo('Starting proposal data integration verification', { component: 'Main' });

    const results = await runComprehensiveVerification();
    generateReport(results);

    // Exit with appropriate code
    const allResults = Object.values(results).flat();
    const hasFailures = allResults.some(r => r.status === 'FAIL');

    process.exit(hasFailures ? 1 : 0);
  } catch (error) {
    logError('Verification script failed', {
      component: 'Main',
      error: error instanceof Error ? error.message : String(error),
    });

    console.error('❌ Verification script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export {
  generateReport,
  runComprehensiveVerification,
  verifyAnalyticsIntegration,
  verifyAPIRoutes,
  verifyDatabaseSchema,
  verifyDataSamples,
  verifyFrontendComponents,
  verifyNamingConsistency,
  verifyValidationSchemas,
};
