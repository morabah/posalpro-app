/**
 * PosalPro MVP2 - Products Hooks Index
 * Centralized exports for product-related React Query hooks
 * All hooks are now implemented locally within the features module
 */

// Export local product hook implementations
export {
  useInfiniteProductsMigrated,
  useProductMigrated,
  useProductWithRelationshipsMigrated,
  useProductStatsMigrated,
  useProductSearchMigrated,
  useProductsByIds,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useBulkDeleteProducts,
  useCreateProductRelationshipMigrated,
  useDeleteProductRelationshipMigrated,
  useProductCategories,
  useProductTags,
  useProductCategoriesMigrated,
  useProductStatusOptionsMigrated,
  useRelationshipTypeOptionsMigrated,
} from './useProducts';
