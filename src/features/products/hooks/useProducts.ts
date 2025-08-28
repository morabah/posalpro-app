/**
 * PosalPro MVP2 - Products React Query Hooks
 * Modern data fetching with cursor-based pagination
 * Component Traceability: US-4.1, H5
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { qk } from '../keys';
import { ProductListSchema, ProductQuerySchema, type ProductQuery } from '../schemas';

/**
 * Hook for fetching products with infinite scroll pagination
 * Uses cursor-based pagination for optimal performance
 */
export function useProducts(params: Partial<ProductQuery> = {}) {
  const validatedParams = ProductQuerySchema.parse(params);

  return useInfiniteQuery({
    queryKey: qk.products.list(
      validatedParams.search,
      validatedParams.limit,
      validatedParams.sortBy,
      validatedParams.sortOrder,
      validatedParams.category,
      validatedParams.isActive
    ),
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const queryParams = new URLSearchParams({
        search: validatedParams.search,
        limit: validatedParams.limit.toString(),
        sortBy: validatedParams.sortBy,
        sortOrder: validatedParams.sortOrder,
        ...(pageParam && { cursor: pageParam }),
        ...(validatedParams.category && { category: validatedParams.category }),
        ...(validatedParams.isActive !== undefined && {
          isActive: validatedParams.isActive.toString(),
        }),
      });

      const response = await fetch(`/api/products?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();

      // Validate response against schema
      return ProductListSchema.parse(data.data);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
    staleTime: 30000, // 30 seconds
    gcTime: 120000, // 2 minutes
  });
}

/**
 * Hook for fetching a single product by ID
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: qk.products.byId(id),
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!id,
    staleTime: 30000,
    gcTime: 120000,
  });
}
