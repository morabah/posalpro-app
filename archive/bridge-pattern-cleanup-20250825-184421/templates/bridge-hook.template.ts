// __FILE_DESCRIPTION__: Bridge hook template for accessing bridge functionality in components
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import {
  use__BRIDGE_NAME__ApiBridge,
  type __ENTITY_TYPE__FetchParams,
} from '@/lib/bridges/__BRIDGE_NAME__ApiBridge';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

// ====================
// React Query Keys
// ====================

export const __BRIDGE_NAME___QUERY_KEYS = {
  all: ['__RESOURCE_NAME__'] as const,
  lists: () => ['__RESOURCE_NAME__', 'list'] as const,
  list: (params: __ENTITY_TYPE__FetchParams) => ['__RESOURCE_NAME__', 'list', params] as const,
  details: () => ['__RESOURCE_NAME__', 'detail'] as const,
  detail: (id: string) => ['__RESOURCE_NAME__', 'detail', id] as const,
};

// ====================
// Hook Options
// ====================

export interface Use__BRIDGE_NAME__Options {
  enableCache?: boolean;
  staleTime?: number;
  gcTime?: number;
  retryAttempts?: number;
  timeout?: number;
}

export interface Use__BRIDGE_NAME__ListOptions extends Use__BRIDGE_NAME__Options {
  params?: __ENTITY_TYPE__FetchParams;
  enabled?: boolean;
}

export interface Use__BRIDGE_NAME__DetailOptions extends Use__BRIDGE_NAME__Options {
  enabled?: boolean;
}

// ====================
// Main Bridge Hook
// ====================

/**
 * Main hook for __BRIDGE_NAME__ bridge functionality
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: __USER_STORY__
 * - Hypothesis: __HYPOTHESIS__
 * - Acceptance Criteria: ['Data fetched efficiently', 'Caching works properly', 'Errors handled gracefully']
 *
 * COMPLIANCE STATUS:
 * ✅ React Query integration for caching
 * ✅ Error handling with ErrorHandlingService
 * ✅ Structured logging with metadata
 * ✅ TypeScript type safety
 * ✅ Performance optimization
 * ✅ Analytics tracking
 */
