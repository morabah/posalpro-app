// __FILE_DESCRIPTION__: React Query hook skeleton following CORE_REQUIREMENTS
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

import { useApiClient } from '@/hooks/useApiClient';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { useQuery } from '@tanstack/react-query';

export type __QUERY_PARAMS__ = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export const __QUERY_KEY_ROOT___KEYS = {
  all: ['__QUERY_KEY_ROOT__'] as const,
  lists: () => ['__QUERY_KEY_ROOT__', 'list'] as const,
  list: (params: __QUERY_PARAMS__) => ['__QUERY_KEY_ROOT__', 'list', params] as const,
  details: () => ['__QUERY_KEY_ROOT__', 'detail'] as const,
  detail: (id: string) => ['__QUERY_KEY_ROOT__', 'detail', id] as const,
};

export function use__QUERY_HOOK_NAME__(params: __QUERY_PARAMS__ = {}) {
  const apiClient = useApiClient();
  const errorHandlingService = ErrorHandlingService.getInstance();

  return useQuery({
    queryKey: __QUERY_KEY_ROOT___KEYS.list(params),
    queryFn: async () => {
      const start = performance.now();
      logDebug('Fetch start', {
        component: 'use__QUERY_HOOK_NAME__',
        operation: 'list',
        keys: params,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
        acceptanceCriteria: [
          'Data fetched successfully',
          'Minimal fields requested',
          'Error handling works',
        ],
      });
      try {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.set('page', String(params.page));
        if (params.limit) searchParams.set('limit', String(params.limit));
        if (params.search) searchParams.set('search', params.search);
        if (params.sortBy) searchParams.set('sortBy', params.sortBy);
        if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

        // Minimal field selection and relation hydration disabled by default
        if (!searchParams.has('fields')) searchParams.set('fields', 'id,title,updatedAt');
        searchParams.set('includeCustomer', 'false');
        searchParams.set('includeTeam', 'false');

        const response = await apiClient.get<{ data: unknown }>(
          `/api/__ROUTE_RESOURCE__?${searchParams.toString()}`
        );
        logInfo('Fetch success', {
          component: 'use__QUERY_HOOK_NAME__',
          loadTime: performance.now() - start,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
          resultCount: Array.isArray(response?.data) ? response.data.length : 'unknown',
        });
        return (
          response && typeof response === 'object' && 'data' in response
            ? (response as { data: unknown }).data
            : response
        ) as unknown;
      } catch (error: unknown) {
        const processed = errorHandlingService.processError(
          error,
          'Fetch failed',
          ErrorCodes.API.NETWORK_ERROR,
          { context: 'use__QUERY_HOOK_NAME__ list' }
        );
        logError('Fetch failed', processed, { component: 'use__QUERY_HOOK_NAME__' });
        throw processed;
      }
    },
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
