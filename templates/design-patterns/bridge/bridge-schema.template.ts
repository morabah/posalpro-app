// __FILE_DESCRIPTION__: Bridge-specific Zod schema template for entity validation
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

import { z } from 'zod';

// ✅ BRIDGE PATTERN: Base entity schema with common fields
export const __ENTITY_TYPE__BaseSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  status: z.enum(['active', 'inactive', 'pending', 'archived']).default('active'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// ✅ BRIDGE PATTERN: Create schema with required fields only
export const __ENTITY_TYPE__CreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  status: z.enum(['active', 'inactive', 'pending', 'archived']).default('active'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  // Add entity-specific fields here
  // email: z.string().email('Invalid email format').optional(),
  // phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format').optional(),
  // address: z.object({
  //   street: z.string().min(1, 'Street is required'),
  //   city: z.string().min(1, 'City is required'),
  //   state: z.string().min(1, 'State is required'),
  //   zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  //   country: z.string().min(1, 'Country is required'),
  // }).optional(),
});

// ✅ BRIDGE PATTERN: Update schema with optional fields
export const __ENTITY_TYPE__UpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .optional(),
  status: z.enum(['active', 'inactive', 'pending', 'archived']).optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  // Add entity-specific fields here
  // email: z.string().email('Invalid email format').optional(),
  // phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format').optional(),
  // address: z.object({
  //   street: z.string().min(1, 'Street is required'),
  //   city: z.string().min(1, 'City is required'),
  //   state: z.string().min(1, 'State is required'),
  //   zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  //   country: z.string().min(1, 'Country is required'),
  // }).optional(),
});

