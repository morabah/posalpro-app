/**
 * PosalPro MVP2 - Consolidated Product Schemas
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 *
 * ✅ CONSOLIDATED: All product schemas in one location
 * ✅ ALIGNS: API route schemas for consistent frontend-backend integration
 * ✅ FOLLOWS: Feature-based organization pattern
 */

import { RuleKind } from '@prisma/client';
import { z } from 'zod';

// ====================
// Base Schemas (Reusable)
// ====================

export const ProductRelationshipTypeSchema = z.enum([
  'REQUIRES',
  'RECOMMENDS',
  'INCOMPATIBLE',
  'ALTERNATIVE',
  'OPTIONAL',
]);

export const ProductStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);

// Datasheet path validation schema
export const DatasheetPathSchema = z
  .string()
  .max(500, 'Datasheet path must be 500 characters or less')
  .optional()
  .nullable();

// ====================
// Core Product Schemas
// ====================

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  currency: z.string().default('USD'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.union([z.array(z.string()), z.undefined()]).transform(val => val || []),
  tags: z.union([z.array(z.string()), z.undefined()]).transform(val => val || []),
  attributes: z.record(z.unknown()).optional(),
  images: z.union([z.array(z.string()), z.undefined()]).transform(val => val || []),
  datasheetPath: z.string().nullable().optional(), // Optional path to product datasheet (network or local)
  stockQuantity: z.number().optional().default(0),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional().default('ACTIVE'),
  isActive: z.boolean().default(true),
  version: z.number().default(1),
  usageAnalytics: z.record(z.unknown()).optional(),
  userStoryMappings: z.union([z.array(z.string()), z.undefined()]).transform(val => val || []),
  createdAt: z
    .union([z.string(), z.date()])
    .transform(val => (val instanceof Date ? val.toISOString() : val)),
  updatedAt: z
    .union([z.string(), z.date()])
    .transform(val => (val instanceof Date ? val.toISOString() : val)),
});

export const ProductCreateSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

// ====================
// Product Relationship Schemas
// ====================

export const ProductRelationshipSchema = z.object({
  id: z.string(),
  sourceProductId: z.string(),
  targetProductId: z.string(),
  type: ProductRelationshipTypeSchema,
  quantity: z.number().optional(),
  condition: z.record(z.unknown()).optional(),
  validationHistory: z.record(z.unknown()).optional(),
  performanceImpact: z.record(z.unknown()).optional(),
  createdBy: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProductRelationshipCreateSchema = z.object({
  targetProductId: z.string(),
  type: ProductRelationshipTypeSchema,
  quantity: z.number().optional(),
  condition: z.record(z.unknown()).optional(),
});

export const ProductWithRelationshipsSchema = ProductSchema.extend({
  relationships: z.array(
    ProductRelationshipSchema.extend({
      targetProduct: ProductSchema,
    })
  ),
  relatedFrom: z.array(
    ProductRelationshipSchema.extend({
      sourceProduct: ProductSchema,
    })
  ),
});

// ====================
// Product Configuration Schemas
// ====================

export const ProductAttributeSchema = z.object({
  name: z.string(),
  value: z.unknown(),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  required: z.boolean().default(false),
  validation: z.record(z.unknown()).optional(),
});

export const ProductOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().optional(),
  isDefault: z.boolean().default(false),
  dependencies: z.array(z.string()).optional(),
});

export const ProductConfigurationSchema = z.object({
  attributes: z.array(ProductAttributeSchema),
  options: z.array(ProductOptionSchema),
  validationRules: z.array(z.record(z.unknown())),
});

// ====================
// Product Validation Schemas
// ====================

export const ValidationConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
  value: z.unknown(),
});

export const ValidationActionSchema = z.object({
  type: z.enum(['error', 'warning', 'info']),
  message: z.string(),
  field: z.string().optional(),
});

export const ProductValidationRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  conditions: z.array(ValidationConditionSchema),
  actions: z.array(ValidationActionSchema),
  isActive: z.boolean().default(true),
});

export const ProductLicenseValidationSchema = z.object({
  licenseKey: z.string(),
  productId: z.string(),
  validationRules: z.array(ProductValidationRuleSchema),
  expiresAt: z.string().datetime().optional(),
});

// ====================
// Product Analytics Schemas
// ====================

export const ProductUsageAnalyticsSchema = z.object({
  productId: z.string(),
  usageCount: z.number(),
  lastUsed: z.string().datetime(),
  usagePattern: z.record(z.unknown()),
  performanceMetrics: z.record(z.unknown()),
});

export const ProductResourceSchema = z.object({
  id: z.string(),
  productId: z.string(),
  type: z.enum(['documentation', 'tutorial', 'example', 'template']),
  url: z.string().url(),
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()),
});

// ====================
// Product Search and Query Schemas
// ====================

export const ProductQuerySchema = z.object({
  search: z.string().trim().default(''),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
  sortBy: z.enum(['createdAt', 'name', 'price', 'isActive', 'datasheetPath']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  category: z.string().optional(),
  isActive: z.preprocess(val => {
    if (typeof val === 'string') {
      return val.toLowerCase() === 'true';
    }
    return val;
  }, z.boolean().optional()),
  hasDatasheet: z.preprocess(val => {
    if (typeof val === 'string') {
      return val.toLowerCase() === 'true';
    }
    return val;
  }, z.boolean().optional()), // Filter products that have a datasheet
});

export const ProductSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().min(1).max(100).default(20),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priceRange: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  hasDatasheet: z.boolean().optional(), // Search for products with/without datasheets
});

