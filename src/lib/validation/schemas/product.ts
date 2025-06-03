/**
 * PosalPro MVP2 - Product Entity Validation Schemas
 * Product management, relationships, and validation rules
 * Based on PRODUCT_MANAGEMENT_SCREEN.md and DATA_MODEL.md specifications
 * Supports hypothesis H8 (Technical Configuration Validation)
 */

import { z } from 'zod';
import { baseEntitySchema, urlSchema, validationUtils } from './shared';

/**
 * Product category validation schema
 */
export const productCategorySchema = z.enum([
  'software',
  'hardware',
  'service',
  'license',
  'support',
  'consulting',
  'training',
  'integration',
  'maintenance',
  'custom',
]);

/**
 * Product status validation schema
 */
export const productStatusSchema = z.enum([
  'active',
  'inactive',
  'discontinued',
  'pending_approval',
  'beta',
  'draft',
]);

/**
 * Price model validation schema
 */
export const priceModelSchema = z.enum([
  'fixed',
  'usage_based',
  'subscription',
  'tiered',
  'custom',
  'quote_required',
]);

/**
 * Product relationship type validation schema
 */
export const relationshipTypeSchema = z.enum([
  'requires',
  'recommends',
  'incompatible',
  'alternative',
  'optional',
  'bundle',
  'upgrade',
]);

/**
 * Validation condition operator schema
 */
export const conditionOperatorSchema = z.enum([
  'equals',
  'notEquals',
  'contains',
  'greaterThan',
  'lessThan',
  'exists',
  'notExists',
]);

/**
 * Product attribute validation schema
 */
export const productAttributeSchema = z.object({
  name: validationUtils.stringWithLength(1, 100, 'Attribute name'),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  required: z.boolean().default(false),
  description: z.string().optional(),
});

/**
 * Product option validation schema
 */
export const productOptionSchema = z.object({
  id: z.string().uuid(),
  name: validationUtils.stringWithLength(1, 100, 'Option name'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  type: z.enum(['boolean', 'select', 'multiselect', 'text', 'number']),
  values: z.array(z.string()).optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  required: z.boolean().default(false),
  priceModifier: z.number().default(0),
  validationRules: z.array(z.string()).optional(),
});

/**
 * Product resource validation schema
 */
export const productResourceSchema = z.object({
  id: z.string().uuid(),
  name: validationUtils.stringWithLength(1, 200, 'Resource name'),
  type: z.enum(['document', 'image', 'video', 'link', 'specification']),
  url: urlSchema,
  description: z.string().optional(),
  size: z.number().int().min(0).optional(),
  mimeType: z.string().optional(),
  isPublic: z.boolean().default(false),
});

/**
 * Relationship condition validation schema
 */
export const relationshipConditionSchema = z.object({
  rules: z.array(
    z.object({
      attribute: validationUtils.stringWithLength(1, 100, 'Condition attribute'),
      operator: conditionOperatorSchema,
      value: z.union([z.string(), z.number(), z.boolean()]),
    })
  ),
  operator: z.enum(['and', 'or']).default('and'),
});

/**
 * Product relationship validation schema
 */
export const productRelationshipSchema = z.object({
  id: z.string().uuid(),
  sourceProductId: z.string().uuid(),
  targetProductId: z.string().uuid(),
  type: relationshipTypeSchema,
  quantity: z.number().int().min(1).optional(),
  condition: relationshipConditionSchema.optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isActive: z.boolean().default(true),
  createdBy: z.string().uuid(),
});

/**
 * Validation rule condition validation schema
 */
export const validationConditionSchema = z.object({
  id: z.string().uuid(),
  attribute: validationUtils.stringWithLength(1, 100, 'Validation attribute'),
  operator: conditionOperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean()]),
  logicalOperator: z.enum(['and', 'or']).optional(),
});

/**
 * Validation action validation schema
 */
export const validationActionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['block', 'warn', 'fix', 'notify']),
  message: validationUtils.stringWithLength(1, 500, 'Validation message'),
  fixSuggestion: z
    .string()
    .max(1000, 'Fix suggestion must be less than 1000 characters')
    .optional(),
  autoFix: z.boolean().default(false),
  notificationTargets: z.array(z.string().uuid()).optional(),
});

