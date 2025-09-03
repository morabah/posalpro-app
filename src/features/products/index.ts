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
  Product,
  ProductCreate,
  ProductUpdate,
  ProductQuery,
  ProductRelationship,
  ProductRelationshipCreate,
  ProductWithRelationships,
  ProductList,
  ProductSearch,
  ProductSearchResponse,
  ProductConfiguration,
  ProductValidationRule,
  ProductUsageAnalytics,
  ProductBulkOperation,
  LicenseDependency,
  ProductRelationshipType,
} from './schemas';

export {
  ProductCreateSchema,
  ProductUpdateSchema,
  ProductQuerySchema,
  ProductSchema,
  ProductRelationshipSchema,
  ProductRelationshipCreateSchema,
  ProductWithRelationshipsSchema,
  ProductListSchema,
  ProductSearchSchema,
  ProductSearchResponseSchema,
  ProductConfigurationSchema,
  ProductValidationRuleSchema,
  ProductUsageAnalyticsSchema,
  ProductBulkOperationSchema,
  LicenseDependencySchema,
  ProductRelationshipTypeSchema,
  ProductSearchApiSchema,
  ProductQuickSearchApiSchema,
  ProductBulkDeleteSchema,
  SKUValidationSchema,
  ProductRelationshipsSimulateSchema,
  RuleSchema,
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
} from './hooks';