export function use__BRIDGE_NAME__(options: Use__BRIDGE_NAME__Options = {}) {
  const apiBridge = use__BRIDGE_NAME__ApiBridge({
    enableCache: options.enableCache ?? true,
    retryAttempts: options.retryAttempts ?? 3,
    timeout: options.timeout ?? 15000,
  });

  const queryClient = useQueryClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // ====================
  // Cache Management
  // ====================

  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: __BRIDGE_NAME___QUERY_KEYS.lists() });
  }, [queryClient]);

  const invalidateDetail = useCallback(
    (id: string) => {
      queryClient.invalidateQueries({ queryKey: __BRIDGE_NAME___QUERY_KEYS.detail(id) });
    },
    [queryClient]
  );

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: __BRIDGE_NAME___QUERY_KEYS.all });
  }, [queryClient]);

  const clearCache = useCallback(
    (pattern?: string) => {
      if (pattern) {
        apiBridge.clearCache(pattern);
      } else {
        apiBridge.clearCache();
        queryClient.removeQueries({ queryKey: __BRIDGE_NAME___QUERY_KEYS.all });
      }
    },
    [apiBridge, queryClient]
  );

  // ====================
  // Mutation Helpers
  // ====================

  const handleMutationSuccess = useCallback(
    (operation: string, data?: unknown) => {
      analytics(
        `__RESOURCE_NAME___${operation}`,
        {
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
          success: true,
        },
        'high'
      );

      logInfo(`__BRIDGE_NAME__ ${operation} success`, {
        component: 'use__BRIDGE_NAME__',
        operation,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      // Invalidate relevant queries
      invalidateList();
    },
    [analytics, invalidateList]
  );

  const handleMutationError = useCallback(
    (operation: string, error: unknown) => {
      const processed = errorHandlingService.processError(
        error,
        `Failed to ${operation} __RESOURCE_NAME__`,
        ErrorCodes.DATA.OPERATION_FAILED,
        {
          component: 'use__BRIDGE_NAME__',
          operation,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        }
      );

      analytics(
        `__RESOURCE_NAME___${operation}_error`,
        {
          error: processed.message,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        },
        'high'
      );

      logError(`__BRIDGE_NAME__ ${operation} failed`, {
        component: 'use__BRIDGE_NAME__',
        operation,
        error: processed.message,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      return processed;
    },
    [analytics, errorHandlingService]
  );

  // ====================
  // Return Hook Interface
  // ====================

  return useMemo(
    () => ({
      // Direct bridge access
      bridge: apiBridge,

      // Cache management
      invalidateList,
      invalidateDetail,
      invalidateAll,
      clearCache,

      // Query keys for external use
      queryKeys: __BRIDGE_NAME___QUERY_KEYS,

      // Mutation helpers
      handleMutationSuccess,
      handleMutationError,
    }),
    [
      apiBridge,
      invalidateList,
      invalidateDetail,
      invalidateAll,
      clearCache,
      handleMutationSuccess,
      handleMutationError,
    ]
  );
}

// ====================
// List Query Hook
// ====================

export function use__BRIDGE_NAME__List(options: Use__BRIDGE_NAME__ListOptions = {}) {
  const {
    params = {},
    enabled = true,
    staleTime = 30000,
    gcTime = 120000,
    ...bridgeOptions
  } = options;

  const apiBridge = use__BRIDGE_NAME__ApiBridge(bridgeOptions);
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: __BRIDGE_NAME___QUERY_KEYS.list(params),
    queryFn: async () => {
      const start = performance.now();

      logDebug('__BRIDGE_NAME__ list query start', {
        component: 'use__BRIDGE_NAME__List',
        operation: 'fetch',
        params,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      try {
        const result = await apiBridge.fetch__ENTITY_TYPE__s(params);

        analytics(
          '__RESOURCE_NAME___list_fetched',
          {
            count: result.data?.length || 0,
            loadTime: performance.now() - start,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          },
          'medium'
        );

        logInfo('__BRIDGE_NAME__ list query success', {
          component: 'use__BRIDGE_NAME__List',
          operation: 'fetch',
          resultCount: result.data?.length || 0,
          loadTime: performance.now() - start,
        });

        return result.data || [];
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const processed = ehs.processError(
          error,
          'Failed to fetch __RESOURCE_NAME__ list',
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: 'use__BRIDGE_NAME__List',
            operation: 'fetch',
            params,
          }
        );

        analytics(
          '__RESOURCE_NAME___list_fetch_error',
          {
            error: processed.message,
            loadTime: performance.now() - start,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          },
          'high'
        );

        logError('__BRIDGE_NAME__ list query failed', {
          component: 'use__BRIDGE_NAME__List',
          operation: 'fetch',
          error: processed.message,
          loadTime: performance.now() - start,
        });

        throw processed;
      }
    },
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ====================
// Detail Query Hook
// ====================

export function use__BRIDGE_NAME__Detail(
  id: string,
  options: Use__BRIDGE_NAME__DetailOptions = {}
) {
  const { enabled = !!id, staleTime = 30000, gcTime = 120000, ...bridgeOptions } = options;

  const apiBridge = use__BRIDGE_NAME__ApiBridge(bridgeOptions);
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: __BRIDGE_NAME___QUERY_KEYS.detail(id),
    queryFn: async () => {
      const start = performance.now();

      logDebug('__BRIDGE_NAME__ detail query start', {
        component: 'use__BRIDGE_NAME__Detail',
        operation: 'fetch',
        id,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      try {
        const result = await apiBridge.get__ENTITY_TYPE__(id);

        analytics(
          '__RESOURCE_NAME___detail_fetched',
          {
            id,
            loadTime: performance.now() - start,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          },
          'medium'
        );

        logInfo('__BRIDGE_NAME__ detail query success', {
          component: 'use__BRIDGE_NAME__Detail',
          operation: 'fetch',
          id,
          loadTime: performance.now() - start,
        });

        return result.data;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const processed = ehs.processError(
          error,
          `Failed to fetch __RESOURCE_NAME__ ${id}`,
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: 'use__BRIDGE_NAME__Detail',
            operation: 'fetch',
            id,
          }
        );

        analytics(
          '__RESOURCE_NAME___detail_fetch_error',
          {
            id,
            error: processed.message,
            loadTime: performance.now() - start,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          },
          'high'
        );

        logError('__BRIDGE_NAME__ detail query failed', {
          component: 'use__BRIDGE_NAME__Detail',
          operation: 'fetch',
          id,
          error: processed.message,
          loadTime: performance.now() - start,
        });

        throw processed;
      }
    },
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ====================
// Create Mutation Hook
// ====================

export function use__BRIDGE_NAME__Create(options: Use__BRIDGE_NAME__Options = {}) {
  const apiBridge = use__BRIDGE_NAME__ApiBridge(options);
  const queryClient = useQueryClient();
  const { handleMutationSuccess, handleMutationError } = use__BRIDGE_NAME__();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      logDebug('__BRIDGE_NAME__ create mutation start', {
        component: 'use__BRIDGE_NAME__Create',
        operation: 'create',
        payloadKeys: Object.keys(payload),
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      const result = await apiBridge.create__ENTITY_TYPE__(payload);

      if (!result.success || !result.data) {
        throw new Error('Failed to create __RESOURCE_NAME__');
      }

      return result.data;
    },
    onSuccess: data => {
      handleMutationSuccess('create', data);
      queryClient.invalidateQueries({ queryKey: __BRIDGE_NAME___QUERY_KEYS.lists() });
    },
    onError: error => {
      throw handleMutationError('create', error);
    },
  });
}

// ====================
// Update Mutation Hook
// ====================

export function use__BRIDGE_NAME__Update(options: Use__BRIDGE_NAME__Options = {}) {
  const apiBridge = use__BRIDGE_NAME__ApiBridge(options);
  const queryClient = useQueryClient();
  const { handleMutationSuccess, handleMutationError } = use__BRIDGE_NAME__();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      logDebug('__BRIDGE_NAME__ update mutation start', {
        component: 'use__BRIDGE_NAME__Update',
        operation: 'update',
        id,
        payloadKeys: Object.keys(payload),
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      const result = await apiBridge.update__ENTITY_TYPE__(id, payload);

      if (!result.success || !result.data) {
        throw new Error(`Failed to update __RESOURCE_NAME__ ${id}`);
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      handleMutationSuccess('update', data);
      queryClient.invalidateQueries({ queryKey: __BRIDGE_NAME___QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: __BRIDGE_NAME___QUERY_KEYS.detail(variables.id) });
    },
    onError: error => {
      throw handleMutationError('update', error);
    },
  });
}

// ====================
// Delete Mutation Hook
// ====================

export function use__BRIDGE_NAME__Delete(options: Use__BRIDGE_NAME__Options = {}) {
  const apiBridge = use__BRIDGE_NAME__ApiBridge(options);
  const queryClient = useQueryClient();
  const { handleMutationSuccess, handleMutationError } = use__BRIDGE_NAME__();

  return useMutation({
    mutationFn: async (id: string) => {
      logDebug('__BRIDGE_NAME__ delete mutation start', {
        component: 'use__BRIDGE_NAME__Delete',
        operation: 'delete',
        id,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      const result = await apiBridge.delete__ENTITY_TYPE__(id);

      if (!result.success) {
        throw new Error(`Failed to delete __RESOURCE_NAME__ ${id}`);
      }

      return id;
    },
    onSuccess: id => {
      handleMutationSuccess('delete', { id });
      queryClient.invalidateQueries({ queryKey: __BRIDGE_NAME___QUERY_KEYS.lists() });
      queryClient.removeQueries({ queryKey: __BRIDGE_NAME___QUERY_KEYS.detail(id) });
    },
    onError: error => {
      throw handleMutationError('delete', error);
    },
  });
}

// ====================
// Type Exports
// ====================

export type Use__BRIDGE_NAME__Return = ReturnType<typeof use__BRIDGE_NAME__>;
export type Use__BRIDGE_NAME__ListReturn = ReturnType<typeof use__BRIDGE_NAME__List>;
export type Use__BRIDGE_NAME__DetailReturn = ReturnType<typeof use__BRIDGE_NAME__Detail>;
export type Use__BRIDGE_NAME__CreateReturn = ReturnType<typeof use__BRIDGE_NAME__Create>;
export type Use__BRIDGE_NAME__UpdateReturn = ReturnType<typeof use__BRIDGE_NAME__Update>;
export type Use__BRIDGE_NAME__DeleteReturn = ReturnType<typeof use__BRIDGE_NAME__Delete>;