// ✅ BRIDGE PATTERN: Query parameters schema
export const __ENTITY_TYPE__QuerySchema = z.object({
  page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce
    .number()
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit cannot exceed 50')
    .default(30),
  search: z.string().max(100, 'Search term must be less than 100 characters').optional(),
  status: z.enum(['active', 'inactive', 'pending', 'archived']).optional(),
  sortBy: z.enum(['name', 'status', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  fields: z.string().max(500, 'Fields string too long').optional(),
  includeRelations: z.coerce.boolean().default(false),
  // Add entity-specific query filters here
  // category: z.string().optional(),
  // dateFrom: z.string().datetime().optional(),
  // dateTo: z.string().datetime().optional(),
});

// ✅ BRIDGE PATTERN: ID validation schema
export const __ENTITY_TYPE__IdSchema = z.string().min(1, 'ID is required');

// ✅ BRIDGE PATTERN: Bulk operations schema
export const __ENTITY_TYPE__BulkUpdateSchema = z.object({
  ids: z
    .array(z.string().min(1, 'ID is required'))
    .min(1, 'At least one ID is required')
    .max(100, 'Cannot update more than 100 items at once'),
  updates: __ENTITY_TYPE__UpdateSchema,
});

export const __ENTITY_TYPE__BulkDeleteSchema = z.object({
  ids: z
    .array(z.string().min(1, 'ID is required'))
    .min(1, 'At least one ID is required')
    .max(100, 'Cannot delete more than 100 items at once'),
});

// ✅ BRIDGE PATTERN: Response schemas
export const __ENTITY_TYPE__ResponseSchema = z.object({
  success: z.boolean(),
  data: __ENTITY_TYPE__BaseSchema.optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export const __ENTITY_TYPE__ListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(__ENTITY_TYPE__BaseSchema),
  pagination: z.object({
    hasNextPage: z.boolean(),
    nextCursor: z
      .object({
        cursorCreatedAt: z.string().datetime().optional(),
        cursorId: z.string().optional(),
      })
      .nullable(),
    limit: z.number(),
    page: z.number(),
  }),
  meta: z.object({
    fields: z.array(z.string()),
    filters: z.record(z.unknown()),
    sort: z.object({
      field: z.string(),
      order: z.enum(['asc', 'desc']),
    }),
    includeRelations: z.boolean(),
  }),
});

// ✅ BRIDGE PATTERN: Error response schema
export const __ENTITY_TYPE__ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

// ✅ BRIDGE PATTERN: Type exports
export type __ENTITY_TYPE__ = z.infer<typeof __ENTITY_TYPE__BaseSchema>;
export type __ENTITY_TYPE__Create = z.infer<typeof __ENTITY_TYPE__CreateSchema>;
export type __ENTITY_TYPE__Update = z.infer<typeof __ENTITY_TYPE__UpdateSchema>;
export type __ENTITY_TYPE__Query = z.infer<typeof __ENTITY_TYPE__QuerySchema>;
export type __ENTITY_TYPE__Response = z.infer<typeof __ENTITY_TYPE__ResponseSchema>;
export type __ENTITY_TYPE__ListResponse = z.infer<typeof __ENTITY_TYPE__ListResponseSchema>;
export type __ENTITY_TYPE__ErrorResponse = z.infer<typeof __ENTITY_TYPE__ErrorResponseSchema>;
export type __ENTITY_TYPE__BulkUpdate = z.infer<typeof __ENTITY_TYPE__BulkUpdateSchema>;
export type __ENTITY_TYPE__BulkDelete = z.infer<typeof __ENTITY_TYPE__BulkDeleteSchema>;

// ✅ BRIDGE PATTERN: Schema validation utilities
export const validate__ENTITY_TYPE__Create = (data: unknown): __ENTITY_TYPE__Create => {
  return __ENTITY_TYPE__CreateSchema.parse(data);
};

export const validate__ENTITY_TYPE__Update = (data: unknown): __ENTITY_TYPE__Update => {
  return __ENTITY_TYPE__UpdateSchema.parse(data);
};

export const validate__ENTITY_TYPE__Query = (data: unknown): __ENTITY_TYPE__Query => {
  return __ENTITY_TYPE__QuerySchema.parse(data);
};

export const validate__ENTITY_TYPE__Id = (id: unknown): string => {
  return __ENTITY_TYPE__IdSchema.parse(id);
};

export const validate__ENTITY_TYPE__BulkUpdate = (data: unknown): __ENTITY_TYPE__BulkUpdate => {
  return __ENTITY_TYPE__BulkUpdateSchema.parse(data);
};

export const validate__ENTITY_TYPE__BulkDelete = (data: unknown): __ENTITY_TYPE__BulkDelete => {
  return __ENTITY_TYPE__BulkDeleteSchema.parse(data);
};

// ✅ BRIDGE PATTERN: Safe validation utilities (returns null on error)
export const safeValidate__ENTITY_TYPE__Create = (data: unknown): __ENTITY_TYPE__Create | null => {
  try {
    return __ENTITY_TYPE__CreateSchema.parse(data);
  } catch {
    return null;
  }
};

export const safeValidate__ENTITY_TYPE__Update = (data: unknown): __ENTITY_TYPE__Update | null => {
  try {
    return __ENTITY_TYPE__UpdateSchema.parse(data);
  } catch {
    return null;
  }
};

export const safeValidate__ENTITY_TYPE__Query = (data: unknown): __ENTITY_TYPE__Query | null => {
  try {
    return __ENTITY_TYPE__QuerySchema.parse(data);
  } catch {
    return null;
  }
};

export const safeValidate__ENTITY_TYPE__Id = (id: unknown): string | null => {
  try {
    return __ENTITY_TYPE__IdSchema.parse(id);
  } catch {
    return null;
  }
};

// ✅ BRIDGE PATTERN: Schema transformation utilities
export const transform__ENTITY_TYPE__ForCreate = (data: __ENTITY_TYPE__Create) => {
  return {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const transform__ENTITY_TYPE__ForUpdate = (data: __ENTITY_TYPE__Update) => {
  return {
    ...data,
    updatedAt: new Date().toISOString(),
  };
};

// ✅ BRIDGE PATTERN: Schema constants
export const __ENTITY_TYPE__SCHEMA_CONSTANTS = {
  MAX_NAME_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_SEARCH_LENGTH: 100,
  MAX_FIELDS_LENGTH: 500,
  MAX_BULK_OPERATION_SIZE: 100,
  DEFAULT_PAGE_SIZE: 30,
  MAX_PAGE_SIZE: 50,
  VALID_STATUSES: ['active', 'inactive', 'pending', 'archived'] as const,
  VALID_SORT_FIELDS: ['name', 'status', 'createdAt', 'updatedAt'] as const,
  VALID_SORT_ORDERS: ['asc', 'desc'] as const,
} as const;

// ✅ BRIDGE PATTERN: Schema error messages
export const __ENTITY_TYPE__ERROR_MESSAGES = {
  ID_REQUIRED: 'ID is required',
  NAME_REQUIRED: 'Name is required',
  NAME_TOO_LONG: 'Name must be less than 255 characters',
  DESCRIPTION_TOO_LONG: 'Description must be less than 1000 characters',
  SEARCH_TOO_LONG: 'Search term must be less than 100 characters',
  FIELDS_TOO_LONG: 'Fields string too long',
  PAGE_MIN: 'Page must be at least 1',
  LIMIT_MIN: 'Limit must be at least 1',
  LIMIT_MAX: 'Limit cannot exceed 50',
  BULK_SIZE_MAX: 'Cannot operate on more than 100 items at once',
  BULK_SIZE_MIN: 'At least one item is required',
  INVALID_STATUS: 'Invalid status value',
  INVALID_SORT_FIELD: 'Invalid sort field',
  INVALID_SORT_ORDER: 'Invalid sort order',
  // Add entity-specific error messages here
  // INVALID_EMAIL: 'Invalid email format',
  // INVALID_PHONE: 'Invalid phone number format',
  // INVALID_ZIP_CODE: 'Invalid ZIP code format',
} as const;



