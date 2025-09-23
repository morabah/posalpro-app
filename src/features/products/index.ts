/**
 * Products Feature Module
 * User Story: US-2.1 (Product Management), US-2.2 (Product Catalog)
 * Hypothesis: H2 (Product Performance)
 *
 * ✅ SINGLE FEATURE EXPORT FILE - Follows CORE_REQUIREMENTS.md standards
 * ✅ CENTRALIZED EXPORTS - All product-related functionality in one place
 * ✅ CLEAN ARCHITECTURE - Separation of concerns with hooks, schemas, and keys
 */

// ====================
// Feature Keys
// ====================

export { qk as productKeys } from './keys';

// ====================
// Feature Schemas
// ====================

export type {
  LicenseDependency,
  Product,
  ProductBulkOperation,
  ProductConfiguration,
  ProductCreate,
  ProductList,
  ProductQuery,
  ProductRelationship,
  ProductRelationshipCreate,
  ProductRelationshipType,
  ProductSearch,
  ProductSearchResponse,
  ProductUpdate,
  ProductUsageAnalytics,
  ProductValidationRule,
  ProductWithRelationships,
} from './schemas';

export {
  LicenseDependencySchema,
  ProductBulkDeleteSchema,
  ProductBulkOperationSchema,
  ProductConfigurationSchema,
  ProductCreateSchema,
  ProductListSchema,
  ProductQuerySchema,
  ProductQuickSearchApiSchema,
  ProductRelationshipCreateSchema,
  ProductRelationshipSchema,
  ProductRelationshipsSimulateSchema,
  ProductRelationshipTypeSchema,
  ProductSchema,
  ProductSearchApiSchema,
  ProductSearchResponseSchema,
  ProductSearchSchema,
  ProductUpdateSchema,
  ProductUsageAnalyticsSchema,
  ProductValidationRuleSchema,
  ProductWithRelationshipsSchema,
  RuleSchema,
  SKUValidationSchema,
  validateRequestSchema,
} from './schemas';

// ====================
// Feature Hooks
// ====================

export {
  useBulkDeleteProducts,
  useCreateProduct,
  useCreateProductRelationshipMigrated,
  useDeleteProduct,
  useDeleteProductRelationshipMigrated,
  useInfiniteProductsMigrated,
  useProductCategories,
  useProductCategoriesMigrated,
  useProductMigrated,
  useProductsByIds,
  useProductSearchMigrated,
  useProductStatsMigrated,
  useProductStatusOptionsMigrated,
  useProductTags,
  useProductWithRelationshipsMigrated,
  useRelationshipTypeOptionsMigrated,
  useUpdateProduct,
  useProductBrandOptions,
} from './hooks';

// Advanced caching and enhanced hooks
export { useProductCache } from './hooks/useProductCache';
export { useProductEnhanced } from './hooks/useProductEnhanced';
