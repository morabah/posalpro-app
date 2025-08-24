// Customer bridge hook for accessing bridge functionality in components
// US-2.3: Customer Profile Management
// H4: Bridge pattern improves data consistency and performance

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import {
  useCustomerManagementApiBridge,
  type CustomerCreatePayload,
  type CustomerFetchParams,
} from '@/lib/bridges/CustomerApiBridge';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

// ====================
// React Query Keys
// ====================

export const CustomerManagement_QUERY_KEYS = {
  all: ['customers'] as const,
  lists: () => ['customers', 'list'] as const,
  list: (params: CustomerFetchParams) => ['customers', 'list', params] as const,
  details: () => ['customers', 'detail'] as const,
  detail: (id: string) => ['customers', 'detail', id] as const,
};

// ====================
// Hook Options
// ====================

export interface UseCustomerManagementOptions {
  enableCache?: boolean;
  staleTime?: number;
  gcTime?: number;
  retryAttempts?: number;
  timeout?: number;
}

export interface UseCustomerManagementListOptions extends UseCustomerManagementOptions {
  params?: CustomerFetchParams;
  enabled?: boolean;
}

export interface UseCustomerManagementDetailOptions extends UseCustomerManagementOptions {
  enabled?: boolean;
}

// ====================
// Main Bridge Hook
// ====================

