/**
 * PosalPro MVP2 - Optimized Data Fetching Hook
 * Demonstrates selective hydration and route prefetching patterns
 * Component Traceability: US-6.1, US-6.2, H8, H11
 */

'use client';

import { useApiClient } from '@/hooks/useApiClient';
import { type ApiResponse } from '@/lib/api/client';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import { useCallback, useEffect, useState } from 'react';

/**
 * Component Traceability Matrix:
 * - User Stories: US-6.1 (Performance Optimization), US-6.2 (Data Management)
 * - Acceptance Criteria: AC-6.1.1, AC-6.1.2, AC-6.2.1, AC-6.2.2
 * - Hypotheses: H8 (Performance), H11 (User Experience)
 * - Methods: fetchWithFields(), fetchWithCursor(), prefetchData()
 * - Test Cases: TC-H8-001, TC-H11-002
 */

/**
 * Type definitions for better type safety
 * Following CORE_REQUIREMENTS.md TypeScript compliance standards
 */
interface FilterValue {
  [key: string]: string | number | boolean | null | undefined;
}

interface PaginationInfo {
  hasNextPage: boolean;
  nextCursor: string | null;
  itemCount: number;
}

interface FetchMeta {
  responseTimeMs?: number;
  selectiveHydration?: {
    fieldsRequested: string[];
    fieldsReturned: string[];
    optimizationApplied: boolean;
  };
  paginationType?: 'cursor' | 'offset';
}

interface OptimizedFetchOptions {
  endpoint: string;
  fields?: string[]; // For selective hydration
  cursor?: string; // For cursor pagination
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: FilterValue;
  enablePrefetch?: boolean; // For route prefetching coordination
}

interface OptimizedFetchResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  meta: FetchMeta | null;
  refetch: () => Promise<void>;
  fetchMore: () => Promise<void>;
}

/**
 * ✅ FOLLOWS LESSON #12: Always use useApiClient pattern for data fetching
 * ✅ IMPLEMENTS: Selective Hydration for performance optimization
 * ✅ IMPLEMENTS: Cursor-based pagination for scalability
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md - useApiClient pattern and ErrorHandlingService
 */
export function useOptimizedDataFetch<T = unknown>(
  options: OptimizedFetchOptions
): OptimizedFetchResult<T> {
  // ✅ REQUIRED: Use useApiClient pattern (CORE_REQUIREMENTS.md)
  const apiClient = useApiClient();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // State management
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  const [currentCursor, setCurrentCursor] = useState<string | null>(options.cursor || null);

  // ✅ PERFORMANCE: Build optimized query parameters
  const buildQueryParams = useCallback(
    (cursor?: string) => {
      const params = new URLSearchParams();

      // ✅ SELECTIVE HYDRATION: Add field selection
      if (options.fields && options.fields.length > 0) {
        params.set('fields', options.fields.join(','));
      }

      // ✅ CURSOR PAGINATION: Add cursor for efficient pagination
      if (cursor) {
        params.set('cursor', cursor);
      }

      if (options.limit) {
        params.set('limit', options.limit.toString());
      }

      if (options.sortBy) {
        params.set('sortBy', options.sortBy);
      }

      if (options.sortOrder) {
        params.set('sortOrder', options.sortOrder);
      }

      // Add filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, value.toString());
          }
        });
      }

      return params.toString();
    },
    [options]
  );

  // ✅ PERFORMANCE: Fetch data with optimizations
  const fetchData = useCallback(
    async (cursor?: string, append = false) => {
      setLoading(true);
      setError(null);

      try {
        const queryString = buildQueryParams(cursor);
        const url = `${options.endpoint}?${queryString}`;

        console.log('🚀 [OptimizedDataFetch] Fetching:', url);

        // ✅ CRITICAL: Use apiClient pattern (following Lesson #12)
        const response: ApiResponse<{
          data?: T[];
          customers?: T[];
          proposals?: T[];
          pagination?: PaginationInfo;
          meta?: FetchMeta;
        }> = await apiClient.get(url);

        if (response.success) {
          const responseData = response.data;
          const newData =
            responseData.data || responseData.customers || responseData.proposals || [];

          // Handle pagination response
          if (append && data) {
            setData(prevData => [...prevData, ...newData]);
          } else {
            setData(newData);
          }

          setPagination(responseData.pagination || null);
          setMeta(responseData.meta || null);

          // Update cursor for next fetch
          if (responseData.pagination?.nextCursor) {
            setCurrentCursor(responseData.pagination.nextCursor);
          }
        } else {
          throw new StandardError({
            message: 'Invalid response structure',
            code: ErrorCodes.API.INVALID_RESPONSE,
            metadata: {
              component: 'useOptimizedDataFetch',
              operation: 'fetchData',
              endpoint: options.endpoint,
            },
          });
        }
      } catch (fetchError) {
        // ✅ REQUIRED: Use ErrorHandlingService (CORE_REQUIREMENTS.md)
        const standardError = errorHandlingService.processError(
          fetchError,
          'Failed to fetch optimized data',
          ErrorCodes.API.REQUEST_FAILED,
          {
            component: 'useOptimizedDataFetch',
            operation: 'fetchData',
            endpoint: options.endpoint,
            cursor,
            userStories: ['US-6.1', 'US-6.2'],
            hypotheses: ['H8', 'H11'],
          }
        );

        setError(errorHandlingService.getUserFriendlyMessage(standardError));
      } finally {
        setLoading(false);
      }
    },
    [apiClient, errorHandlingService, buildQueryParams, options.endpoint, data]
  );

  // ✅ PERFORMANCE: Fetch more data (cursor pagination)
  const fetchMore = useCallback(async () => {
    if (currentCursor && pagination?.hasNextPage) {
      await fetchData(currentCursor, true);
    }
  }, [currentCursor, pagination?.hasNextPage, fetchData]);

  // ✅ PERFORMANCE: Refetch from beginning
  const refetch = useCallback(async () => {
    setCurrentCursor(null);
    await fetchData();
  }, [fetchData]);

  // ✅ REQUIRED: Use empty dependency array for mount-only fetch (CORE_REQUIREMENTS.md)
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - mount-only fetch following CORE_REQUIREMENTS pattern

  return {
    data,
    loading,
    error,
    pagination,
    meta,
    refetch,
    fetchMore,
  };
}

/**
 * ✅ CONVENIENCE HOOKS: Pre-configured for common use cases
 */

// Optimized proposals fetching
export function useOptimizedProposals(options: Partial<OptimizedFetchOptions> = {}) {
  return useOptimizedDataFetch({
    endpoint: '/api/proposals',
    fields: ['id', 'title', 'status', 'priority', 'dueDate', 'customerName', 'createdAt'],
    limit: 20,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    enablePrefetch: true,
    ...options,
  });
}

// Optimized customers fetching
export function useOptimizedCustomers(options: Partial<OptimizedFetchOptions> = {}) {
  return useOptimizedDataFetch({
    endpoint: '/api/customers',
    fields: ['id', 'name', 'email', 'industry', 'tier', 'status'],
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    enablePrefetch: true,
    ...options,
  });
}

// Minimal data fetching for dropdowns/selectors
export function useOptimizedSelector<T = unknown>(
  endpoint: string,
  fields: string[] = ['id', 'name']
) {
  return useOptimizedDataFetch<T>({
    endpoint,
    fields,
    limit: 50,
    enablePrefetch: false,
  });
}
