// __FILE_DESCRIPTION__: React Query hook skeleton aligned with feature keys + service layer
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { useQuery } from '@tanstack/react-query';
// IMPORTANT: replace placeholders below
// import { qk } from '@/features/__ROUTE_RESOURCE__/keys';
// import { __SERVICE_INSTANCE__ } from '@/services/__ROUTE_RESOURCE__Service';

export type __QUERY_PARAMS__ = {
  search?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  cursor?: string | null;
};

export function use__QUERY_HOOK_NAME__(params: __QUERY_PARAMS__ = {}) {
  const errorHandlingService = ErrorHandlingService.getInstance();

  return useQuery({
    // Replace with centralized keys from feature module
    // queryKey: qk.__ROUTE_RESOURCE__.list(params),
    queryKey: ['__ROUTE_RESOURCE__', 'list', params],
    queryFn: async () => {
      const start = performance.now();
      logDebug('Fetch start', {
        component: 'use__QUERY_HOOK_NAME__',
        operation: 'list',
        keys: params,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
      try {
        // Delegate to the service (ApiResponse pattern)
        // const response = await __SERVICE_INSTANCE__.getList(params);
        const response = { ok: true as const, data: { items: [], nextCursor: null as string | null } };
        if (response.ok) {
          logInfo('Fetch success', {
            component: 'use__QUERY_HOOK_NAME__',
            loadTime: performance.now() - start,
            count: Array.isArray((response.data as any).items)
              ? (response.data as any).items.length
              : 0,
            userStory: '__USER_STORY__',
            hypothesis: '__HYPOTHESIS__',
          });
          return response.data;
        }
        throw new Error((response as any).message || 'Request failed');
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
