'use client';

// Customer Advanced Caching Hook - Advanced React Query Patterns
// User Story: US-2.1 (Customer Management)
// Hypothesis: H3 (Advanced caching improves performance and user experience)

import { useQueryClient } from '@tanstack/react-query';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo, logError } from '@/lib/logger';
import { customerKeys } from '@/features/customers';
import { customerService } from '@/services/customerService';

export function useCustomerCache() {
  const queryClient = useQueryClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Prefetch related customers when viewing a customer
  const prefetchRelatedCustomers = async (customerId: string, industry?: string) => {
    try {
      logDebug('Prefetching related customers', {
        component: 'useCustomerCache',
        operation: 'prefetchRelatedCustomers',
        customerId,
        industry,
        userStory: 'US-2.1',
        hypothesis: 'H3',
      });

      await queryClient.prefetchQuery({
        queryKey: customerKeys.customers.list('', 20, 'createdAt', 'desc', undefined, {
          industry,
        }),
        queryFn: () => customerService.getCustomers({
          search: '',
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          industry: industry as any,
        }),
        staleTime: 30000,
        gcTime: 120000,
      });

      analytics('customer_prefetch_success', {
        customerId,
        industry,
        prefetchType: 'related_customers',
        userStory: 'US-2.1',
        hypothesis: 'H3',
      }, 'low');

      logInfo('Related customers prefetched successfully', {
        component: 'useCustomerCache',
        operation: 'prefetchRelatedCustomers',
        customerId,
        industry,
      });
    } catch (error) {
      logError('Failed to prefetch related customers', {
        component: 'useCustomerCache',
        operation: 'prefetchRelatedCustomers',
        customerId,
        industry,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Prefetch customer search results for common queries
  const prefetchCustomerSearch = async (commonQueries: string[]) => {
    try {
      logDebug('Prefetching customer search results', {
        component: 'useCustomerCache',
        operation: 'prefetchCustomerSearch',
        queries: commonQueries,
        userStory: 'US-2.1',
        hypothesis: 'H3',
      });

      await Promise.all(
        commonQueries.map(query =>
          queryClient.prefetchQuery({
            queryKey: customerKeys.customers.search(query, 10),
            queryFn: () => customerService.searchCustomers(query, 10),
            staleTime: 30000,
            gcTime: 120000,
          })
        )
      );

      analytics('customer_prefetch_success', {
        prefetchType: 'search_results',
        queryCount: commonQueries.length,
        userStory: 'US-2.1',
        hypothesis: 'H3',
      }, 'low');

      logInfo('Customer search results prefetched successfully', {
        component: 'useCustomerCache',
        operation: 'prefetchCustomerSearch',
        queryCount: commonQueries.length,
      });
    } catch (error) {
      logError('Failed to prefetch customer search results', {
        component: 'useCustomerCache',
        operation: 'prefetchCustomerSearch',
        queries: commonQueries,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Optimistic update for customer creation
  const optimisticCreateCustomer = (newCustomer: any) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticCustomer = { ...newCustomer, id: tempId, _isOptimistic: true };

    // Add to cache immediately
    queryClient.setQueryData(
      customerKeys.customers.detail(tempId),
      optimisticCustomer
    );

    // Update list cache
    queryClient.setQueryData(
      customerKeys.customers.list('', 20, 'createdAt', 'desc'),
      (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: [optimisticCustomer, ...(oldData.items || [])],
        };
      }
    );

    analytics('customer_optimistic_update', {
      operation: 'create',
      customerId: tempId,
      userStory: 'US-2.1',
      hypothesis: 'H3',
    }, 'medium');

    return tempId;
  };

  // Intelligent cache invalidation based on customer changes
  const invalidateCustomerCache = (customerId: string, changeType: 'create' | 'update' | 'delete') => {
    logDebug('Invalidating customer cache', {
      component: 'useCustomerCache',
      operation: 'invalidateCustomerCache',
      customerId,
      changeType,
      userStory: 'US-2.1',
      hypothesis: 'H3',
    });

    switch (changeType) {
      case 'create':
        // Invalidate lists and stats
        queryClient.invalidateQueries({ queryKey: customerKeys.customers.all });
        queryClient.invalidateQueries({ queryKey: customerKeys.customers.stats() });
        break;
      case 'update':
        // Invalidate specific customer and lists
        queryClient.invalidateQueries({ queryKey: customerKeys.customers.detail(customerId) });
        queryClient.invalidateQueries({ queryKey: customerKeys.customers.all });
        queryClient.invalidateQueries({ queryKey: customerKeys.customers.stats() });
        break;
      case 'delete':
        // Remove from cache and invalidate lists
        queryClient.removeQueries({ queryKey: customerKeys.customers.detail(customerId) });
        queryClient.invalidateQueries({ queryKey: customerKeys.customers.all });
        queryClient.invalidateQueries({ queryKey: customerKeys.customers.stats() });
        break;
    }

    analytics('customer_cache_invalidation', {
      customerId,
      changeType,
      userStory: 'US-2.1',
      hypothesis: 'H3',
    }, 'low');
  };

  // Cache warming for critical user paths
  const warmCustomerCache = async () => {
    try {
      logDebug('Warming customer cache', {
        component: 'useCustomerCache',
        operation: 'warmCustomerCache',
        userStory: 'US-2.1',
        hypothesis: 'H3',
      });

      // Warm critical data in parallel
      await Promise.all([
        // Prefetch recent customers
        queryClient.prefetchQuery({
          queryKey: customerKeys.customers.list('', 20, 'createdAt', 'desc'),
          queryFn: () => customerService.getCustomers({
            search: '',
            limit: 20,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          }),
          staleTime: 30000,
          gcTime: 120000,
        }),
        // Prefetch active customers
        queryClient.prefetchQuery({
          queryKey: customerKeys.customers.list('', 20, 'createdAt', 'desc', undefined, {
            status: 'ACTIVE',
          }),
          queryFn: () => customerService.getCustomers({
            search: '',
            limit: 20,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            status: 'ACTIVE',
          }),
          staleTime: 30000,
          gcTime: 120000,
        }),
        // Prefetch stats
        queryClient.prefetchQuery({
          queryKey: customerKeys.customers.stats(),
          queryFn: () => customerService.getCustomerStats(),
          staleTime: 60000,
          gcTime: 300000,
        }),
      ]);

      analytics('customer_cache_warming_success', {
        warmedQueries: ['recent_customers', 'active_customers', 'stats'],
        userStory: 'US-2.1',
        hypothesis: 'H3',
      }, 'low');

      logInfo('Customer cache warmed successfully', {
        component: 'useCustomerCache',
        operation: 'warmCustomerCache',
      });
    } catch (error) {
      logError('Failed to warm customer cache', {
        component: 'useCustomerCache',
        operation: 'warmCustomerCache',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Memory optimization - remove unused queries
  const optimizeMemory = () => {
    try {
      logDebug('Optimizing customer cache memory', {
        component: 'useCustomerCache',
        operation: 'optimizeMemory',
        userStory: 'US-2.1',
        hypothesis: 'H3',
      });

      // Remove queries with no observers
      queryClient.removeQueries({
        predicate: (query) => {
          const hasObservers = query.getObserversCount() > 0;
          const isCustomerQuery = query.queryKey[0] === 'customers';
          return isCustomerQuery && !hasObservers;
        },
      });

      analytics('customer_memory_optimization', {
        operation: 'cleanup_unused_queries',
        userStory: 'US-2.1',
        hypothesis: 'H3',
      }, 'low');

      logInfo('Customer cache memory optimized', {
        component: 'useCustomerCache',
        operation: 'optimizeMemory',
      });
    } catch (error) {
      logError('Failed to optimize customer cache memory', {
        component: 'useCustomerCache',
        operation: 'optimizeMemory',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return {
    prefetchRelatedCustomers,
    prefetchCustomerSearch,
    optimisticCreateCustomer,
    invalidateCustomerCache,
    warmCustomerCache,
    optimizeMemory,
  };
}
