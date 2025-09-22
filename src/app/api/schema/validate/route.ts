import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * Zod Schema Validation API Endpoint
 * Validates live data against Zod schemas
 *
 * Component Traceability Matrix:
 * - User Stories: US-9.3 (Zod Schema Validation)
 * - Acceptance Criteria: AC-9.3.1 (Schema Compliance)
 * - Hypotheses: H14 (Data Type Safety)
 */

interface ZodValidationResult {
  isValid: boolean;
  validationResults: Array<{
    entity: string;
    recordId: string;
    isValid: boolean;
    errors: Array<{
      field: string;
      code: string;
      message: string;
      expected: string;
      received: string;
    }>;
    warnings: Array<{
      field: string;
      message: string;
      suggestion: string;
    }>;
  }>;
  summary: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    totalErrors: number;
    totalWarnings: number;
    entitiesChecked: string[];
    executionTime: number;
  };
  recommendations: Array<{
    type: 'schema_update' | 'data_fix' | 'migration_needed';
    entity: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    affectedRecords: number;
  }>;
  metadata: {
    timestamp: Date;
    validatedBy: string;
    zodVersion: string;
    userStory: string;
    hypothesis: string;
  };
}

// Zod schemas for validation (simplified versions of actual schemas)
const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED']),
  department: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const CustomerSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1),
  email: z.string().email(),
  tier: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  phone: z.string().optional(),
  address: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const ProductSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  isActive: z.boolean().default(true),
  category: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const ProposalSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']),
  customerId: z.string().cuid(),
  createdBy: z.string().cuid(),
  value: z.number().min(0).optional(),
  validUntil: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const ProposalProductSchema = z.object({
  id: z.string().cuid(),
  proposalId: z.string().cuid(),
  productId: z.string().cuid(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
  sectionId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GET = createRoute(
  {
    roles: ['admin', 'System Administrator'],
  },
  async ({ user, req }) => {
    const errorHandlingService = ErrorHandlingService.getInstance();
    const startTime = Date.now();

    try {
      logDebug('Zod Schema Validation: Starting validation', {
        component: 'ZodValidationAPI',
        operation: 'GET',
        userId: user.id,
        userStory: 'US-9.3',
        hypothesis: 'H14',
      });

      const validationResults: ZodValidationResult['validationResults'] = [];
      const recommendations: ZodValidationResult['recommendations'] = [];
      let totalRecords = 0;
      let validRecords = 0;
      let totalErrors = 0;
      let totalWarnings = 0;

      // Validate Users
      const userResults = await validateEntity('users', UserSchema, async () => {
        return await prisma.user.findMany({
          take: 100, // Limit for performance
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            department: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      });
      validationResults.push(...userResults.results);
      totalRecords += userResults.totalRecords;
      validRecords += userResults.validRecords;
      totalErrors += userResults.totalErrors;
      totalWarnings += userResults.totalWarnings;
      recommendations.push(...userResults.recommendations);

      // Validate Customers
      const customerResults = await validateEntity('customers', CustomerSchema, async () => {
        return await prisma.customer.findMany({
          take: 100, // Limit for performance
          select: {
            id: true,
            name: true,
            email: true,
            tier: true,
            status: true,
            phone: true,
            address: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      });
      validationResults.push(...customerResults.results);
      totalRecords += customerResults.totalRecords;
      validRecords += customerResults.validRecords;
      totalErrors += customerResults.totalErrors;
      totalWarnings += customerResults.totalWarnings;
      recommendations.push(...customerResults.recommendations);

      // Validate Products
      const productResults = await validateEntity('products', ProductSchema, async () => {
        return await prisma.product.findMany({
          take: 100, // Limit for performance
          select: {
            id: true,
            name: true,
            sku: true,
            description: true,
            price: true,
            isActive: true,
            category: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      });
      validationResults.push(...productResults.results);
      totalRecords += productResults.totalRecords;
      validRecords += productResults.validRecords;
      totalErrors += productResults.totalErrors;
      totalWarnings += productResults.totalWarnings;
      recommendations.push(...productResults.recommendations);

      // Validate Proposals
      const proposalResults = await validateEntity('proposals', ProposalSchema, async () => {
        return await prisma.proposal.findMany({
          take: 100, // Limit for performance
          select: {
            id: true,
            title: true,
            status: true,
            customerId: true,
            createdBy: true,
            value: true,
            validUntil: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      });
      validationResults.push(...proposalResults.results);
      totalRecords += proposalResults.totalRecords;
      validRecords += proposalResults.validRecords;
      totalErrors += proposalResults.totalErrors;
      totalWarnings += proposalResults.totalWarnings;
      recommendations.push(...proposalResults.recommendations);

      // Validate Proposal Products
      const proposalProductResults = await validateEntity(
        'proposal_products',
        ProposalProductSchema,
        async () => {
          return await prisma.proposalProduct.findMany({
            take: 100, // Limit for performance
            select: {
              id: true,
              proposalId: true,
              productId: true,
              quantity: true,
              unitPrice: true,
              total: true,
              sectionId: true,
              createdAt: true,
              updatedAt: true,
            },
          });
        }
      );
      validationResults.push(...proposalProductResults.results);
      totalRecords += proposalProductResults.totalRecords;
      validRecords += proposalProductResults.validRecords;
      totalErrors += proposalProductResults.totalErrors;
      totalWarnings += proposalProductResults.totalWarnings;
      recommendations.push(...proposalProductResults.recommendations);

      const executionTime = Date.now() - startTime;
      const invalidRecords = totalRecords - validRecords;
      const isValid = totalErrors === 0;

      const result: ZodValidationResult = {
        isValid,
        validationResults,
        summary: {
          totalRecords,
          validRecords,
          invalidRecords,
          totalErrors,
          totalWarnings,
          entitiesChecked: ['users', 'customers', 'products', 'proposals', 'proposal_products'],
          executionTime,
        },
        recommendations,
        metadata: {
          timestamp: new Date(),
          validatedBy: user.id,
          zodVersion: '3.22.0', // Would get from package.json
          userStory: 'US-9.3',
          hypothesis: 'H14',
        },
      };

      logInfo('Zod Schema Validation: Validation completed', {
        component: 'ZodValidationAPI',
        operation: 'GET',
        isValid,
        totalRecords,
        validRecords,
        totalErrors,
        executionTime,
        userStory: 'US-9.3',
        hypothesis: 'H14',
      });

      return ok(result);
    } catch (err) {
      logError('Zod Schema Validation: Validation failed', {
        component: 'ZodValidationAPI',
        operation: 'GET',
        error: err,
        userStory: 'US-9.3',
        hypothesis: 'H14',
      });

      const processedError = errorHandlingService.processError(
        err,
        'Zod schema validation failed',
        ErrorCodes.SYSTEM.UNKNOWN,
        {
          context: 'Zod schema validation',
          component: 'ZodValidationAPI',
          operation: 'GET',
          userStory: 'US-9.3',
          hypothesis: 'H14',
        }
      );

      throw processedError;
    }
  }
);

/**
 * Helper function to validate a specific entity against its Zod schema
 */
async function validateEntity<T>(
  entityName: string,
  schema: z.ZodSchema<T>,
  dataFetcher: () => Promise<any[]>
): Promise<{
  results: ZodValidationResult['validationResults'];
  recommendations: ZodValidationResult['recommendations'];
  totalRecords: number;
  validRecords: number;
  totalErrors: number;
  totalWarnings: number;
}> {
  const results: ZodValidationResult['validationResults'] = [];
  const recommendations: ZodValidationResult['recommendations'] = [];
  let totalRecords = 0;
  let validRecords = 0;
  let totalErrors = 0;
  const totalWarnings = 0;

  try {
    const records = await dataFetcher();
    totalRecords = records.length;

    for (const record of records) {
      const validation = schema.safeParse(record);

      if (validation.success) {
        validRecords++;
        results.push({
          entity: entityName,
          recordId: record.id,
          isValid: true,
          errors: [],
          warnings: [],
        });
      } else {
        const errors = validation.error.errors.map(err => ({
          field: err.path.join('.'),
          code: err.code,
          message: err.message,
          expected: getExpectedType(err),
          received: getReceivedValue(err),
        }));

        totalErrors += errors.length;

        results.push({
          entity: entityName,
          recordId: record.id,
          isValid: false,
          errors,
          warnings: [],
        });
      }
    }

    // Generate recommendations based on validation results
    const errorCount = results.filter(r => !r.isValid).length;
    if (errorCount > 0) {
      recommendations.push({
        type: 'data_fix',
        entity: entityName,
        priority: errorCount > totalRecords * 0.1 ? 'high' : 'medium',
        description: `${errorCount} records in ${entityName} failed Zod validation`,
        affectedRecords: errorCount,
      });
    }

    // Check for common issues and suggest schema updates
    const commonErrors = getCommonErrors(results);
    if (commonErrors.length > 0) {
      recommendations.push({
        type: 'schema_update',
        entity: entityName,
        priority: 'medium',
        description: `Consider updating Zod schema for ${entityName} to handle common patterns`,
        affectedRecords: commonErrors.length,
      });
    }
  } catch (err) {
    logError(`Failed to validate entity ${entityName}`, {
      error: err,
      entity: entityName,
    });

    recommendations.push({
      type: 'migration_needed',
      entity: entityName,
      priority: 'high',
      description: `Failed to validate ${entityName}: ${err instanceof Error ? err.message : 'Unknown error'}`,
      affectedRecords: 0,
    });
  }

  return {
    results,
    recommendations,
    totalRecords,
    validRecords,
    totalErrors,
    totalWarnings,
  };
}

/**
 * Helper function to get expected type from Zod error
 */
function getExpectedType(error: z.ZodIssue): string {
  switch (error.code) {
    case 'invalid_type':
      return error.expected;
    case 'invalid_string':
      return 'string (valid format)';
    case 'too_small':
      return `minimum ${error.minimum}`;
    case 'too_big':
      return `maximum ${error.maximum}`;
    case 'invalid_enum_value':
      return `one of: ${error.options?.join(', ')}`;
    default:
      return 'valid value';
  }
}

/**
 * Helper function to get received value from Zod error
 */
function getReceivedValue(error: z.ZodIssue): string {
  if ('received' in error) {
    return String(error.received);
  }
  return 'unknown';
}

/**
 * Helper function to identify common validation errors
 */
function getCommonErrors(
  results: ZodValidationResult['validationResults']
): Array<{ field: string; count: number }> {
  const errorCounts: Record<string, number> = {};

  results.forEach(result => {
    result.errors.forEach(error => {
      const key = `${error.field}:${error.code}`;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
  });

  return Object.entries(errorCounts)
    .map(([key, count]) => ({
      field: key.split(':')[0],
      count,
    }))
    .filter(item => item.count > 1)
    .sort((a, b) => b.count - a.count);
}
