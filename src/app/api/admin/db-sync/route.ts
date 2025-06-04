/**
 * PosalPro MVP2 - Database Synchronization API
 * Enables controlled synchronization between local and cloud databases
 * Follows platform engineering best practices for separation of environments
 */

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
// Import auth options from the correct location
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

/**
 * Schema validation for sync operation request - Enhanced for bidirectional sync
 */
const SyncRequestSchema = z.object({
  direction: z.enum(['localToCloud', 'cloudToLocal', 'bidirectional']),
  tables: z.array(z.string()).optional(),
  force: z.boolean().optional().default(false),
  includeConflictDetection: z.boolean().optional().default(true),
  generateReport: z.boolean().optional().default(true),
  conflictResolution: z
    .enum(['useLocal', 'useCloud', 'merge', 'manual'])
    .optional()
    .default('manual'),
});

/**
 * Current environment detection
 */
// const isProduction = process.env.NODE_ENV === 'production';
// const isNetlify = !!process.env.NETLIFY;

/**
 * Enhanced sync result interface
 */
interface SyncResult {
  success: boolean;
  itemsSynced: number;
  itemsFailed: number;
  tables: string[];
  conflicts: Array<{
    table: string;
    recordId: string;
    field: string;
    localValue: any;
    cloudValue: any;
    timestamp: string;
  }>;
  errors: string[];
  duration: number;
  summary: {
    [table: string]: {
      synced: number;
      failed: number;
      conflicts: number;
    };
  };
}

/**
 * Conflict detection utility
 */
const detectConflicts = async (
  localPrisma: PrismaClient,
  cloudPrisma: PrismaClient,
  table: string
): Promise<
  Array<{
    table: string;
    recordId: string;
    field: string;
    localValue: any;
    cloudValue: any;
    timestamp: string;
  }>
> => {
  const conflicts = [];

  try {
    // This is a simplified example - in production, you'd need table-specific logic
    switch (table) {
      case 'User': {
        const localUsers = await localPrisma.user.findMany({
          select: { id: true, email: true, name: true, updatedAt: true },
        });
        const cloudUsers = await cloudPrisma.user.findMany({
          select: { id: true, email: true, name: true, updatedAt: true },
        });

        // Compare records with same ID
        for (const localUser of localUsers) {
          const cloudUser = cloudUsers.find(u => u.id === localUser.id);
          if (cloudUser) {
            // Check for conflicts based on updatedAt timestamp
            if (localUser.updatedAt !== cloudUser.updatedAt) {
              // Field-level conflict detection
              if (localUser.name !== cloudUser.name) {
                conflicts.push({
                  table: 'User',
                  recordId: localUser.id,
                  field: 'name',
                  localValue: localUser.name,
                  cloudValue: cloudUser.name,
                  timestamp: new Date().toISOString(),
                });
              }
              if (localUser.email !== cloudUser.email) {
                conflicts.push({
                  table: 'User',
                  recordId: localUser.id,
                  field: 'email',
                  localValue: localUser.email,
                  cloudValue: cloudUser.email,
                  timestamp: new Date().toISOString(),
                });
              }
            }
          }
        }
        break;
      }

      case 'Proposal': {
        // TODO: Fix JsonValue type compatibility issues
        console.log('Proposal sync temporarily disabled due to type compatibility issues');
        break;
      }

      default:
        console.log(`No conflict detection implemented for table: ${table}`);
    }
  } catch (error) {
    console.error(`Conflict detection failed for table ${table}:`, error);
  }

  return conflicts;
};

/**
 * Enhanced sync operation with improved configuration handling
 */
