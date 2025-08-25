// Hook Template for Migration from Bridge Pattern
// Replace __ENTITY__ with actual entity name (e.g., Customer, Product, Proposal)

import { __ENTITY__Service, Update__ENTITY__Data } from '@/services/__RESOURCE__Service';
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// ====================
// Stable Query Keys (Normalized to Primitives)
// ====================

export const qk = {
  __RESOURCE__: {
    all: ['__RESOURCE__'] as const,
    list: (s: string, l: number, sb: 'createdAt' | 'name', so: 'asc' | 'desc') =>
      ['__RESOURCE__', 'list', s, l, sb, so] as const,
    byId: (id: string) => ['__RESOURCE__', 'byId', id] as const,
    stats: () => ['__RESOURCE__', 'stats'] as const,
    search: (query: string, filters?: Record<string, any>) =>
      ['__RESOURCE__', 'search', query, filters] as const,
  },
};

// ====================
// Query Hooks
// ====================

/**
 * Hook to fetch list of entities with infinite scroll
 */
export function useInfinite__ENTITY__s({
  search = '',
  limit = 20,
  sortBy = 'createdAt',
  sortOrder = 'desc',
} = {}) {
  return useInfiniteQuery({
    queryKey: qk.__RESOURCE__.list(search, limit, sortBy as any, sortOrder as any),
    queryFn: ({ pageParam }) =>
      __ENTITY__Service.get__ENTITY__s({
        search,
        limit,
        sortBy,
        sortOrder,
        cursor: pageParam,
      }),
    getNextPageParam: last => last.nextCursor,
    staleTime: 60_000,
    keepPreviousData: true,
  });
}

/**
 * Hook to fetch single entity by ID
 */
export function use__ENTITY__(id: string) {
  return useQuery({
    queryKey: qk.__RESOURCE__.byId(id),
    queryFn: () => __ENTITY__Service.get__ENTITY__(id),
    enabled: !!id,
    staleTime: 60_000,
    gcTime: 300_000,
  });
}

/**
 * Hook to fetch entity statistics
 */
export function use__ENTITY__Stats() {
  return useQuery({
    queryKey: qk.__RESOURCE__.stats(),
    queryFn: () => __ENTITY__Service.get__ENTITY__Stats(),
    staleTime: 300_000, // 5 minutes for stats
    gcTime: 600_000, // 10 minutes
  });
}

/**
 * Hook to search entities
 */
export function use__ENTITY__Search(query: string, filters?: Record<string, any>) {
  return useQuery({
    queryKey: qk.__RESOURCE__.search(query, filters),
    queryFn: () => __ENTITY__Service.search__ENTITY__s(query, filters),
    enabled: !!query && query.length >= 2, // Only search with 2+ characters
    staleTime: 60_000,
    gcTime: 300_000,
  });
}

// ====================
// Mutation Hooks
// ====================

/**
 * Hook to create new entity
 */
export function useCreate__ENTITY__() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: __ENTITY__Service.create__ENTITY__,
    onSuccess: new__ENTITY__ => {
      // Invalidate and refetch lists
      queryClient.invalidateQueries({ queryKey: qk.__RESOURCE__.all });
    },
  });
}

/**
 * Hook to update existing entity
 */
export function useUpdate__ENTITY__() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Update__ENTITY__Data }) =>
      __ENTITY__Service.update__ENTITY__(id, data),
    onSuccess: (updated__ENTITY__, { id }) => {
      // Invalidate and refetch lists
      queryClient.invalidateQueries({ queryKey: qk.__RESOURCE__.all });

      // Update entity in cache
      queryClient.setQueryData(qk.__RESOURCE__.byId(id), updated__ENTITY__);
    },
  });
}

/**
 * Hook to delete entity
 */
export function useDelete__ENTITY__() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: __ENTITY__Service.delete__ENTITY__,
    onSuccess: (_, deletedId) => {
      // Invalidate and refetch lists
      queryClient.invalidateQueries({ queryKey: qk.__RESOURCE__.all });

      // Remove entity from cache
      queryClient.removeQueries({ queryKey: qk.__RESOURCE__.byId(deletedId) });
    },
  });
}

/**
 * Hook to bulk delete entities
 */
export function useDelete__ENTITY__sBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => __ENTITY__Service.delete__ENTITY__sBulk(ids),
    onSuccess: () => {
      // Invalidate all queries
      queryClient.invalidateQueries({ queryKey: qk.__RESOURCE__.all });
    },
  });
}

// ====================
// Utility Hooks
// ====================

/**
 * Hook to get entity by ID with fallback to list search
 */
export function use__ENTITY__ByIdOrSearch(id?: string, searchTerm?: string) {
  const entityQuery = use__ENTITY__(id || '');
  const searchQuery = use__ENTITY__Search(searchTerm || '');

  if (id) {
    return entityQuery;
  }

  if (searchTerm) {
    return searchQuery;
  }

  return {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
  };
}

/**
 * Hook to get multiple entities by IDs using useQueries
 */
export function use__ENTITY__sByIds(ids: string[]) {
  const results = useQueries({
    queries: ids.map(id => ({
      queryKey: qk.__RESOURCE__.byId(id),
      queryFn: () => __ENTITY__Service.get__ENTITY__(id),
      enabled: !!id,
      staleTime: 60_000,
    })),
  });

  return {
    data: results.map(r => r.data).filter(Boolean),
    isLoading: results.some(r => r.isLoading),
    isError: results.some(r => r.isError),
  };
}

// ====================
// Export Default
// ====================

export {
  use__ENTITY__,
  use__ENTITY__ByIdOrSearch,
  use__ENTITY__sByIds,
  use__ENTITY__Search,
  use__ENTITY__Stats,
  useCreate__ENTITY__,
  useDelete__ENTITY__,
  useDelete__ENTITY__sBulk,
  useInfinite__ENTITY__s,
  useUpdate__ENTITY__,
};