/**
 * Main hook for CustomerManagement bridge functionality
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: US-2.3
 * - Hypothesis: H4
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
export function useCustomerManagement(options: UseCustomerManagementOptions = {}) {
  const apiBridge = useCustomerManagementApiBridge({
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
    queryClient.invalidateQueries({ queryKey: CustomerManagement_QUERY_KEYS.lists() });
  }, [queryClient]);

  const invalidateDetail = useCallback(
    (id: string) => {
      queryClient.invalidateQueries({ queryKey: CustomerManagement_QUERY_KEYS.detail(id) });
    },
    [queryClient]
  );

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: CustomerManagement_QUERY_KEYS.all });
  }, [queryClient]);

  const clearCache = useCallback(
    (pattern?: string) => {
      if (pattern) {
        apiBridge.clearCache(pattern);
      } else {
        apiBridge.clearCache();
        queryClient.removeQueries({ queryKey: CustomerManagement_QUERY_KEYS.all });
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
        `customers_${operation}`,
        {
          userStory: 'US-2.3',
          hypothesis: 'H4',
          success: true,
        },
        'high'
      );

      logInfo(`CustomerManagement ${operation} success`, {
        component: 'useCustomerManagement',
        operation,
        userStory: 'US-2.3',
        hypothesis: 'H4',
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
        `Failed to ${operation} customers`,
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'useCustomerManagement',
          operation,
          userStory: 'US-2.3',
          hypothesis: 'H4',
        }
      );

      analytics(
        `customers_${operation}_error`,
        {
          error: processed.message,
          userStory: 'US-2.3',
          hypothesis: 'H4',
        },
        'high'
      );

      logError(`CustomerManagement ${operation} failed`, {
        component: 'useCustomerManagement',
        operation,
        error: processed.message,
        userStory: 'US-2.3',
        hypothesis: 'H4',
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
      queryKeys: CustomerManagement_QUERY_KEYS,

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

export function useCustomerManagementList(options: UseCustomerManagementListOptions = {}) {
  const {
    params = {},
    enabled = true,
    staleTime = 30000,
    gcTime = 120000,
    ...bridgeOptions
  } = options;

  const apiBridge = useCustomerManagementApiBridge(bridgeOptions);
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: CustomerManagement_QUERY_KEYS.list(params),
    queryFn: async () => {
      const start = performance.now();

      logDebug('CustomerManagement list query start', {
        component: 'useCustomerManagementList',
        operation: 'fetch',
        params,
        userStory: 'US-2.3',
        hypothesis: 'H4',
      });

      try {
        const result = await apiBridge.fetchCustomers(params);

        analytics(
          'customers_list_fetched',
          {
            count: result.data?.length || 0,
            loadTime: performance.now() - start,
            userStory: 'US-2.3',
            hypothesis: 'H4',
          },
          'medium'
        );

        logInfo('CustomerManagement list query success', {
          component: 'useCustomerManagementList',
          operation: 'fetch',
          resultCount: result.data?.length || 0,
          loadTime: performance.now() - start,
        });

        return result.data || [];
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const processed = ehs.processError(
          error,
          'Failed to fetch customers list',
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: 'useCustomerManagementList',
            operation: 'fetch',
            params,
          }
        );

        analytics(
          'customers_list_fetch_error',
          {
            error: processed.message,
            loadTime: performance.now() - start,
            userStory: 'US-2.3',
            hypothesis: 'H4',
          },
          'high'
        );

        logError('CustomerManagement list query failed', {
          component: 'useCustomerManagementList',
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

export function useCustomerManagementDetail(
  id: string,
  options: UseCustomerManagementDetailOptions = {}
) {
  const { enabled = !!id, staleTime = 30000, gcTime = 120000, ...bridgeOptions } = options;

  const apiBridge = useCustomerManagementApiBridge(bridgeOptions);
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: CustomerManagement_QUERY_KEYS.detail(id),
    queryFn: async () => {
      const start = performance.now();

      logDebug('CustomerManagement detail query start', {
        component: 'useCustomerManagementDetail',
        operation: 'fetch',
        id,
        userStory: 'US-2.3',
        hypothesis: 'H4',
      });

      try {
        const result = await apiBridge.getCustomer(id);

        analytics(
          'customers_detail_fetched',
          {
            id,
            loadTime: performance.now() - start,
            userStory: 'US-2.3',
            hypothesis: 'H4',
          },
          'medium'
        );

        logInfo('CustomerManagement detail query success', {
          component: 'useCustomerManagementDetail',
          operation: 'fetch',
          id,
          loadTime: performance.now() - start,
        });

        return result.data;
      } catch (error) {
        const ehs = ErrorHandlingService.getInstance();
        const processed = ehs.processError(
          error,
          `Failed to fetch customers ${id}`,
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: 'useCustomerManagementDetail',
            operation: 'fetch',
            id,
          }
        );

        analytics(
          'customers_detail_fetch_error',
          {
            id,
            error: processed.message,
            loadTime: performance.now() - start,
            userStory: 'US-2.3',
            hypothesis: 'H4',
          },
          'high'
        );

        logError('CustomerManagement detail query failed', {
          component: 'useCustomerManagementDetail',
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

export function useCustomerManagementCreate(options: UseCustomerManagementOptions = {}) {
  const apiBridge = useCustomerManagementApiBridge(options);
  const queryClient = useQueryClient();
  const { handleMutationSuccess, handleMutationError } = useCustomerManagement();

  return useMutation({
    mutationFn: async (payload: CustomerCreatePayload) => {
      logDebug('CustomerManagement create mutation start', {
        component: 'useCustomerManagementCreate',
        operation: 'create',
        payloadKeys: Object.keys(payload),
        userStory: 'US-2.3',
        hypothesis: 'H4',
      });

      const result = await apiBridge.createCustomer(payload);

      if (!result.success || !result.data) {
        throw new Error('Failed to create customers');
      }

      return result.data;
    },
    onSuccess: data => {
      handleMutationSuccess('create', data);
      queryClient.invalidateQueries({ queryKey: CustomerManagement_QUERY_KEYS.lists() });
    },
    onError: error => {
      throw handleMutationError('create', error);
    },
  });
}

// ====================
// Update Mutation Hook
// ====================

export function useCustomerManagementUpdate(options: UseCustomerManagementOptions = {}) {
  const apiBridge = useCustomerManagementApiBridge(options);
  const queryClient = useQueryClient();
  const { handleMutationSuccess, handleMutationError } = useCustomerManagement();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      logDebug('CustomerManagement update mutation start', {
        component: 'useCustomerManagementUpdate',
        operation: 'update',
        id,
        payloadKeys: Object.keys(payload),
        userStory: 'US-2.3',
        hypothesis: 'H4',
      });

      const result = await apiBridge.updateCustomer(id, payload);

      if (!result.success || !result.data) {
        throw new Error(`Failed to update customers ${id}`);
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      handleMutationSuccess('update', data);
      queryClient.invalidateQueries({ queryKey: CustomerManagement_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: CustomerManagement_QUERY_KEYS.detail(variables.id),
      });
    },
    onError: error => {
      throw handleMutationError('update', error);
    },
  });
}

// ====================
// Delete Mutation Hook
// ====================

export function useCustomerManagementDelete(options: UseCustomerManagementOptions = {}) {
  const apiBridge = useCustomerManagementApiBridge(options);
  const queryClient = useQueryClient();
  const { handleMutationSuccess, handleMutationError } = useCustomerManagement();

  return useMutation({
    mutationFn: async (id: string) => {
      logDebug('CustomerManagement delete mutation start', {
        component: 'useCustomerManagementDelete',
        operation: 'delete',
        id,
        userStory: 'US-2.3',
        hypothesis: 'H4',
      });

      const result = await apiBridge.deleteCustomer(id);

      if (!result.success) {
        throw new Error(`Failed to delete customers ${id}`);
      }

      return id;
    },
    onSuccess: id => {
      handleMutationSuccess('delete', { id });
      queryClient.invalidateQueries({ queryKey: CustomerManagement_QUERY_KEYS.lists() });
      queryClient.removeQueries({ queryKey: CustomerManagement_QUERY_KEYS.detail(id) });
    },
    onError: error => {
      throw handleMutationError('delete', error);
    },
  });
}

// ====================
// Type Exports
// ====================

export type UseCustomerManagementReturn = ReturnType<typeof useCustomerManagement>;
export type UseCustomerManagementListReturn = ReturnType<typeof useCustomerManagementList>;
export type UseCustomerManagementDetailReturn = ReturnType<typeof useCustomerManagementDetail>;
export type UseCustomerManagementCreateReturn = ReturnType<typeof useCustomerManagementCreate>;
export type UseCustomerManagementUpdateReturn = ReturnType<typeof useCustomerManagementUpdate>;
export type UseCustomerManagementDeleteReturn = ReturnType<typeof useCustomerManagementDelete>;