// ====================
// Product List and Response Schemas
// ====================

export const ProductListSchema = z.object({
  items: z.array(ProductSchema),
  nextCursor: z.string().nullable(),
});

export const ProductSearchResponseSchema = z.object({
  items: z.array(ProductSchema),
  total: z.number(),
  nextCursor: z.string().nullable(),
});

// ====================
// Bulk Operation Schemas
// ====================

export const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
});

export const ProductBulkOperationSchema = z.object({
  operation: z.enum(['activate', 'deactivate', 'archive', 'delete']),
  productIds: z.array(z.string()).min(1),
  options: z.record(z.unknown()).optional(),
});

// ====================
// Product License and Dependency Schemas
// ====================

export const LicenseDependencySchema = z.object({
  productId: z.string(),
  licenseType: z.enum(['perpetual', 'subscription', 'trial']),
  dependencies: z.array(z.string()),
  restrictions: z.array(z.string()),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime().optional(),
});

// ====================
// Type Exports
// ====================

export type Product = z.infer<typeof ProductSchema>;
export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;
export type ProductRelationship = z.infer<typeof ProductRelationshipSchema>;
export type ProductRelationshipCreate = z.infer<typeof ProductRelationshipCreateSchema>;
export type ProductWithRelationships = z.infer<typeof ProductWithRelationshipsSchema>;
export type ProductList = z.infer<typeof ProductListSchema>;
export type ProductQuery = z.infer<typeof ProductQuerySchema>;
export type ProductSearch = z.infer<typeof ProductSearchSchema>;
export type ProductSearchResponse = z.infer<typeof ProductSearchResponseSchema>;
export type ProductConfiguration = z.infer<typeof ProductConfigurationSchema>;
export type ProductValidationRule = z.infer<typeof ProductValidationRuleSchema>;
export type ProductUsageAnalytics = z.infer<typeof ProductUsageAnalyticsSchema>;
export type ProductBulkOperation = z.infer<typeof ProductBulkOperationSchema>;
export type LicenseDependency = z.infer<typeof LicenseDependencySchema>;
export type ProductRelationshipType = z.infer<typeof ProductRelationshipTypeSchema>;
export type DatasheetPath = z.infer<typeof DatasheetPathSchema>;

// ====================
// API‑Specific Schemas
// ====================

// Search schema used by /api/products/search (keeps route param names/values)
export const ProductSearchApiSchema = z.object({
  search: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().min(1).max(100).default(50),
  category: z.string().optional(),
  tags: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

// Search schema used by /api/products/products_new/search
export const ProductQuickSearchApiSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
  limit: z.coerce.number().min(1).max(50).default(10),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Bulk delete schema alias for products
export const ProductBulkDeleteSchema = BulkDeleteSchema;

// SKU validation query schema
export const SKUValidationSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be 50 characters or less'),
  excludeId: z.string().optional(),
});

// Product relationship simulation body schema
export const ProductRelationshipsSimulateSchema = z.object({
  skus: z.array(z.string()).min(1, 'At least one SKU is required'),
  mode: z.enum(['validate', 'simulate']).default('validate'),
  attributes: z.record(z.any()).optional(),
});

// ====================
// Product Relationship Rules Schema
// ====================

export const RuleSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  ruleType: z.nativeEnum(RuleKind),
  rule: z.any(),
  precedence: z.number().int().min(0).optional(),
  scope: z.any().optional(),
  explain: z.string().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
});

// ====================
// Product Validation Schema
// ====================

export const validateRequestSchema = z.object({
  configuration: z.object({
    id: z.string(),
    proposalId: z.string().optional(),
    products: z.array(
      z.object({
        productId: z.string(),
        quantity: z.number().positive(),
        settings: z.record(z.unknown()).optional().default({}),
        customizations: z.record(z.unknown()).optional().default({}),
        dependencies: z.array(z.string()).optional().default([]),
        conflicts: z.array(z.string()).optional().default([]),
      })
    ),
    globalSettings: z.record(z.unknown()).optional().default({}),
    relationships: z
      .array(
        z.object({
          id: z.string(),
          productAId: z.string(),
          productBId: z.string(),
          type: z.enum(['requires', 'conflicts', 'enhances', 'replaces']),
          strength: z.number().min(0).max(1).optional().default(1.0),
          conditions: z.record(z.unknown()).optional(),
        })
      )
      .optional()
      .default([]),
    metadata: z.object({
      version: z.string(),
      createdAt: z.string().transform(str => new Date(str)),
      updatedAt: z.string().transform(str => new Date(str)),
      createdBy: z.string(),
      validatedAt: z
        .string()
        .transform(str => new Date(str))
        .optional(),
      validationVersion: z.string().optional(),
    }),
  }),
  userId: z.string(),
  environment: z.enum(['development', 'staging', 'production']).optional().default('development'),
});
