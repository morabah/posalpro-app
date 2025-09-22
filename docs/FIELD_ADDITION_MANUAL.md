# 🎯 **Field Addition Manual - Complete Schema-to-UI Implementation Guide**

## 📋 **Overview**

This manual provides a **comprehensive, step-by-step guide** for adding new
fields to any entity in PosalPro MVP2. It follows the **CORE_REQUIREMENTS.md**
architecture patterns and ensures complete type safety, performance
optimization, and accessibility compliance.

**🎯 Key Principles:**

- **Database-First Design**: Schema drives everything
- **Feature-Based Organization**: Centralized, maintainable structure
- **Type Safety**: 100% TypeScript compliance
- **Performance**: Optimized caching and indexing
- **Accessibility**: WCAG 2.1 AA compliance
- **Testing**: Comprehensive validation

---

## 📚 **Table of Contents**

1. [Pre-Implementation Checklist](#pre-implementation-checklist)
2. [Database Schema Definition](#database-schema-definition)
3. [Zod Schema Creation](#zod-schema-creation)
4. [API Route Updates](#api-route-updates)
5. [Service Layer Updates](#service-layer-updates)
6. [Feature Module Updates](#feature-module-updates)
7. [UI Component Updates](#ui-component-updates)
8. [Testing & Validation](#testing--validation)
9. [Deployment Checklist](#deployment-checklist)
10. [Troubleshooting](#troubleshooting)

---

## ✅ **Pre-Implementation Checklist**

Before adding any field, complete this checklist:

```markdown
## Database Schema Analysis

- [ ] Identify target entity/table
- [ ] Determine field type and constraints
- [ ] Check for existing similar fields
- [ ] Plan indexing strategy
- [ ] Verify foreign key relationships

## Architecture Compliance

- [ ] Follow feature-based organization
- [ ] Maintain single source of truth
- [ ] Ensure type safety throughout
- [ ] Plan caching strategy
- [ ] Consider accessibility requirements

## Business Requirements

- [ ] Define validation rules
- [ ] Specify UI component type
- [ ] Plan user experience flow
- [ ] Consider performance impact
- [ ] Document acceptance criteria

## Technical Planning

- [ ] Plan migration strategy
- [ ] Identify affected components
- [ ] Plan testing approach
- [ ] Consider rollback strategy
- [ ] Ensure field exists in all pages (view, edit, create)
- [ ] Ensure field included in create/edit payloads

## Data Safety

- [ ] Backup database before schema changes
- [ ] Verify backup integrity
```

---

## 🗄️ **Database Schema Definition**

### **Step 1.1: Add Field to Prisma Schema**

Location: `prisma/schema.prisma`

```prisma
model EntityName {
  // Existing fields...
  newFieldName FieldType?  // Add your field here
  // ...rest of model

  // Add appropriate indexes
  @@index([newFieldName])  // Add index for searchable fields
  @@map("table_name")
}
```

**Field Type Guidelines:**

- `String` - Text fields (use `String?` for optional)
- `Int` - Whole numbers
- `Decimal` - Financial/monetary values
- `Boolean` - True/false flags
- `DateTime` - Timestamps
- `Json` - Complex structured data

### **Step 1.2: Backup Database**

```bash
# CRITICAL: Backup database before schema changes
npm run db:backup

# Verify backup
npm run db:backup:verify
```

### **Step 1.3: Generate Migration**

```bash
# Generate migration
npx prisma migrate dev --name add_new_field_to_entity

# Apply migration
npx prisma migrate deploy

# Generate updated types
npx prisma generate
```

### **Step 1.4: Verify Schema**

```bash
# Check generated types
npx tsc --noEmit --project tsconfig.build.json

# Validate database connection
npx prisma db push --preview-feature
```

---

## 🔍 **Zod Schema Creation**

### **Step 2.1: Update Feature Schemas**

Location: `src/features/[entity]/schemas.ts`

```typescript
/**
 * PosalPro MVP2 - [Entity] Schemas with New Field
 * User Story: US-X.X ([Entity] Management)
 * Hypothesis: HX ([Entity] field improves user experience)
 */

// ====================
// Base Field Schemas
// ====================

export const NewFieldSchema = z
  .enum(['OPTION1', 'OPTION2', 'OPTION3'])
  .optional()
  .nullable();

// Or for string fields:
export const NewFieldSchema = z
  .string()
  .min(1, 'Field is required')
  .max(100, 'Field must be less than 100 characters')
  .optional()
  .nullable();

// ====================
// Core Entity Schema
// ====================

export const EntitySchema = z.object({
  id: z.string(),
  // Existing fields...
  newField: NewFieldSchema, // Add your field here
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ====================
// CRUD Operation Schemas
// ====================

export const EntityCreateSchema = EntitySchema.extend({
  // Override with create-specific validation
  newField: NewFieldSchema.refine(val => val !== null, {
    message: 'Field is required for new entities',
  }),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  // Remove computed/auto-generated fields
});

export const EntityUpdateSchema = z.object({
  // Existing updatable fields...
  newField: NewFieldSchema.optional(), // Optional for updates
});

// CRITICAL: Ensure field in all CRUD schemas
export const EntityCreateSchema = EntitySchema.extend({
  newField: NewFieldSchema, // Required for creation
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ====================
// Specialized Schemas
// ====================

// Validation schema for uniqueness checking
export const FieldValidationSchema = z.object({
  newField: NewFieldSchema,
  excludeId: z.string().optional(),
});
```

### **Step 2.2: Update Type Definitions**

Location: `src/types/entities/[entity].ts`

```typescript
export interface EntityData {
  id: string;
  // Existing fields...
  newField?: string | null; // Add your field type
  createdAt: string;
  updatedAt: string;
}

export interface EntityCreateData {
  // Required fields for creation
  newField: string; // Make required for creation
}

export interface EntityUpdateData {
  // Optional fields for updates
  newField?: string;
}
```

---

## 🚀 **API Route Updates**

### **Step 3.1: Update GET Route**

Location: `src/app/api/[entity]/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EntitySchema } from '@/features/[entity]/schemas';
import { entityService } from '@/lib/services/[entity]Service';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logInfo, logError } from '@/lib/logger';

const QuerySchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const eh = ErrorHandlingService.getInstance();
  const requestId = request.headers.get('x-request-id') || 'unknown';

  try {
    logDebug('API: Fetching entity by ID', {
      component: 'EntityAPI',
      operation: 'GET_BY_ID',
      entityId: params.id,
      requestId,
    });

    // Validate query parameters
    const queryResult = QuerySchema.safeParse({ id: params.id });
    if (!queryResult.success) {
      return eh.createErrorResponse(
        new Error('Invalid entity ID format'),
        'Validation failed',
        { requestId }
      );
    }

    // Fetch entity with new field
    const entity = await entityService.getEntityById(params.id);

    if (!entity) {
      return eh.createErrorResponse(
        new Error('Entity not found'),
        'Entity not found',
        { requestId, entityId: params.id }
      );
    }

    // Validate response against schema
    const validationResult = EntitySchema.safeParse(entity);
    if (!validationResult.success) {
      logError('Entity schema validation failed', {
        component: 'EntityAPI',
        operation: 'GET_BY_ID',
        entityId: params.id,
        errors: validationResult.error.issues,
        requestId,
      });
    }

    logInfo('API: Entity fetched successfully', {
      component: 'EntityAPI',
      operation: 'GET_BY_ID',
      entityId: params.id,
      entityName: entity.name,
      requestId,
    });

    return eh.createSuccessResponse(entity);
  } catch (error) {
    logError('API: Entity fetch failed', {
      component: 'EntityAPI',
      operation: 'GET_BY_ID',
      entityId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId,
    });

    return eh.createErrorResponse(
      error instanceof Error ? error : new Error('Entity fetch failed'),
      'Failed to fetch entity',
      { requestId, entityId: params.id }
    );
  }
}
```

### **Step 3.2: Update POST Route**

Location: `src/app/api/[entity]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EntityCreateSchema } from '@/features/[entity]/schemas';
import { entityService } from '@/lib/services/[entity]Service';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logInfo, logError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const eh = ErrorHandlingService.getInstance();
  const requestId = request.headers.get('x-request-id') || 'unknown';

  try {
    logDebug('API: Creating new entity', {
      component: 'EntityAPI',
      operation: 'CREATE',
      requestId,
    });

    // Parse request body
    const body = await request.json();

    // Validate against create schema
    const validationResult = EntityCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return eh.createErrorResponse(
        new Error('Validation failed'),
        'Invalid entity data',
        {
          requestId,
          errors: validationResult.error.issues,
        }
      );
    }

    // Check field uniqueness if required
    if (validationResult.data.newField) {
      const existing = await entityService.checkFieldUniqueness(
        'newField',
        validationResult.data.newField
      );

      if (existing) {
        return eh.createErrorResponse(
          new Error('Field value already exists'),
          'Field must be unique',
          { requestId, field: 'newField' }
        );
      }
    }

    // Create entity
    const entity = await entityService.createEntity(validationResult.data);

    logInfo('API: Entity created successfully', {
      component: 'EntityAPI',
      operation: 'CREATE',
      entityId: entity.id,
      entityName: entity.name,
      requestId,
    });

    return eh.createSuccessResponse(entity, 201);
  } catch (error) {
    logError('API: Entity creation failed', {
      component: 'EntityAPI',
      operation: 'CREATE',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId,
    });

    return eh.createErrorResponse(
      error instanceof Error ? error : new Error('Entity creation failed'),
      'Failed to create entity',
      { requestId }
    );
  }
}
```

### **Step 3.3: Update PUT Route**

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const eh = ErrorHandlingService.getInstance();
  const requestId = request.headers.get('x-request-id') || 'unknown';

  try {
    logDebug('API: Updating entity', {
      component: 'EntityAPI',
      operation: 'UPDATE',
      entityId: params.id,
      requestId,
    });

    const body = await request.json();

    // Validate update data
    const validationResult = EntityUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return eh.createErrorResponse(
        new Error('Validation failed'),
        'Invalid update data',
        {
          requestId,
          errors: validationResult.error.issues,
        }
      );
    }

    // Check field uniqueness if updating unique field
    if (validationResult.data.newField !== undefined) {
      const existing = await entityService.checkFieldUniqueness(
        'newField',
        validationResult.data.newField,
        params.id // Exclude current entity
      );

      if (existing) {
        return eh.createErrorResponse(
          new Error('Field value already exists'),
          'Field must be unique',
          { requestId, field: 'newField', entityId: params.id }
        );
      }
    }

    // Update entity
    const entity = await entityService.updateEntity(
      params.id,
      validationResult.data
    );

    logInfo('API: Entity updated successfully', {
      component: 'EntityAPI',
      operation: 'UPDATE',
      entityId: params.id,
      entityName: entity.name,
      requestId,
    });

    return eh.createSuccessResponse(entity);
  } catch (error) {
    logError('API: Entity update failed', {
      component: 'EntityAPI',
      operation: 'UPDATE',
      entityId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId,
    });

    return eh.createErrorResponse(
      error instanceof Error ? error : new Error('Entity update failed'),
      'Failed to update entity',
      { requestId, entityId: params.id }
    );
  }
}
```

---

## 🔧 **Service Layer Updates**

### **Step 4.1: Update Database Service**

Location: `src/lib/services/[entity]Service.ts`

```typescript
/**
 * PosalPro MVP2 - [Entity] Database Service
 * Business logic layer for [entity] operations
 * Handles data transformation, validation, and caching
 */

import { PrismaClient, Prisma } from '@prisma/client';
import {
  EntitySchema,
  EntityCreateSchema,
  EntityUpdateSchema,
} from '@/features/[entity]/schemas';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logInfo, logError } from '@/lib/logger';

export class EntityService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient = new PrismaClient()) {
    this.prisma = prisma;
  }

  /**
   * Get entity by ID with new field
   */
  async getEntityById(id: string) {
    try {
      logDebug('Service: Fetching entity by ID', {
        component: 'EntityService',
        operation: 'getEntityById',
        entityId: id,
      });

      const entity = await this.prisma.entity.findUnique({
        where: { id },
        select: {
          id: true,
          // Existing fields...
          newField: true, // Include new field
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!entity) {
        throw new Error(`Entity not found: ${id}`);
      }

      // Transform data types if needed
      const transformedEntity = {
        ...entity,
        // Transform Decimal to number for newField if it's a decimal
        newField: entity.newField ? Number(entity.newField) : null,
      };

      logInfo('Service: Entity fetched successfully', {
        component: 'EntityService',
        operation: 'getEntityById',
        entityId: id,
        entityName: entity.name,
      });

      return transformedEntity;
    } catch (error) {
      logError('Service: Entity fetch failed', {
        component: 'EntityService',
        operation: 'getEntityById',
        entityId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create entity with new field validation
   */
  async createEntity(data: Prisma.EntityCreateInput) {
    try {
      logDebug('Service: Creating new entity', {
        component: 'EntityService',
        operation: 'createEntity',
        entityData: { ...data, newField: data.newField ? '[REDACTED]' : null },
      });

      // Validate data against schema
      const validationResult = EntityCreateSchema.safeParse(data);
      if (!validationResult.success) {
        throw new Error(`Validation failed: ${validationResult.error.message}`);
      }

      // Check field uniqueness if required
      if (data.newField) {
        await this.checkFieldUniqueness('newField', data.newField);
      }

      const entity = await this.prisma.entity.create({
        data: {
          ...data,
          // Transform data types if needed
          newField: data.newField, // Keep as-is for database
        },
        select: {
          id: true,
          // Existing fields...
          newField: true, // Include new field in response
          createdAt: true,
          updatedAt: true,
        },
      });

      logInfo('Service: Entity created successfully', {
        component: 'EntityService',
        operation: 'createEntity',
        entityId: entity.id,
        entityName: entity.name,
      });

      return entity;
    } catch (error) {
      logError('Service: Entity creation failed', {
        component: 'EntityService',
        operation: 'createEntity',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update entity with new field
   */
  async updateEntity(id: string, data: Partial<Prisma.EntityUpdateInput>) {
    try {
      logDebug('Service: Updating entity', {
        component: 'EntityService',
        operation: 'updateEntity',
        entityId: id,
        updateFields: Object.keys(data),
      });

      // Validate update data
      const validationResult = EntityUpdateSchema.safeParse(data);
      if (!validationResult.success) {
        throw new Error(`Validation failed: ${validationResult.error.message}`);
      }

      // Check field uniqueness if updating unique field
      if (data.newField !== undefined) {
        await this.checkFieldUniqueness(
          'newField',
          data.newField as string,
          id
        );
      }

      const entity = await this.prisma.entity.update({
        where: { id },
        data: {
          ...data,
          // Transform data types if needed
          newField: data.newField,
        },
        select: {
          id: true,
          // Existing fields...
          newField: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logInfo('Service: Entity updated successfully', {
        component: 'EntityService',
        operation: 'updateEntity',
        entityId: id,
        entityName: entity.name,
        updatedFields: Object.keys(data),
      });

      return entity;
    } catch (error) {
      logError('Service: Entity update failed', {
        component: 'EntityService',
        operation: 'updateEntity',
        entityId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Check field uniqueness
   */
  async checkFieldUniqueness(
    fieldName: string,
    value: string,
    excludeId?: string
  ) {
    try {
      const whereCondition: any = {
        [fieldName]: value,
      };

      if (excludeId) {
        whereCondition.id = { not: excludeId };
      }

      const existing = await this.prisma.entity.findFirst({
        where: whereCondition,
        select: { id: true, name: true },
      });

      return existing;
    } catch (error) {
      logError('Service: Field uniqueness check failed', {
        component: 'EntityService',
        operation: 'checkFieldUniqueness',
        fieldName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * List entities with new field filtering
   */
  async listEntities(options: {
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
  }) {
    try {
      const {
        search = '',
        limit = 20,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        filters = {},
      } = options;

      logDebug('Service: Listing entities', {
        component: 'EntityService',
        operation: 'listEntities',
        search,
        limit,
        offset,
        sortBy,
        sortOrder,
        filters: Object.keys(filters),
      });

      // Build where condition
      const where: Prisma.EntityWhereInput = {};

      // Search condition
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { newField: { contains: search, mode: 'insensitive' } }, // Include new field in search
        ];
      }

      // Apply filters including new field
      if (filters.newField) {
        where.newField = filters.newField;
      }

      // Add other filters...

      const entities = await this.prisma.entity.findMany({
        where,
        select: {
          id: true,
          name: true,
          // Existing fields...
          newField: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        take: limit,
        skip: offset,
      });

      const total = await this.prisma.entity.count({ where });

      logInfo('Service: Entities listed successfully', {
        component: 'EntityService',
        operation: 'listEntities',
        count: entities.length,
        total,
        search,
        filters: Object.keys(filters),
      });

      return {
        entities,
        total,
        hasNextPage: offset + limit < total,
        nextOffset: offset + limit,
      };
    } catch (error) {
      logError('Service: Entity listing failed', {
        component: 'EntityService',
        operation: 'listEntities',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// Export singleton instance
export const entityService = new EntityService();
```

---

## 🎣 **Feature Module Updates**

### **Step 5.1: Update Query Keys**

Location: `src/features/[entity]/keys.ts`

```typescript
/**
 * PosalPro MVP2 - [Entity] Query Keys
 * Centralized React Query keys for [entity]-related queries
 * Includes new field filtering capabilities
 */

type EntitySortBy = 'createdAt' | 'name' | 'newField'; // Add new field to sort options
type EntitySortOrder = 'asc' | 'desc';

export const qk = {
  [entity]: {
    // ====================
    // Base Query Keys
    // ====================
    all: ['[entity]'] as const,
    lists: () => [...qk[entity].all, 'list'] as const,

    // ====================
    // CRUD Query Keys
    // ====================
    list: (
      search: string,
      limit: number,
      sortBy: EntitySortBy,
      sortOrder: EntitySortOrder,
      cursor?: string,
      filters?: Record<string, unknown>
    ) =>
      [
        ...qk[entity].lists(),
        { search, limit, sortBy, sortOrder, cursor, filters },
      ] as const,

    byId: (id: string) => [...qk[entity].all, 'byId', id] as const,

    // ====================
    // New Field-Specific Keys
    // ====================
    byNewField: (value: string) =>
      [...qk[entity].all, 'byNewField', value] as const,
    searchByNewField: (query: string) =>
      [...qk[entity].all, 'searchByNewField', query] as const,

    // ====================
    // Feature-Specific Keys
    // ====================
    details: () => [...qk[entity].all, 'detail'] as const,
    detail: (id: string) => [...qk[entity].details(), id] as const,
  },
} as const;
```

### **Step 5.2: Update React Query Hooks**

Location: `src/features/[entity]/hooks/use[Entity].ts`

```typescript
/**
 * PosalPro MVP2 - [Entity] React Query Hooks
 * Optimized data fetching with new field support
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { entityService } from '@/lib/services/[entity]Service';
import { qk } from '../keys';
import {
  EntitySchema,
  EntityCreateSchema,
  EntityUpdateSchema,
} from '../schemas';
import { logDebug, logInfo, logError } from '@/lib/logger';

// ====================
// Query Hooks
// ====================

/**
 * Get entity by ID
 */
export function useEntity(id: string) {
  return useQuery({
    queryKey: qk[entity].byId(id),
    queryFn: () => entityService.getEntityById(id),
    enabled: !!id,
    staleTime: 30000, // 30 seconds
    gcTime: 120000, // 2 minutes
  });
}

/**
 * List entities with new field filtering
 */
export function useEntities(
  options: {
    search?: string;
    limit?: number;
    sortBy?: 'createdAt' | 'name' | 'newField';
    sortOrder?: 'asc' | 'desc';
    filters?: {
      newField?: string;
      // Other filters...
    };
  } = {}
) {
  const {
    search = '',
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    filters = {},
  } = options;

  return useQuery({
    queryKey: qk[entity].list(
      search,
      limit,
      sortBy,
      sortOrder,
      undefined,
      filters
    ),
    queryFn: () =>
      entityService.listEntities({
        search,
        limit,
        sortBy,
        sortOrder,
        filters,
      }),
    staleTime: 30000,
    gcTime: 120000,
  });
}

/**
 * Search entities by new field
 */
export function useEntitiesByNewField(value: string) {
  return useQuery({
    queryKey: qk[entity].byNewField(value),
    queryFn: () => entityService.getEntitiesByNewField(value),
    enabled: !!value,
    staleTime: 30000,
    gcTime: 120000,
  });
}

// ====================
// Mutation Hooks
// ====================

/**
 * Create entity mutation
 */
export function useCreateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EntityCreateData) => entityService.createEntity(data),
    onSuccess: newEntity => {
      logInfo('Entity created successfully', {
        component: 'EntityHooks',
        operation: 'create',
        entityId: newEntity.id,
        entityName: newEntity.name,
      });

      // Invalidate and refetch entity lists
      queryClient.invalidateQueries({ queryKey: qk[entity].lists() });

      // Update individual entity cache
      queryClient.setQueryData(qk[entity].byId(newEntity.id), newEntity);
    },
    onError: error => {
      logError('Entity creation failed', {
        component: 'EntityHooks',
        operation: 'create',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Update entity mutation
 */
export function useUpdateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EntityUpdateData }) =>
      entityService.updateEntity(id, data),
    onSuccess: (updatedEntity, { id }) => {
      logInfo('Entity updated successfully', {
        component: 'EntityHooks',
        operation: 'update',
        entityId: id,
        entityName: updatedEntity.name,
        updatedFields: Object.keys(updatedEntity),
      });

      // Update individual entity cache
      queryClient.setQueryData(qk[entity].byId(id), updatedEntity);

      // Invalidate lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: qk[entity].lists() });

      // Invalidate new field specific queries
      if (updatedEntity.newField) {
        queryClient.invalidateQueries({
          queryKey: qk[entity].byNewField(updatedEntity.newField),
        });
      }
    },
    onError: (error, { id }) => {
      logError('Entity update failed', {
        component: 'EntityHooks',
        operation: 'update',
        entityId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Delete entity mutation
 */
export function useDeleteEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => entityService.deleteEntity(id),
    onSuccess: (_, id) => {
      logInfo('Entity deleted successfully', {
        component: 'EntityHooks',
        operation: 'delete',
        entityId: id,
      });

      // Remove from cache
      queryClient.removeQueries({ queryKey: qk[entity].byId(id) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: qk[entity].lists() });
    },
    onError: (error, id) => {
      logError('Entity deletion failed', {
        component: 'EntityHooks',
        operation: 'delete',
        entityId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
```

### **Step 5.3: Update Feature Index**

Location: `src/features/[entity]/index.ts`

```typescript
/**
 * PosalPro MVP2 - [Entity] Feature Module
 * Centralized exports for [entity] functionality
 * Includes new field support
 */

// ====================
// Schemas
// ====================
export {
  EntitySchema,
  EntityCreateSchema,
  EntityUpdateSchema,
  NewFieldSchema,
  FieldValidationSchema,
} from './schemas';

// ====================
// Types
// ====================
export type {
  EntityData,
  EntityCreateData,
  EntityUpdateData,
} from '@/types/entities/[entity]';

// ====================
// Query Keys
// ====================
export { qk } from './keys';

// ====================
// Hooks
// ====================
export {
  useEntity,
  useEntities,
  useEntitiesByNewField,
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
} from './hooks/use[Entity]';

// ====================
// Services
// ====================
export { entityService } from '@/lib/services/[entity]Service';
```

---

## 🎨 **UI Component Updates**

### **Step 6.1: Update Form Components**

Location: `src/components/[entity]/[Entity]EditForm.tsx`

```typescript
/**
 * PosalPro MVP2 - [Entity] Edit Form
 * Accessible form component with new field support
 * WCAG 2.1 AA compliant with proper error handling
 */

'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EntityUpdateSchema } from '@/features/[entity]/schemas';
import { useEntity, useUpdateEntity } from '@/features/[entity]/hooks';
import { Input } from '@/components/ui/forms/Input';
import { Button } from '@/components/ui/forms/Button';
import { SearchableCountrySelect } from '@/components/ui/SearchableCountrySelect';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logInfo, logError } from '@/lib/logger';

interface EntityEditFormProps {
  entityId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EntityEditForm({ entityId, onSuccess, onCancel }: EntityEditFormProps) {
  // Form setup with new field validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    watch,
    setValue,
    reset,
  } = useForm<EntityUpdateData>({
    resolver: zodResolver(EntityUpdateSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      // Existing fields...
      newField: '', // Include new field in defaults
    },
  });

  // Data fetching and mutations
  const { data: entity, isLoading } = useEntity(entityId);
  const updateEntity = useUpdateEntity();

  // Reset form when entity data loads
  useEffect(() => {
    if (entity) {
      reset({
        name: entity.name || '',
        // Existing fields...
        newField: entity.newField || '', // Include new field in reset
      });
    }
  }, [entity, reset]);

  // Form submission
  const onSubmit = async (data: EntityUpdateData) => {
    try {
      logDebug('Form: Submitting entity update', {
        component: 'EntityEditForm',
        operation: 'submit',
        entityId,
        updatedFields: Object.keys(data),
      });

      // CRITICAL: Ensure data object includes all fields (newField is included via form)
      await updateEntity.mutateAsync({
        id: entityId,
        data, // Contains all form fields including newField
      });

      logInfo('Form: Entity update successful', {
        component: 'EntityEditForm',
        operation: 'submit',
        entityId,
        entityName: entity?.name,
      });

      onSuccess?.();

    } catch (error) {
      logError('Form: Entity update failed', {
        component: 'EntityEditForm',
        operation: 'submit',
        entityId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const eh = ErrorHandlingService.getInstance();
      eh.processError(error instanceof Error ? error : new Error('Update failed'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Form Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900">Edit Entity</h2>
        <p className="text-sm text-gray-600">
          Update entity information including the new field.
        </p>
      </div>

      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <Input
          {...register('name')}
          id="name"
          type="text"
          value={watch('name') || ''}
          placeholder="Enter entity name"
          error={errors.name?.message}
          touched={!!touchedFields.name}
          className="min-h-[44px]"
        />
      </div>

      {/* New Field - Choose appropriate component based on field type */}
      {/* For text fields: */}
      <div>
        <label htmlFor="newField" className="block text-sm font-medium text-gray-700 mb-1">
          New Field
        </label>
        <Input
          {...register('newField')}
          id="newField"
          type="text"
          value={watch('newField') || ''}
          placeholder="Enter new field value"
          error={errors.newField?.message}
          touched={!!touchedFields.newField}
          className="min-h-[44px]"
        />
      </div>

      {/* For select/enum fields: */}
      <div>
        <label htmlFor="newField" className="block text-sm font-medium text-gray-700 mb-1">
          New Field
        </label>
        <select
          {...register('newField')}
          id="newField"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
        >
          <option value="">Select option</option>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </select>
        {errors.newField && (
          <p className="mt-1 text-sm text-red-600">{errors.newField.message}</p>
        )}
      </div>

      {/* For searchable fields like country: */}
      <SearchableCountrySelect
        name="country"
        label="Country"
        placeholder="Search countries..."
        size="md"
        register={register}
        setValue={setValue}
        watch={watch}
        formErrors={errors}
      />

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={updateEntity.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!isValid || updateEntity.isPending}
          loading={updateEntity.isPending}
        >
          {updateEntity.isPending ? 'Updating...' : 'Update Entity'}
        </Button>
      </div>
    </form>
  );
}
```

### **Step 6.2: Update List Components**

Location: `src/components/[entity]/[Entity]List.tsx`

```typescript
/**
 * PosalPro MVP2 - [Entity] List Component
 * Optimized list with new field display and filtering
 * Includes accessibility and performance optimizations
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useEntities } from '@/features/[entity]/hooks';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Card } from '@/components/ui/Card';
import { logDebug, logInfo } from '@/lib/logger';

interface EntityListProps {
  onEdit?: (entityId: string) => void;
  onDelete?: (entityId: string) => void;
}

export function EntityList({ onEdit, onDelete }: EntityListProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'newField'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [newFieldFilter, setNewFieldFilter] = useState('');

  // Fetch entities with new field filtering
  const { data, isLoading, error } = useEntities({
    search,
    sortBy,
    sortOrder,
    filters: {
      newField: newFieldFilter || undefined,
    },
  });

  // Memoized filtered entities
  const entities = useMemo(() => {
    if (!data?.entities) return [];

    let filtered = data.entities;

    // Additional client-side filtering if needed
    if (newFieldFilter) {
      filtered = filtered.filter(entity =>
        entity.newField?.toLowerCase().includes(newFieldFilter.toLowerCase())
      );
    }

    return filtered;
  }, [data?.entities, newFieldFilter]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load entities
          </h3>
          <p className="text-gray-600">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <Input
              type="text"
              placeholder="Search entities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-[38px]"
            />
          </div>

          {/* New Field Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Field Filter
            </label>
            <Input
              type="text"
              placeholder="Filter by new field..."
              value={newFieldFilter}
              onChange={(e) => setNewFieldFilter(e.target.value)}
              className="min-h-[38px]"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px]"
            >
              <option value="createdAt">Created Date</option>
              <option value="name">Name</option>
              <option value="newField">New Field</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px]"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Entity List */}
      <div className="space-y-4">
        {entities.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No entities found
              </h3>
              <p className="text-gray-600">
                {search || newFieldFilter
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating your first entity.'
                }
              </p>
            </div>
          </Card>
        ) : (
          entities.map((entity) => (
            <Card key={entity.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {entity.name}
                  </h3>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">New Field:</span>{' '}
                      {entity.newField || 'Not set'}
                    </div>
                    {/* Other entity fields... */}
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {new Date(entity.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit?.(entity.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete?.(entity.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination Info */}
      {data && (
        <div className="text-center text-sm text-gray-600">
          Showing {entities.length} of {data.total} entities
        </div>
      )}
    </div>
  );
}
```

### **Step 6.3: Update Create Form**

Location: `src/app/(dashboard)/[entity]/create/page.tsx`

```typescript
/**
 * PosalPro MVP2 - Create [Entity] Page
 * Form for creating new entities with new field support
 * Includes validation, error handling, and accessibility
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { EntityCreateSchema } from '@/features/[entity]/schemas';
import { useCreateEntity } from '@/features/[entity]/hooks';
import { Input } from '@/components/ui/forms/Input';
import { Button } from '@/components/ui/forms/Button';
import { Card } from '@/components/ui/Card';
import { SearchableCountrySelect } from '@/components/ui/SearchableCountrySelect';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logInfo, logError } from '@/lib/logger';

export default function CreateEntityPage() {
  const router = useRouter();
  const createEntity = useCreateEntity();

  // Form setup with comprehensive validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    watch,
    setValue,
  } = useForm<EntityCreateData>({
    resolver: zodResolver(EntityCreateSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      // Existing fields...
      newField: '', // Include new field in create form
    },
  });

  // Form submission with error handling
  const onSubmit = async (data: EntityCreateData) => {
    try {
      logDebug('Page: Creating new entity', {
        component: 'CreateEntityPage',
        operation: 'submit',
        entityData: { ...data, newField: data.newField ? '[REDACTED]' : undefined },
      });

      // CRITICAL: Ensure data object includes all fields (newField is included via form)
      const entity = await createEntity.mutateAsync(data); // Contains all form fields including newField

      logInfo('Page: Entity created successfully', {
        component: 'CreateEntityPage',
        operation: 'submit',
        entityId: entity.id,
        entityName: entity.name,
      });

      // Redirect to entity detail page
      router.push(`/[entity]/${entity.id}`);

    } catch (error) {
      logError('Page: Entity creation failed', {
        component: 'CreateEntityPage',
        operation: 'submit',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const eh = ErrorHandlingService.getInstance();
      eh.processError(error instanceof Error ? error : new Error('Creation failed'));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Entity</h1>
        <p className="text-gray-600 mt-2">
          Add a new entity to the system with all required information.
        </p>
      </div>

      {/* Create Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <Input
              {...register('name')}
              id="name"
              type="text"
              value={watch('name') || ''}
              placeholder="Enter entity name"
              error={errors.name?.message}
              touched={!!touchedFields.name}
              className="min-h-[44px]"
            />
          </div>

          {/* New Field - Choose appropriate component */}
          <div>
            <label htmlFor="newField" className="block text-sm font-medium text-gray-700 mb-1">
              New Field
            </label>
            <Input
              {...register('newField')}
              id="newField"
              type="text"
              value={watch('newField') || ''}
              placeholder="Enter new field value"
              error={errors.newField?.message}
              touched={!!touchedFields.newField}
              className="min-h-[44px]"
            />
          </div>

          {/* For searchable fields: */}
          <SearchableCountrySelect
            name="country"
            label="Country"
            placeholder="Search countries..."
            size="md"
            register={register}
            setValue={setValue}
            watch={watch}
            formErrors={errors}
          />

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={createEntity.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || createEntity.isPending}
              loading={createEntity.isPending}
            >
              {createEntity.isPending ? 'Creating...' : 'Create Entity'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
```

---

## 🧪 **Testing & Validation**

### **Step 7.1: Unit Tests**

Location: `src/__tests__/features/[entity]/[entity].test.ts`

```typescript
/**
 * PosalPro MVP2 - [Entity] Feature Tests
 * Comprehensive testing for new field functionality
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  EntitySchema,
  EntityCreateSchema,
  EntityUpdateSchema,
} from '@/features/[entity]/schemas';
import { entityService } from '@/lib/services/[entity]Service';
import { mockEntity, mockEntityCreateData } from '@/test/mocks/[entity]';

// Mock the service
jest.mock('@/lib/services/[entity]Service');

describe('[Entity] Feature Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should validate entity with new field', () => {
      const validEntity = {
        ...mockEntity,
        newField: 'valid-value',
      };

      const result = EntitySchema.safeParse(validEntity);
      expect(result.success).toBe(true);
      expect(result.data.newField).toBe('valid-value');
    });

    it('should reject invalid new field', () => {
      const invalidEntity = {
        ...mockEntity,
        newField: '', // Invalid if required
      };

      const result = EntitySchema.safeParse(invalidEntity);
      expect(result.success).toBe(false);
    });

    it('should validate create schema with new field', () => {
      const createData = {
        ...mockEntityCreateData,
        newField: 'create-value',
      };

      const result = EntityCreateSchema.safeParse(createData);
      expect(result.success).toBe(true);
    });

    it('should validate update schema with new field', () => {
      const updateData = {
        newField: 'update-value',
      };

      const result = EntityUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });
  });

  describe('Service Layer', () => {
    it('should create entity with new field', async () => {
      const createData = {
        ...mockEntityCreateData,
        newField: 'service-test',
      };

      const mockResult = { ...mockEntity, newField: 'service-test' };
      (entityService.createEntity as jest.Mock).mockResolvedValue(mockResult);

      const result = await entityService.createEntity(createData);

      expect(entityService.createEntity).toHaveBeenCalledWith(createData);
      expect(result.newField).toBe('service-test');
    });

    it('should update entity new field', async () => {
      const updateData = { newField: 'updated-value' };
      const mockResult = { ...mockEntity, newField: 'updated-value' };

      (entityService.updateEntity as jest.Mock).mockResolvedValue(mockResult);

      const result = await entityService.updateEntity('test-id', updateData);

      expect(entityService.updateEntity).toHaveBeenCalledWith(
        'test-id',
        updateData
      );
      expect(result.newField).toBe('updated-value');
    });

    it('should filter entities by new field', async () => {
      const filterValue = 'filter-test';
      const mockResults = [{ ...mockEntity, newField: filterValue }];

      (entityService.listEntities as jest.Mock).mockResolvedValue({
        entities: mockResults,
        total: 1,
        hasNextPage: false,
        nextOffset: 20,
      });

      const result = await entityService.listEntities({
        filters: { newField: filterValue },
      });

      expect(result.entities[0].newField).toBe(filterValue);
    });
  });

  describe('Query Keys', () => {
    it('should generate correct query keys', () => {
      const { qk } = require('@/features/[entity]/keys');

      expect(qk[entity].byId('test-id')).toEqual([
        '[entity]',
        'byId',
        'test-id',
      ]);
      expect(qk[entity].byNewField('test-value')).toEqual([
        '[entity]',
        'byNewField',
        'test-value',
      ]);
    });
  });
});
```

### **Step 7.2: Integration Tests**

Location: `src/__tests__/integration/[entity]-api.test.ts`

```typescript
/**
 * PosalPro MVP2 - [Entity] API Integration Tests
 * End-to-end testing for new field functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTestClient } from '@/test/utils/test-client';
import { mockEntityCreateData } from '@/test/mocks/[entity]';

describe('[Entity] API Integration Tests', () => {
  let testClient: any;

  beforeAll(async () => {
    testClient = await createTestClient();
  });

  afterAll(async () => {
    await testClient.cleanup();
  });

  describe('POST /[entity]', () => {
    it('should create entity with new field', async () => {
      const createData = {
        ...mockEntityCreateData,
        newField: 'integration-test',
      };

      const response = await testClient
        .post('/api/[entity]')
        .send(createData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.newField).toBe('integration-test');
      expect(response.body.data.id).toBeDefined();
    });

    it('should validate new field requirements', async () => {
      const invalidData = {
        ...mockEntityCreateData,
        newField: '', // Invalid if required
      };

      const response = await testClient
        .post('/api/[entity]')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
  });

  describe('PUT /[entity]/[id]', () => {
    it('should update entity new field', async () => {
      // First create an entity
      const createResponse = await testClient
        .post('/api/[entity]')
        .send({ ...mockEntityCreateData, newField: 'original' })
        .expect(200);

      const entityId = createResponse.body.data.id;

      // Then update it
      const updateData = { newField: 'updated' };
      const updateResponse = await testClient
        .put(`/api/[entity]/${entityId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.newField).toBe('updated');
    });
  });

  describe('GET /[entity]/[id]', () => {
    it('should return entity with new field', async () => {
      const createResponse = await testClient
        .post('/api/[entity]')
        .send({ ...mockEntityCreateData, newField: 'get-test' })
        .expect(200);

      const entityId = createResponse.body.data.id;

      const getResponse = await testClient
        .get(`/api/[entity]/${entityId}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.newField).toBe('get-test');
      expect(getResponse.body.data.id).toBe(entityId);
    });
  });

  describe('GET /[entity]', () => {
    it('should filter entities by new field', async () => {
      // Create multiple entities with different new field values
      await testClient
        .post('/api/[entity]')
        .send({ ...mockEntityCreateData, newField: 'filter-test-1' })
        .expect(200);

      await testClient
        .post('/api/[entity]')
        .send({ ...mockEntityCreateData, newField: 'filter-test-2' })
        .expect(200);

      // Filter by new field
      const listResponse = await testClient
        .get('/api/[entity]?newField=filter-test-1')
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.entities.length).toBe(1);
      expect(listResponse.body.data.entities[0].newField).toBe('filter-test-1');
    });
  });
});
```

### **Step 7.3: E2E Tests**

Location: `src/test/e2e/[entity]-crud.test.ts`

```typescript
/**
 * PosalPro MVP2 - [Entity] CRUD E2E Tests
 * Browser-based testing for new field UI functionality
 */

import { test, expect } from '@playwright/test';

test.describe('[Entity] CRUD Operations', () => {
  test('should create entity with new field', async ({ page }) => {
    await page.goto('/[entity]/create');

    // Fill required fields
    await page.fill('[data-testid="entity-name"]', 'Test Entity');
    await page.fill('[data-testid="entity-new-field"]', 'test-value');

    // Submit form
    await page.click('[data-testid="submit-button"]');

    // Verify success
    await expect(page).toHaveURL(/\/\[entity\]\/.+/);
    await expect(
      page.locator('[data-testid="entity-new-field-display"]')
    ).toContainText('test-value');
  });

  test('should edit entity new field', async ({ page }) => {
    // Navigate to existing entity
    await page.goto('/[entity]/test-id/edit');

    // Update new field
    await page.fill('[data-testid="entity-new-field"]', 'updated-value');
    await page.click('[data-testid="submit-button"]');

    // Verify update
    await expect(
      page.locator('[data-testid="entity-new-field-display"]')
    ).toContainText('updated-value');
  });

  test('should filter entities by new field', async ({ page }) => {
    await page.goto('/[entity]');

    // Apply new field filter
    await page.fill('[data-testid="new-field-filter"]', 'filter-value');
    await page.click('[data-testid="apply-filters"]');

    // Verify filtered results
    const entityRows = page.locator('[data-testid="entity-row"]');
    await expect(entityRows).toHaveCount(1);
    await expect(entityRows.first()).toContainText('filter-value');
  });

  test('should search entities by new field', async ({ page }) => {
    await page.goto('/[entity]');

    // Search by new field value
    await page.fill('[data-testid="search-input"]', 'search-value');
    await page.press('[data-testid="search-input"]', 'Enter');

    // Verify search results
    await expect(page.locator('[data-testid="search-results"]')).toContainText(
      'search-value'
    );
  });
});
```

---

## 📋 **Deployment Checklist**

### **Pre-Deployment Verification**

```markdown
## Database Migration

- [ ] Database backup completed before changes
- [ ] Migration file created and tested locally
- [ ] Rollback strategy documented
- [ ] Data migration script prepared (if needed)
- [ ] Backup integrity verified

## Code Quality

- [ ] TypeScript compilation passes (npm run type-check)
- [ ] All linting errors resolved (npm run lint)
- [ ] Unit tests passing (npm run test:unit)
- [ ] Integration tests passing (npm run test:integration)

## Feature Completeness

- [ ] Schema validation working
- [ ] API endpoints responding correctly
- [ ] UI components rendering properly
- [ ] Form validation working
- [ ] Search/filter functionality working

## Performance & Security

- [ ] Database indexes created
- [ ] Query performance tested
- [ ] Input validation implemented
- [ ] XSS protection in place
- [ ] Rate limiting considered

## Documentation

- [ ] API documentation updated
- [ ] User guide updated
- [ ] Migration guide documented
- [ ] Rollback procedures documented
```

### **Deployment Steps**

```bash
# 1. Backup database (CRITICAL)
npm run db:backup

# 2. Verify backup
npm run db:backup:verify

# 3. Run database migration
npm run db:migrate

# 4. Deploy application
npm run deploy

# 5. Verify deployment
npm run health-check

# 6. Monitor application
npm run monitor
```

### **Rollback Plan**

```bash
# If deployment fails:
npm run db:restore
npm run deploy:rollback
npm run health-check
```

---

## 🔧 **Troubleshooting**

### **Common Issues & Solutions**

#### **1. Database Migration Fails**

```bash
# Check migration status
npx prisma migrate status

# Reset and retry
npx prisma migrate reset --force

# Manual migration
npx prisma db push
```

#### **2. TypeScript Compilation Errors**

```bash
# Clear cache and rebuild
rm -rf .next node_modules/.cache
npm run type-check

# Check for missing imports
npm run lint
```

#### **3. API Validation Errors**

```bash
# Check API logs
tail -f logs/api.log

# Test API endpoints
curl -X GET http://localhost:3000/api/[entity]

# Validate request format
curl -X POST http://localhost:3000/api/[entity] \
  -H "Content-Type: application/json" \
  -d '{"name":"test","newField":"test-value"}'
```

#### **4. UI Component Issues**

```bash
# Check console errors
# Look for React Hook errors
# Verify component props
# Test with React DevTools
```

#### **5. Form Validation Problems**

```bash
# Check form state
console.log(formState.errors);

# Verify schema
const result = EntityCreateSchema.safeParse(data);
console.log(result.error);

# Test field validation
const fieldResult = NewFieldSchema.safeParse(value);
console.log(fieldResult.error);
```

#### **6. Field Mapping Issues**

```bash
# Check API response contains field
curl http://localhost:3000/api/[entity]/[id] | grep newField

# Verify mapper includes field
console.log(mapApiToCustomer(apiResponse));

# Check component displays field
console.log(customer.newField);
```

#### **7. CustomerType Mapping Error (Resolved)**

**Issue**: CustomerType not displaying in profile view due to missing field in
`mapApiToCustomer`.

**Solution**: Add `customerType` field to mapper function:

```typescript
customerType: (raw.customerType as CustomerType) ?? previous?.customerType ?? 'ENDUSER',
```

**Import required**:
`import type { CustomerType } from '@/features/customers/schemas';`

### **Debug Commands**

```bash
# Database debugging
npm run db:studio
npm run db:check

# API debugging
npm run api:logs
npm run api:test

# UI debugging
npm run dev:debug
npm run ui:test
```

---

## 🎯 **Key Principles Summary**

### **1. Database-First Design**

- Schema drives all implementations
- Migration-first approach
- Index optimization for performance

### **2. Feature-Based Organization**

- Centralized schemas, hooks, and keys
- Consistent file structure
- Reusable components

### **3. Type Safety**

- 100% TypeScript compliance
- Zod schema validation
- Compile-time error catching

### **4. Performance Optimization**

- Database indexing
- React Query caching
- Lazy loading components

### **5. Accessibility Compliance**

- WCAG 2.1 AA standards
- Keyboard navigation
- Screen reader support

### **6. Comprehensive Testing**

- Unit tests for components
- Integration tests for APIs
- E2E tests for workflows

This manual ensures consistent, high-quality field additions across any entity
in PosalPro MVP2 while maintaining the architectural standards and user
experience quality defined in CORE_REQUIREMENTS.md.
