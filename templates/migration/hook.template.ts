// Hook Template for Migration from Bridge Pattern
// Replace __ENTITY__ with actual entity name (e.g., Customer, Product, Proposal)
// User Story: __USER_STORY__ (e.g., US-1.1)
// Hypothesis: __HYPOTHESIS__ (e.g., H1)
//
// ✅ FOLLOWS: MIGRATION_LESSONS.md - Hook patterns with centralized query keys
// ✅ FOLLOWS: CORE_REQUIREMENTS.md - React Query patterns with proper caching
// ✅ ALIGNS: Analytics tracking with user story and hypothesis validation
// ✅ IMPLEMENTS: Performance monitoring and structured logging

import { useHttpClient } from '@/hooks/useHttpClient';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { __RESOURCE__Service, type Update__ENTITY__Data } from '@/services/__RESOURCE__Service';
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// ====================
// Centralized Query Keys from features directory
// ====================

import { qk } from '@/features/__RESOURCE__/keys';

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
  // TODO: Add domain-specific parameters as needed
  // category,
  // status,
} = {}) {
  const { get } = useHttpClient();

  return useInfiniteQuery({
    queryKey: qk.__RESOURCE__.list(search, limit, sortBy as any, sortOrder as any),
    queryFn: async ({ pageParam }) => {
      logDebug('Fetching __RESOURCE__ with cursor pagination', {
        component: 'useInfinite__ENTITY__s',
        operation: 'queryFn',
        search,
        limit,
        sortBy,
        sortOrder,
        cursor: pageParam,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (limit) params.append('limit', limit.toString());
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      if (pageParam) params.append('cursor', pageParam);

      const response = await get<{ items: any[]; nextCursor: string | null }>(
        `/api/__RESOURCE__?${params.toString()}`
      );

      const loadTime = Date.now() - start;

      logInfo('__RESOURCE__ fetched successfully', {
        component: 'useInfinite__ENTITY__s',
        operation: 'queryFn',
        count: response.items?.length || 0,
        hasNextPage: !!response.nextCursor,
        loadTime,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      return response;
    },
    initialPageParam: null as string | null,
    getNextPageParam: lastPage => lastPage.nextCursor || undefined,
    staleTime: 30000, // 30 seconds
    gcTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/**
 * Hook to fetch single entity by ID
 */
export function use__ENTITY__(id: string) {
  const { get } = useHttpClient();

  return useQuery({
    queryKey: qk.__RESOURCE__.byId(id),
    queryFn: async () => {
      logDebug('Fetching single __RESOURCE__', {
        component: 'use__ENTITY__',
        operation: 'queryFn',
        __RESOURCE__Id: id,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      const response = await get(`/api/__RESOURCE__/${id}`);
      return response;
    },
    enabled: !!id,
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/**
 * Hook to fetch entity statistics
 */
export function use__ENTITY__Stats() {
  const { get } = useHttpClient();

  return useQuery({
    queryKey: qk.__RESOURCE__.stats(),
    queryFn: async () => {
      logDebug('Fetching __RESOURCE__ stats', {
        component: 'use__ENTITY__Stats',
        operation: 'queryFn',
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      const response = await get('/api/__RESOURCE__/stats');
      return response;
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/**
 * Hook to search entities
 */
export function use__ENTITY__Search(query: string, limit: number = 10) {
  const { get } = useHttpClient();

  return useQuery({
    queryKey: qk.__RESOURCE__.search(query, limit),
    queryFn: async () => {
      logDebug('Searching __RESOURCE__', {
        component: 'use__ENTITY__Search',
        operation: 'queryFn',
        query,
        limit,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      const response = await get(
        `/api/__RESOURCE__/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response;
    },
    enabled: !!query && query.length >= 2,
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
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
  const { post } = useHttpClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async (data: any) => {
      logDebug('Creating __RESOURCE__', {
        component: 'useCreate__ENTITY__',
        operation: 'mutationFn',
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      try {
        const startTime = Date.now();
        const response = await post(`/api/__RESOURCE__`, data);
        const loadTime = Date.now() - startTime;

        logInfo('__RESOURCE__ created successfully', {
          component: 'useCreate__ENTITY__',
          operation: 'mutationFn',
          __RESOURCE__Id: response?.id || 'unknown',
          loadTime,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        });

        return response;
      } catch (error) {
        logError('Failed to create __RESOURCE__', {
          component: 'useCreate__ENTITY__',
          operation: 'mutationFn',
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        });
        throw error;
      }
    },
    onSuccess: data => {
      // Invalidate and refetch lists
      queryClient.invalidateQueries({ queryKey: qk.__RESOURCE__.all });
      // Set the new entity data in cache
      queryClient.setQueryData(qk.__RESOURCE__.byId(data.id), data);
    },
    onError: error => {
      logError('__RESOURCE__ creation failed', {
        component: 'useCreate__ENTITY__',
        operation: 'createProduct',
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
    },
  });
}

/**
 * Hook to update existing entity
 */
export function useUpdate__ENTITY__() {
  const queryClient = useQueryClient();
  const { put } = useHttpClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Update__ENTITY__Data }) => {
      logDebug('Updating __RESOURCE__', {
        component: 'useUpdate__ENTITY__',
        operation: 'updateProduct',
        __RESOURCE__Id: id,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      try {
        const startTime = Date.now();
        const response = await put(`/api/__RESOURCE__/${id}`, data);
        const loadTime = Date.now() - startTime;

        logInfo('__RESOURCE__ updated successfully', {
          component: 'useUpdate__ENTITY__',
          operation: 'updateProduct',
          __RESOURCE__Id: id,
          loadTime,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        });

        return response;
      } catch (error) {
        logError('Failed to update __RESOURCE__', {
          component: 'useUpdate__ENTITY__',
          operation: 'updateProduct',
          __RESOURCE__Id: id,
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        });
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Update the specific entity in cache
      queryClient.setQueryData(qk.__RESOURCE__.byId(variables.id), data);
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: qk.__RESOURCE__.all });
    },
    onError: (error, variables) => {
      logError('__RESOURCE__ update failed', {
        component: 'useUpdate__ENTITY__',
        operation: 'updateProduct',
        __RESOURCE__Id: variables.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
    },
  });
}

/**
 * Hook to delete entity
 */
export function useDelete__ENTITY__() {
  const queryClient = useQueryClient();
  const { delete: del } = useHttpClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logDebug('Deleting __RESOURCE__', {
        component: 'useDelete__ENTITY__',
        operation: 'deleteProduct',
        __RESOURCE__Id: id,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      try {
        const startTime = Date.now();
        await del(`/api/__RESOURCE__/${id}`);
        const loadTime = Date.now() - startTime;

        logInfo('__RESOURCE__ deleted successfully', {
          component: 'useDelete__ENTITY__',
          operation: 'deleteProduct',
          __RESOURCE__Id: id,
          loadTime,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        });

        return id;
      } catch (error) {
        logError('Failed to delete __RESOURCE__', {
          component: 'useDelete__ENTITY__',
          operation: 'deleteProduct',
          __RESOURCE__Id: id,
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        });
        throw error;
      }
    },
    onSuccess: id => {
      // Remove the entity from cache
      queryClient.removeQueries({ queryKey: qk.__RESOURCE__.byId(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: qk.__RESOURCE__.all });
    },
    onError: (error, id) => {
      logError('__RESOURCE__ deletion failed', {
        component: 'useDelete__ENTITY__',
        operation: 'deleteProduct',
        __RESOURCE__Id: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
    },
  });
}

/**
 * Hook to bulk delete entities
 */
export function useDelete__ENTITY__sBulk() {
  const queryClient = useQueryClient();
  const { post } = useHttpClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      logDebug('Bulk deleting __RESOURCE__', {
        component: 'useDelete__ENTITY__sBulk',
        operation: 'bulkDeleteProducts',
        __RESOURCE__Ids: ids,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      try {
        const startTime = Date.now();
        await post('/api/__RESOURCE__/bulk-delete', { ids });
        const loadTime = Date.now() - startTime;

        logInfo('__RESOURCE__ bulk deleted successfully', {
          component: 'useDelete__ENTITY__sBulk',
          operation: 'bulkDeleteProducts',
          __RESOURCE__Ids: ids,
          loadTime,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        });

        return ids;
      } catch (error) {
        logError('Failed to bulk delete __RESOURCE__', {
          component: 'useDelete__ENTITY__sBulk',
          operation: 'bulkDeleteProducts',
          __RESOURCE__Ids: ids,
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        });
        throw error;
      }
    },
    onSuccess: ids => {
      // Remove all deleted entities from cache
      ids.forEach(id => {
        queryClient.removeQueries({ queryKey: qk.__RESOURCE__.byId(id) });
      });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: qk.__RESOURCE__.all });
    },
    onError: (error, ids) => {
      logError('__RESOURCE__ bulk deletion failed', {
        component: 'useDelete__ENTITY__sBulk',
        operation: 'bulkDeleteProducts',
        __RESOURCE__Ids: ids,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
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
  const { get } = useHttpClient();

  return useQuery({
    queryKey: ['__RESOURCE__', 'byIdOrSearch', id, searchTerm],
    queryFn: async () => {
      if (id) {
        logDebug('Fetching __RESOURCE__ by ID', {
          component: 'use__ENTITY__ByIdOrSearch',
          operation: 'queryFn',
          __RESOURCE__Id: id,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        });

        const response = await __RESOURCE__Service.get__ENTITY__(id);
        return response;
      } else if (searchTerm) {
        logDebug('Searching __RESOURCE__', {
          component: 'use__ENTITY__ByIdOrSearch',
          operation: 'queryFn',
          searchTerm,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        });

        const response = await __RESOURCE__Service.search__ENTITY__s(searchTerm);
        return response;
      }
      return null;
    },
    enabled: !!(id || searchTerm),
    staleTime: 30000,
    gcTime: 120000,
  });
}

/**
 * Hook to get multiple entities by IDs using useQueries
 */
export function use__ENTITY__sByIds(ids: string[]) {
  const { get } = useHttpClient();

  const results = useQueries({
    queries: ids.map(id => ({
      queryKey: qk.__RESOURCE__.byId(id),
      queryFn: async () => {
        logDebug('Fetching __RESOURCE__ by ID', {
          component: 'use__ENTITY__sByIds',
          operation: 'queryFn',
          __RESOURCE__Id: id,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        });

        const response = await get(`/api/__RESOURCE__/${id}`);
        return response;
      },
      enabled: !!id,
      staleTime: 30000,
      gcTime: 120000,
      refetchOnWindowFocus: false,
      retry: 1,
    })),
  });

  return {
    data: results.map(r => r.data).filter(Boolean) as any[],
    isLoading: results.some(r => r.isLoading),
    isError: results.some(r => r.isError),
    errors: results.filter(r => r.error).map(r => r.error),
  };
}

// ====================
// Export Default
// ====================

// All functions are already exported above
