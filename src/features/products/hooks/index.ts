/**
 * PosalPro MVP2 - Products Hooks Index
 * Centralized exports for product-related React Query hooks
 * Standardized structure for consistency across feature modules
 * All hooks are now implemented locally within the features module
 */

// Export local product hook implementations
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
  useUnifiedProductSelectionData,
  useUpdateProduct,
} from './useProducts';