/**
 * Product validation rule validation schema
 */
export const productValidationRuleSchema = z.object({
  id: z.string().uuid(),
  name: validationUtils.stringWithLength(1, 200, 'Validation rule name'),
  description: z.string().max(1000, 'Description must be less than 1000 characters'),
  category: z.enum(['compatibility', 'license', 'configuration', 'compliance', 'custom']),
  ruleType: z.enum(['compatibility', 'license', 'configuration', 'compliance', 'custom']),
  conditions: z.array(validationConditionSchema).min(1, 'At least one condition is required'),
  actions: z.array(validationActionSchema).min(1, 'At least one action is required'),
  severity: z.enum(['error', 'warning', 'info']),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(1).max(10).default(5),
  createdBy: z.string().uuid(),
});

/**
 * Product usage analytics validation schema
 */
export const productUsageAnalyticsSchema = z.object({
  productId: z.string().uuid(),
  totalUsage: z.number().int().min(0),
  successRate: z.number().min(0).max(100),
  averageConfigurationTime: z.number().min(0),
  validationFailures: z.number().int().min(0),
  relationshipIssues: z.number().int().min(0),
  hypothesesSupported: z.array(z.string()),
  performanceMetrics: z.record(z.string(), z.number()),
  lastUpdated: z.date(),
});

/**
 * License dependency validation schema
 */
export const licenseDependencySchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  licenseType: z.enum(['commercial', 'open_source', 'proprietary', 'subscription', 'perpetual']),
  licenseName: validationUtils.stringWithLength(1, 200, 'License name'),
  version: z.string().optional(),
  quantity: z.number().int().min(1).optional(),
  isRequired: z.boolean(),
  cost: z.number().min(0).optional(),
  vendor: z.string().optional(),
  expirationDate: z.date().optional(),
  restrictions: z.array(z.string()).optional(),
});

/**
 * Core product validation schema
 * Based on DATA_MODEL.md Product interface
 */
export const productSchema = baseEntitySchema.extend({
  // Basic Information
  name: validationUtils.stringWithLength(1, 200, 'Product name'),
  description: validationUtils.stringWithLength(10, 2000, 'Product description'),
  sku: validationUtils
    .stringWithLength(3, 50, 'Product SKU')
    .regex(/^[A-Z0-9-_]+$/i, 'SKU must contain only letters, numbers, hyphens, and underscores'),

  // Pricing
  price: z.number().min(0, 'Price must be non-negative'),
  currency: z.string().length(3, 'Currency must be a 3-letter ISO code').default('USD'),
  priceModel: priceModelSchema,

  // Categorization
  category: z.array(productCategorySchema).min(1, 'At least one category is required'),
  subCategory: z.string().max(100, 'Sub-category must be less than 100 characters').optional(),
  tags: validationUtils.arrayWithLength(z.string().min(1), 0, 50, 'Product tags'),

  // Configuration
  attributes: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
  ),
  options: z.array(productOptionSchema).optional(),

  // Resources
  images: z.array(urlSchema).max(20, 'Maximum 20 images allowed'),
  resources: z.array(productResourceSchema).optional(),

  // Status and Lifecycle
  status: productStatusSchema,
  version: z.number().min(1, 'Version must be at least 1').default(1),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  isFeatured: z.boolean().default(false),

  // Dependencies and Licensing
  licenseDependencies: z.array(licenseDependencySchema).optional(),

  // Business Rules
  minimumQuantity: z.number().int().min(1).default(1),
  maximumQuantity: z.number().int().min(1).optional(),
  availabilityStatus: z
    .enum(['in_stock', 'out_of_stock', 'discontinued', 'pre_order'])
    .default('in_stock'),
  leadTime: z.number().int().min(0).optional(), // in days

  // Client-specific settings
  clientSpecificPricing: z.boolean().default(false),
  restrictedClients: z.array(z.string().uuid()).optional(),
  approvedClients: z.array(z.string().uuid()).optional(),

  // Analytics and Performance (supporting H8 hypothesis)
  usageAnalytics: productUsageAnalyticsSchema.optional(),
  userStoryMappings: z.array(z.string()).optional(),

  // SEO and Search
  searchKeywords: z.array(z.string()).max(100, 'Maximum 100 search keywords allowed').optional(),
  seoDescription: z
    .string()
    .max(300, 'SEO description must be less than 300 characters')
    .optional(),
});