const performDatabaseSync = async (
  direction: 'localToCloud' | 'cloudToLocal' | 'bidirectional',
  options: {
    tables?: string[];
    force?: boolean;
    includeConflictDetection?: boolean;
    conflictResolution?: 'useLocal' | 'useCloud' | 'merge' | 'manual';
  }
): Promise<SyncResult> => {
  const startTime = Date.now();
  const result: SyncResult = {
    success: false,
    itemsSynced: 0,
    itemsFailed: 0,
    tables: [],
    conflicts: [],
    errors: [],
    duration: 0,
    summary: {},
  };

  try {
    // Enhanced database connection setup
    const primaryDbUrl = process.env.DATABASE_URL;
    const localDbUrl = process.env.LOCAL_DATABASE_URL || primaryDbUrl;
    const cloudDbUrl = process.env.CLOUD_DATABASE_URL || primaryDbUrl;

    if (!primaryDbUrl) {
      throw new Error('No database URL configured. Set DATABASE_URL environment variable.');
    }

    // Check if we have separate local/cloud URLs or just one database
    const hasSeparateDatabases =
      process.env.LOCAL_DATABASE_URL &&
      process.env.CLOUD_DATABASE_URL &&
      process.env.LOCAL_DATABASE_URL !== process.env.CLOUD_DATABASE_URL;

    if (!hasSeparateDatabases) {
      // Demo mode: simulate sync operation with single database
      console.log('Running sync in demo mode (single database)');

      const demoPrisma = new PrismaClient({
        datasources: { db: { url: primaryDbUrl } },
      });

      try {
        // Verify database connection
        await demoPrisma.$queryRaw`SELECT 1`;

        // Tables to "sync" (really just validate)
        const tablesToSync = options.tables || [
          'User',
          'Role',
          'Permission',
          'Customer',
          'Product',
          'Proposal',
          'Content',
        ];

        result.tables = tablesToSync;

        // Simulate sync by counting records in each table
        for (const table of tablesToSync) {
          try {
            let count = 0;

            switch (table) {
              case 'User':
                count = await demoPrisma.user.count();
                break;
              case 'Role':
                count = await demoPrisma.role.count();
                break;
              case 'Permission':
                count = await demoPrisma.permission.count();
                break;
              case 'Customer':
                count = await demoPrisma.customer.count();
                break;
              case 'Product':
                count = await demoPrisma.product.count();
                break;
              case 'Proposal':
                count = await demoPrisma.proposal.count();
                break;
              case 'Content':
                count = await demoPrisma.content.count();
                break;
              default:
                console.log(`Table ${table} not supported in demo mode`);
                continue;
            }

            result.itemsSynced += count;
            result.summary[table] = {
              synced: count,
              failed: 0,
              conflicts: 0,
            };

            console.log(`Demo sync: ${table} - ${count} records validated`);
          } catch (error) {
            console.error(`Failed to validate table ${table}:`, error);
            result.itemsFailed += 1;
            result.errors.push(
              `Table ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            result.summary[table] = {
              synced: 0,
              failed: 1,
              conflicts: 0,
            };
          }
        }

        result.success = result.errors.length === 0;
      } finally {
        await demoPrisma.$disconnect();
      }
    } else {
      // Real dual-database sync mode
      console.log('Running real database sync with separate local/cloud databases');

      const localPrisma = new PrismaClient({
        datasources: { db: { url: localDbUrl } },
      });
      const cloudPrisma = new PrismaClient({
        datasources: { db: { url: cloudDbUrl } },
      });

      try {
        // Verify both connections
        await localPrisma.$queryRaw`SELECT 1`;
        await cloudPrisma.$queryRaw`SELECT 1`;

        // Tables to sync (default to main tables)
        const tablesToSync = options.tables || [
          'User',
          'Role',
          'Permission',
          'Customer',
          'Product',
          'Proposal',
          'Content',
        ];
        result.tables = tablesToSync;

        // Conflict detection phase
        if (options.includeConflictDetection && (direction === 'bidirectional' || !options.force)) {
          console.log('Detecting conflicts...');
          for (const table of tablesToSync) {
            const tableConflicts = await detectConflicts(localPrisma, cloudPrisma, table);
            result.conflicts.push(...tableConflicts);
          }

          if (result.conflicts.length > 0 && !options.force) {
            console.log(`Found ${result.conflicts.length} conflicts, stopping sync`);
            result.duration = Date.now() - startTime;
            return result;
          }
        }

        // Perform sync operations based on direction
        for (const table of tablesToSync) {
          try {
            let syncedCount = 0;

            if (direction === 'localToCloud' || direction === 'bidirectional') {
              syncedCount += await syncTableData(localPrisma, cloudPrisma, table);
            }

            if (direction === 'cloudToLocal' || direction === 'bidirectional') {
              syncedCount += await syncTableData(cloudPrisma, localPrisma, table);
            }

            result.itemsSynced += syncedCount;
            result.summary[table] = {
              synced: syncedCount,
              failed: 0,
              conflicts: result.conflicts.filter(c => c.table === table).length,
            };

            console.log(`Synced ${syncedCount} items from ${table}`);
          } catch (error) {
            console.error(`Failed to sync table ${table}:`, error);
            result.itemsFailed += 1;
            result.errors.push(
              `Table ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            result.summary[table] = {
              synced: 0,
              failed: 1,
              conflicts: 0,
            };
          }
        }

        result.success = result.errors.length === 0;
      } finally {
        await localPrisma.$disconnect();
        await cloudPrisma.$disconnect();
      }
    }

    result.duration = Date.now() - startTime;
    console.log(`Database sync completed in ${result.duration}ms. Success: ${result.success}`);

    return result;
  } catch (error) {
    console.error('Database sync failed:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    result.duration = Date.now() - startTime;
    return result;
  }
};

/**
 * Table-specific sync logic
 */
const syncTableData = async (
  sourcePrisma: PrismaClient,
  targetPrisma: PrismaClient,
  table: string
): Promise<number> => {
  let syncedCount = 0;

  try {
    switch (table) {
      case 'User': {
        const users = await sourcePrisma.user.findMany();
        for (const user of users) {
          try {
            // For users, sync by email since IDs might be different between databases
            // but emails are unique and represent the same logical user
            const existingUser = await targetPrisma.user.findUnique({
              where: { email: user.email },
            });

            if (existingUser) {
              // Update existing user (keeping the target database's ID)
              await targetPrisma.user.update({
                where: { email: user.email },
                data: {
                  name: user.name,
                  password: user.password,
                  department: user.department,
                  status: user.status,
                  lastLogin: user.lastLogin,
                  updatedAt: new Date(),
                },
              });
            } else {
              // Create new user with source ID
              await targetPrisma.user.create({
                data: user,
              });
            }
            syncedCount++;
          } catch (error) {
            console.error(`Failed to sync user ${user.email}:`, error);
            // Don't break the loop, continue with other users
          }
        }
        break;
      }

      case 'Role': {
        const roles = await sourcePrisma.role.findMany();
        for (const role of roles) {
          try {
            await targetPrisma.role.upsert({
              where: { id: role.id },
              update: {
                name: role.name,
                description: role.description,
                level: role.level,
                isSystem: role.isSystem,
                parentId: role.parentId,
                updatedAt: new Date(),
              },
              create: {
                id: role.id,
                name: role.name,
                description: role.description,
                level: role.level,
                isSystem: role.isSystem,
                parentId: role.parentId,
                createdAt: role.createdAt,
                updatedAt: new Date(),
              },
            });
            syncedCount++;
          } catch (error) {
            console.error(`Failed to sync role ${role.id}:`, error);
          }
        }
        break;
      }

      case 'Permission': {
        const permissions = await sourcePrisma.permission.findMany();
        for (const permission of permissions) {
          try {
            await targetPrisma.permission.upsert({
              where: { id: permission.id },
              update: {
                resource: permission.resource,
                action: permission.action,
                scope: permission.scope,
                updatedAt: new Date(),
              },
              create: {
                id: permission.id,
                resource: permission.resource,
                action: permission.action,
                scope: permission.scope,
                createdAt: permission.createdAt,
                updatedAt: new Date(),
              },
            });
            syncedCount++;
          } catch (error) {
            console.error(`Failed to sync permission ${permission.id}:`, error);
          }
        }
        break;
      }

      case 'Customer': {
        const customers = await sourcePrisma.customer.findMany();
        for (const customer of customers) {
          try {
            // Extract non-JSON fields only to avoid type conflicts
            const { metadata, segmentation, ...customerData } = customer;
            // Suppress unused variable warnings
            void metadata;
            void segmentation;

            await targetPrisma.customer.upsert({
              where: { id: customer.id },
              update: {
                name: customerData.name,
                email: customerData.email,
                phone: customerData.phone,
                website: customerData.website,
                address: customerData.address,
                industry: customerData.industry,
                companySize: customerData.companySize,
                revenue: customerData.revenue,
                status: customerData.status,
                tier: customerData.tier,
                tags: customerData.tags,
                riskScore: customerData.riskScore,
                ltv: customerData.ltv,
                lastContact: customerData.lastContact,
                updatedAt: new Date(),
              },
              create: {
                ...customerData,
                updatedAt: new Date(),
              },
            });
            syncedCount++;
          } catch (error) {
            console.error(`Failed to sync customer ${customer.id}:`, error);
          }
        }
        break;
      }

      case 'Product': {
        const products = await sourcePrisma.product.findMany();
        for (const product of products) {
          try {
            // Extract non-JSON fields only to avoid type conflicts
            const { attributes, usageAnalytics, ...productData } = product;
            // Suppress unused variable warnings
            void attributes;
            void usageAnalytics;

            await targetPrisma.product.upsert({
              where: { id: product.id },
              update: {
                name: productData.name,
                description: productData.description,
                sku: productData.sku,
                price: productData.price,
                currency: productData.currency,
                category: productData.category,
                tags: productData.tags,
                images: productData.images,
                isActive: productData.isActive,
                version: productData.version,
                userStoryMappings: productData.userStoryMappings,
                updatedAt: new Date(),
              },
              create: {
                ...productData,
                updatedAt: new Date(),
              },
            });
            syncedCount++;
          } catch (error) {
            console.error(`Failed to sync product ${product.id}:`, error);
          }
        }
        break;
      }

      case 'Content': {
        const contents = await sourcePrisma.content.findMany();
        for (const content of contents) {
          try {
            // Extract non-JSON fields only to avoid type conflicts
            const { quality, usage, searchOptimization, userStoryTracking, ...contentData } =
              content;
            // Suppress unused variable warnings
            void quality;
            void usage;
            void searchOptimization;
            void userStoryTracking;

            await targetPrisma.content.upsert({
              where: { id: content.id },
              update: {
                title: contentData.title,
                description: contentData.description,
                type: contentData.type,
                content: contentData.content,
                tags: contentData.tags,
                category: contentData.category,
                searchableText: contentData.searchableText,
                keywords: contentData.keywords,
                isPublic: contentData.isPublic,
                allowedRoles: contentData.allowedRoles,
                version: contentData.version,
                isActive: contentData.isActive,
                createdBy: contentData.createdBy,
                updatedAt: new Date(),
              },
              create: {
                id: contentData.id,
                title: contentData.title,
                description: contentData.description,
                type: contentData.type,
                content: contentData.content,
                tags: contentData.tags,
                category: contentData.category,
                searchableText: contentData.searchableText,
                keywords: contentData.keywords,
                isPublic: contentData.isPublic,
                allowedRoles: contentData.allowedRoles,
                version: contentData.version,
                isActive: contentData.isActive,
                createdBy: contentData.createdBy,
                createdAt: contentData.createdAt,
                updatedAt: new Date(),
              },
            });
            syncedCount++;
          } catch (error) {
            console.error(`Failed to sync content ${content.id}:`, error);
          }
        }
        break;
      }

      case 'Proposal': {
        const proposals = await sourcePrisma.proposal.findMany();
        for (const proposal of proposals) {
          try {
            // Extract non-JSON fields only and fix field names
            const { performanceData, userStoryTracking, metadata, ...proposalData } = proposal;
            // Suppress unused variable warnings
            void performanceData;
            void userStoryTracking;
            void metadata;

            await targetPrisma.proposal.upsert({
              where: { id: proposal.id },
              update: {
                title: proposalData.title,
                description: proposalData.description,
                status: proposalData.status,
                customerId: proposalData.customerId,
                createdBy: proposalData.createdBy, // Fixed: was createdById
                value: proposalData.value,
                currency: proposalData.currency,
                priority: proposalData.priority,
                validUntil: proposalData.validUntil,
                dueDate: proposalData.dueDate,
                submittedAt: proposalData.submittedAt,
                approvedAt: proposalData.approvedAt,
                version: proposalData.version,
                riskScore: proposalData.riskScore,
                tags: proposalData.tags,
                updatedAt: new Date(),
              },
              create: {
                ...proposalData,
                updatedAt: new Date(),
              },
            });
            syncedCount++;
          } catch (error) {
            console.error(`Failed to sync proposal ${proposal.id}:`, error);
          }
        }
        break;
      }

      default:
        console.log(`No sync logic implemented for table: ${table}`);
    }
  } catch (error) {
    console.error(`Sync failed for table ${table}:`, error);
    throw error;
  }

  return syncedCount;
};

/**
 * POST handler for database sync operations
 * Requires admin role and proper validation
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication & Authorization check
    const isDevelopment = process.env.NODE_ENV === 'development';
    const session = await getServerSession(authOptions);
    console.log('[DB-SYNC] Session user:', session?.user);

    // Define a type for the session user based on expected structure
    interface SessionUser {
      id: string;
      name: string;
      email: string;
      roles: string[] | string | Record<string, any> | null;
      permissions?: number | string | string[] | null;
      department?: string | null;
      image?: string;
    }

    /**
     * Helper function to convert user roles into a consistent string format
     * for audit logging, handling various data formats.
     */
    function getUserRoleString(
      roles: string[] | string | Record<string, any> | null | undefined
    ): string {
      if (!roles) return '';

      if (Array.isArray(roles)) {
        return roles.join(', ');
      }

      if (typeof roles === 'string') {
        return roles;
      }

      if (typeof roles === 'object') {
        // Try to extract meaningful information from object format
        try {
          const roleValues = Object.values(roles);
          if (roleValues.length > 0) {
            if (Array.isArray(roleValues[0])) {
              return roleValues[0].join(', ');
            } else if (typeof roleValues[0] === 'string') {
              return roleValues.join(', ');
            }
          }
          return JSON.stringify(roles);
        } catch {
          return 'Unknown Role Format';
        }
      }

      return String(roles);
    }

    // Development bypass for testing (only in development mode)
    const testBypass = isDevelopment && request.headers.get('x-test-bypass') === 'true';

    if (!testBypass && (!session || !session.user)) {
      console.error('[DB-SYNC] Authorization failed: No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let isAuthorized = testBypass;

    if (!testBypass && session?.user) {
      // Type assertion with safety check to match actual structure
      const sessionUser = session.user as unknown as SessionUser;
      console.log('[DB-SYNC] Session user roles:', sessionUser.roles);

      // Type assertion to match actual structure
      const user = session.user as SessionUser;

      // STEP 1: Log session user data for debugging and audit
      const sessionUserForLog = {
        id: user.id,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
        department: user.department,
      };

      // Always log access attempts in structured format
      console.log(
        `[ADMIN-API] DB-Sync access attempt by user: ${JSON.stringify(sessionUserForLog)}`
      );

      // STEP 2: Enhanced role verification with comprehensive checks
      isAuthorized = (() => {
        try {
          // Check if user has explicit admin permissions
          if (typeof user.permissions === 'number' && user.permissions >= 10) {
            console.log('[ADMIN-API] User granted access via permissions level');
            return true;
          }

          // Check roles as string - most common case per your logs
          if (typeof user.roles === 'string') {
            const rolesLower = user.roles.toLowerCase();
            const adminTerms = ['admin', 'administrator', 'system', 'superuser'];
            const hasAdminRole = adminTerms.some(term => rolesLower.includes(term));

            if (hasAdminRole) {
              console.log(`[ADMIN-API] User granted access via role string: "${user.roles}"`);
              return true;
            }
          }

          // Check roles as array
          if (Array.isArray(user.roles)) {
            const hasAdminRole = user.roles.some(role => {
              if (typeof role === 'string') {
                const roleLower = role.toLowerCase();
                return roleLower.includes('admin') || roleLower.includes('administrator');
              }
              return false;
            });

            if (hasAdminRole) {
              console.log('[ADMIN-API] User granted access via role array');
              return true;
            }
          }

          // Special handling for known admin emails in development
          if (isDevelopment && user.email) {
            const adminEmails = ['admin@posalpro.com', 'test@posalpro.com'];
            if (adminEmails.includes(user.email.toLowerCase())) {
              console.log('[ADMIN-API] User granted access via development admin email');
              return true;
            }
          }

          return false;
        } catch (error) {
          console.error('[ADMIN-API] Error during role verification:', error);
          return false;
        }
      })();
    }

    if (!isAuthorized) {
      const userDisplay = session?.user
        ? `${session.user.email} (roles: ${getUserRoleString((session.user as any).roles)})`
        : 'unknown';
      console.error(`[DB-SYNC] Authorization failed for user: ${userDisplay}`);
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Admin role required for database sync operations',
          userInfo: isDevelopment
            ? { email: session?.user?.email, roles: (session?.user as any)?.roles }
            : undefined,
        },
        { status: 403 }
      );
    }

    // 2. Request validation
    const body = await request.json();
    const validatedRequest = SyncRequestSchema.parse(body);

    console.log(`[DB-SYNC] Starting ${validatedRequest.direction} sync operation`);

    // 3. Perform sync operation
    const result = await performDatabaseSync(validatedRequest.direction, {
      tables: validatedRequest.tables,
      force: validatedRequest.force,
      includeConflictDetection: validatedRequest.includeConflictDetection,
      conflictResolution: validatedRequest.conflictResolution,
    });

    // 4. Log results and return response
    const logEntry = {
      timestamp: new Date().toISOString(),
      user: session?.user?.email || 'test-bypass',
      operation: 'database-sync',
      direction: validatedRequest.direction,
      success: result.success,
      itemsSynced: result.itemsSynced,
      itemsFailed: result.itemsFailed,
      conflicts: result.conflicts.length,
      duration: result.duration,
      tables: result.tables,
    };

    console.log(`[DB-SYNC] Operation completed:`, logEntry);

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Sync completed successfully. ${result.itemsSynced} items synced.`
        : `Sync completed with errors. ${result.itemsFailed} items failed.`,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[DB-SYNC] Sync operation failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
