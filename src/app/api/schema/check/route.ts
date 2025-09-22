import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Schema Check API Endpoint
 * Validates Prisma schema consistency and database structure
 *
 * Component Traceability Matrix:
 * - User Stories: US-9.1 (Schema Validation)
 * - Acceptance Criteria: AC-9.1.1 (Schema Consistency)
 * - Hypotheses: H12 (Schema Validation Efficiency)
 */

interface SchemaCheckResult {
  isValid: boolean;
  errors: Array<{
    type: 'missing_table' | 'missing_field' | 'type_mismatch' | 'constraint_missing';
    table?: string;
    field?: string;
    expected?: string;
    actual?: string;
    message: string;
  }>;
  warnings: Array<{
    type: 'deprecated_field' | 'unused_index' | 'performance_concern';
    table?: string;
    field?: string;
    message: string;
  }>;
  summary: {
    totalTables: number;
    validatedTables: number;
    totalFields: number;
    validatedFields: number;
    totalIndexes: number;
    validatedIndexes: number;
    executionTime: number;
  };
  metadata: {
    timestamp: Date;
    prismaVersion: string;
    databaseType: string;
    userStory: string;
    hypothesis: string;
  };
}

export const GET = createRoute(
  {
    roles: ['admin', 'System Administrator'],
  },
  async ({ user, req }) => {
    const errorHandlingService = ErrorHandlingService.getInstance();
    const startTime = Date.now();

    try {
      logDebug('Schema Check: Starting validation', {
        component: 'SchemaCheckAPI',
        operation: 'GET',
        userId: user.id,
        userStory: 'US-9.1',
        hypothesis: 'H12',
      });

      // Get database info
      const databaseInfo = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;

      // Get all tables from database
      const tablesQuery = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;

      const dbTables = tablesQuery.map(t => t.table_name);

      // Expected tables from Prisma schema (based on existing models)
      const expectedTables = [
        'users',
        'tenants',
        'customers',
        'products',
        'proposals',
        'proposal_products',
        'proposal_sections',
        'approval_workflows',
        'approval_executions',
        'validation_rules',
        'validation_issues',
        'validation_executions',
        'communications',
        'notifications',
        'subscriptions',
        'plans',
        'entitlements',
      ];

      const errors: SchemaCheckResult['errors'] = [];
      const warnings: SchemaCheckResult['warnings'] = [];

      // Check for missing tables
      const missingTables = expectedTables.filter(table => !dbTables.includes(table));
      missingTables.forEach(table => {
        errors.push({
          type: 'missing_table',
          table,
          message: `Table '${table}' is missing from database but defined in Prisma schema`,
        });
      });

      // Check for extra tables (might be migration artifacts)
      const extraTables = dbTables.filter(table => !expectedTables.includes(table));
      extraTables.forEach(table => {
        warnings.push({
          type: 'unused_index',
          table,
          message: `Table '${table}' exists in database but not defined in Prisma schema`,
        });
      });

      // Validate key table structures for core models
      const coreTableValidations = await Promise.all([
        validateTableStructure('users', [
          'id',
          'email',
          'name',
          'role',
          'created_at',
          'updated_at',
        ]),
        validateTableStructure('customers', [
          'id',
          'name',
          'email',
          'type',
          'created_at',
          'updated_at',
        ]),
        validateTableStructure('products', [
          'id',
          'name',
          'sku',
          'price',
          'is_active',
          'created_at',
          'updated_at',
        ]),
        validateTableStructure('proposals', [
          'id',
          'title',
          'status',
          'customer_id',
          'created_by',
          'created_at',
          'updated_at',
        ]),
      ]);

      // Aggregate validation results
      coreTableValidations.forEach(result => {
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      });

      const executionTime = Date.now() - startTime;
      const isValid = errors.length === 0;

      const result: SchemaCheckResult = {
        isValid,
        errors,
        warnings,
        summary: {
          totalTables: dbTables.length,
          validatedTables: expectedTables.length,
          totalFields: 0, // Would need more detailed field counting
          validatedFields: 0,
          totalIndexes: 0, // Would need index counting
          validatedIndexes: 0,
          executionTime,
        },
        metadata: {
          timestamp: new Date(),
          prismaVersion: '5.0.0', // Would get from package.json
          databaseType: 'PostgreSQL',
          userStory: 'US-9.1',
          hypothesis: 'H12',
        },
      };

      logInfo('Schema Check: Validation completed', {
        component: 'SchemaCheckAPI',
        operation: 'GET',
        isValid,
        errorCount: errors.length,
        warningCount: warnings.length,
        executionTime,
        userStory: 'US-9.1',
        hypothesis: 'H12',
      });

      return ok(result);
    } catch (err) {
      logError('Schema Check: Validation failed', {
        component: 'SchemaCheckAPI',
        operation: 'GET',
        error: err,
        userStory: 'US-9.1',
        hypothesis: 'H12',
      });

      const processedError = errorHandlingService.processError(
        err,
        'Schema validation failed',
        ErrorCodes.SYSTEM.UNKNOWN,
        {
          context: 'Schema validation',
          component: 'SchemaCheckAPI',
          operation: 'GET',
          userStory: 'US-9.1',
          hypothesis: 'H12',
        }
      );

      throw processedError;
    }
  }
);

/**
 * Helper function to validate table structure
 */
async function validateTableStructure(
  tableName: string,
  expectedFields: string[]
): Promise<{ errors: SchemaCheckResult['errors']; warnings: SchemaCheckResult['warnings'] }> {
  const errors: SchemaCheckResult['errors'] = [];
  const warnings: SchemaCheckResult['warnings'] = [];

  try {
    // Get table columns
    const columnsQuery = await prisma.$queryRaw<
      Array<{ column_name: string; data_type: string; is_nullable: string }>
    >`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = ${tableName}
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;

    const actualFields = columnsQuery.map(c => c.column_name);

    // Check for missing fields
    const missingFields = expectedFields.filter(field => !actualFields.includes(field));
    missingFields.forEach(field => {
      errors.push({
        type: 'missing_field',
        table: tableName,
        field,
        message: `Field '${field}' is missing from table '${tableName}'`,
      });
    });

    // Check for unexpected fields (might be legacy or migration artifacts)
    const unexpectedFields = actualFields.filter(field => !expectedFields.includes(field));
    unexpectedFields.forEach(field => {
      warnings.push({
        type: 'deprecated_field',
        table: tableName,
        field,
        message: `Field '${field}' exists in table '${tableName}' but not expected`,
      });
    });
  } catch (err) {
    errors.push({
      type: 'missing_table',
      table: tableName,
      message: `Failed to validate table '${tableName}': ${err instanceof Error ? err.message : 'Unknown error'}`,
    });
  }

  return { errors, warnings };
}
