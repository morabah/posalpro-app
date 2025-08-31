/**
 * PosalPro MVP2 - Products Hooks Index
 * Centralized exports for product-related React Query hooks
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
  useUpdateProduct,
} from './useProducts';
