/**
 * Infinite Products Hook - Re-export from main products hook
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 */

export { useInfiniteProductsMigrated as useInfiniteProducts } from './useProducts';

// Re-export types for backward compatibility
export type { Product, ProductCreate, ProductUpdate } from '@/services/productService';