/**
 * Product relationships validation schema
 */
export const productWithRelationshipsSchema = productSchema.extend({
  relationships: z.array(productRelationshipSchema).optional(),
  validationRules: z.array(productValidationRuleSchema).optional(),
});

/**
 * Product creation validation schema
 */
export const createProductSchema = productSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  usageAnalytics: true,
});

/**
 * Product update validation schema
 */
export const updateProductSchema = productSchema.partial().extend({
  id: z.string().uuid(),
});

/**
 * Product search and filtering validation schema
 */
export const productSearchSchema = z.object({
  query: z.string().optional(),
  category: z.array(productCategorySchema).optional(),
  status: z.array(productStatusSchema).optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  clientId: z.string().uuid().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'price', 'category', 'createdAt', 'updatedAt', 'usage']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Product configuration validation schema
 */
export const productConfigurationSchema = z.object({
  productId: z.string().uuid(),
  selectedOptions: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
  ),
  quantity: z.number().int().min(1),
  customizations: z.array(z.string()).optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  clientId: z.string().uuid().optional(),
  validationOverrides: z.array(z.string()).optional(), // Override validation rule IDs
});

/**
 * Product license validation schema for H8 hypothesis
 */
export const productLicenseValidationSchema = z.object({
  productId: z.string().uuid(),
  requiredLicenses: z.array(licenseDependencySchema),
  availableLicenses: z.array(z.string().uuid()),
  conflicts: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  validationTime: z.number().min(0), // milliseconds
  autoResolution: z.boolean().default(false),
});

/**
 * Product bulk operations validation schema
 */
export const productBulkOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete', 'activate', 'deactivate']),
  productIds: z.array(z.string().uuid()).min(1, 'At least one product ID is required'),
  data: z.record(z.string(), z.any()).optional(),
  validateFirst: z.boolean().default(true),
  continueOnError: z.boolean().default(false),
});

/**
 * Type exports
 */
export type Product = z.infer<typeof productSchema>;
export type ProductWithRelationships = z.infer<typeof productWithRelationshipsSchema>;
export type ProductCategory = z.infer<typeof productCategorySchema>;
export type ProductStatus = z.infer<typeof productStatusSchema>;
export type PriceModel = z.infer<typeof priceModelSchema>;
export type ProductRelationship = z.infer<typeof productRelationshipSchema>;
export type ProductValidationRule = z.infer<typeof productValidationRuleSchema>;
export type ProductUsageAnalytics = z.infer<typeof productUsageAnalyticsSchema>;
export type ProductOption = z.infer<typeof productOptionSchema>;
export type ProductResource = z.infer<typeof productResourceSchema>;
export type LicenseDependency = z.infer<typeof licenseDependencySchema>;
export type CreateProductData = z.infer<typeof createProductSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;
export type ProductSearchOptions = z.infer<typeof productSearchSchema>;
export type ProductConfiguration = z.infer<typeof productConfigurationSchema>;
export type ProductLicenseValidation = z.infer<typeof productLicenseValidationSchema>;
export type ProductBulkOperation = z.infer<typeof productBulkOperationSchema>;

/**
 * Component Traceability Matrix for H8 hypothesis validation
 */
export const PRODUCT_COMPONENT_MAPPING = {
  userStories: ['US-3.2', 'US-3.1', 'US-1.2'],
  acceptanceCriteria: ['AC-3.2.1', 'AC-3.2.2', 'AC-3.2.3', 'AC-3.2.4'],
  methods: [
    'autoDetectLicenses()',
    'checkDependencies()',
    'calculateImpact()',
    'validateConfiguration()',
    'manageDependencies()',
    'trackAvailability()',
  ],
  hypotheses: ['H8'],
  testCases: ['TC-H8-002', 'TC-H8-001', 'TC-H1-002'],
} as const;
