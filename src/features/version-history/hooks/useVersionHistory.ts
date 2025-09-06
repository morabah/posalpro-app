/**
 * PosalPro MVP2 - Version History React Query Hooks
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 *
 * ✅ FOLLOWS: MIGRATION_LESSONS.md - React Query patterns with analytics integration
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md - Performance monitoring and caching standards
 * ✅ ALIGNS: Service layer integration with proper error handling
 * ✅ IMPLEMENTS: Modern React Query hooks with comprehensive analytics
 */

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logError, logInfo } from '@/lib/logger';

// Service will be imported lazily when needed
let versionHistoryService: any = null;

// Import types
import type { VersionHistoryEntry } from '@/services/versionHistoryServiceClient';
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// ====================
// Query Keys - Using centralized keys
// ====================

import { versionHistoryKeys } from '@/features/version-history/keys';

// ====================
// Infinite Query Hook - Main Version History List
// ====================

export function useInfiniteVersionHistory({
  proposalId,
  limit = 20,
  changeType,
  userId,
  dateFrom,
  dateTo,
}: {
  proposalId?: string;
  limit?: number;
  changeType?:
    | 'create'
    | 'update'
    | 'delete'
    | 'batch_import'
    | 'rollback'
    | 'status_change'
    | 'INITIAL';
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useInfiniteQuery({
    queryKey: versionHistoryKeys.infiniteList({
      proposalId,
      limit,
      changeType,
      userId,
      dateFrom,
      dateTo,
    }),
    queryFn: async ({ pageParam }) => {
      // Lazy import service based on environment
      if (!versionHistoryService) {
        if (typeof window === 'undefined') {
          const { versionHistoryService: serverService } = await import('@/services/versionHistoryService');
          versionHistoryService = serverService;
        } else {
          const { versionHistoryServiceClient } = await import('@/services/versionHistoryServiceClient');
          versionHistoryService = versionHistoryServiceClient;
        }
      }

      logDebug('Fetching version history with cursor pagination', {
        component: 'useInfiniteVersionHistory',
        operation: 'queryFn',
        proposalId,
        limit,
        changeType,
        userId,
        dateFrom,
        dateTo,
        cursor: pageParam,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      const params = {
        proposalId,
        limit,
        cursorCreatedAt: pageParam?.cursorCreatedAt,
        cursorId: pageParam?.cursorId,
        changeType,
        userId,
        dateFrom,
        dateTo,
      };

      const response = await versionHistoryService.getVersionHistory(params);

      if (response.ok) {
        const loadTime = Date.now();

        logInfo('Version history fetched successfully', {
          component: 'useInfiniteVersionHistory',
          operation: 'queryFn',
          count: response.data.items?.length || 0,
          hasNextPage: !!response.data.pagination?.nextCursor,
          loadTime,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        // Analytics tracking
        analytics('version_history_loaded', {
          count: response.data.items?.length || 0,
          proposalId,
          changeType,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch version history');
      }
    },
    initialPageParam: null as { cursorCreatedAt: string; cursorId: string } | null,
    getNextPageParam: lastPage => lastPage.pagination?.nextCursor || null,
    staleTime: 30000, // 30 seconds
    gcTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ====================
// Single Entry Query Hook
// ====================

export function useVersionHistoryEntry(id: string) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: versionHistoryKeys.entry(id),
    queryFn: async () => {
      logDebug('Fetching single version history entry', {
        component: 'useVersionHistoryEntry',
        operation: 'queryFn',
        versionHistoryId: id,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      const response = await versionHistoryService.getVersionHistoryEntry(id);

      if (response.ok) {
        logInfo('Version history entry fetched successfully', {
          component: 'useVersionHistoryEntry',
          operation: 'queryFn',
          versionHistoryId: id,
          loadTime: Date.now(),
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        analytics('version_history_entry_viewed', {
          versionHistoryId: id,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch version history entry');
      }
    },
    enabled: !!id,
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ====================
// Proposal-Specific Version History Hook
// ====================

export function useProposalVersionHistory(
  proposalId: string,
  params: {
    limit?: number;
    changeType?:
      | 'create'
      | 'update'
      | 'delete'
      | 'batch_import'
      | 'rollback'
      | 'status_change'
      | 'INITIAL';
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}
) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: versionHistoryKeys.byProposal(proposalId),
    queryFn: async () => {
      logDebug('Fetching proposal version history', {
        component: 'useProposalVersionHistory',
        operation: 'queryFn',
        proposalId,
        params,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      const response = await versionHistoryService.getProposalVersionHistory(proposalId, {
        limit: params.limit || 20,
      });

      if (response.ok) {
        logInfo('Proposal version history fetched successfully', {
          component: 'useProposalVersionHistory',
          operation: 'queryFn',
          proposalId,
          count: response.data.items?.length || 0,
          loadTime: Date.now(),
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        analytics('proposal_version_history_loaded', {
          proposalId,
          count: response.data.items?.length || 0,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch proposal version history');
      }
    },
    enabled: !!proposalId,
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ====================
// Version History Detail Hook (with diff)
// ====================

export function useVersionHistoryDetail(proposalId: string, version: number) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: versionHistoryKeys.proposalVersion(proposalId, version),
    queryFn: async () => {
      logDebug('Fetching version history detail with diff', {
        component: 'useVersionHistoryDetail',
        operation: 'queryFn',
        proposalId,
        version,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      const response = await versionHistoryService.getVersionHistoryDetail(proposalId, version);

      if (response.ok) {
        logInfo('Version history detail fetched successfully', {
          component: 'useVersionHistoryDetail',
          operation: 'queryFn',
          proposalId,
          version,
          loadTime: Date.now(),
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        analytics('version_history_detail_viewed', {
          proposalId,
          version,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch version history detail');
      }
    },
    enabled: !!proposalId && version > 0,
    staleTime: 60000, // 1 minute (less frequent updates for detail)
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ====================
// Version History Stats Hook
// ====================

export function useVersionHistoryStats(
  params: {
    proposalId?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}
) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: versionHistoryKeys.globalStats(),
    queryFn: async () => {
      logDebug('Fetching version history statistics', {
        component: 'useVersionHistoryStats',
        operation: 'queryFn',
        params,
        userStory: 'US-5.2',
        hypothesis: 'H9',
      });

      const response = await versionHistoryService.getVersionHistoryStats(params);

      if (response.ok) {
        logInfo('Version history statistics fetched successfully', {
          component: 'useVersionHistoryStats',
          operation: 'queryFn',
          totalVersions: response.data.totalVersions,
          totalProposals: response.data.totalProposals,
          loadTime: Date.now(),
          userStory: 'US-5.2',
          hypothesis: 'H9',
        });

        analytics('version_history_stats_loaded', {
          totalVersions: response.data.totalVersions,
          totalProposals: response.data.totalProposals,
          userStory: 'US-5.2',
          hypothesis: 'H9',
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch version history statistics');
      }
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ====================
// Search Version History Hook
// ====================

export function useSearchVersionHistory(
  query: string,
  params: {
    limit?: number;
    proposalId?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}
) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: versionHistoryKeys.searchVersions(query, params),
    queryFn: async () => {
      logDebug('Searching version history', {
        component: 'useSearchVersionHistory',
        operation: 'queryFn',
        query,
        params,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      const response = await versionHistoryService.searchVersionHistory(query, params);

      if (response.ok) {
        logInfo('Version history search completed successfully', {
          component: 'useSearchVersionHistory',
          operation: 'queryFn',
          query,
          count: response.data.items?.length || 0,
          loadTime: Date.now(),
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        analytics('version_history_searched', {
          query,
          count: response.data.items?.length || 0,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to search version history');
      }
    },
    enabled: !!query && query.length >= 2,
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ====================
// User Version History Hook
// ====================

export function useUserVersionHistory(
  userId: string,
  params: {
    limit?: number;
    changeType?:
      | 'create'
      | 'update'
      | 'delete'
      | 'batch_import'
      | 'rollback'
      | 'status_change'
      | 'INITIAL';
    dateFrom?: string;
    dateTo?: string;
  } = {}
) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useQuery({
    queryKey: versionHistoryKeys.byUser(userId),
    queryFn: async () => {
      logDebug('Fetching user version history', {
        component: 'useUserVersionHistory',
        operation: 'queryFn',
        userId,
        params,
        userStory: 'US-5.2',
        hypothesis: 'H9',
      });

      const response = await versionHistoryService.getUserVersionHistory(userId, params);

      if (response.ok) {
        logInfo('User version history fetched successfully', {
          component: 'useUserVersionHistory',
          operation: 'queryFn',
          userId,
          count: response.data.items?.length || 0,
          loadTime: Date.now(),
          userStory: 'US-5.2',
          hypothesis: 'H9',
        });

        analytics('user_version_history_loaded', {
          userId,
          count: response.data.items?.length || 0,
          userStory: 'US-5.2',
          hypothesis: 'H9',
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch user version history');
      }
    },
    enabled: !!userId,
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ====================
// Multiple Entries Query Hook
// ====================

export function useVersionHistoryEntries(ids: string[]) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const results = useQueries({
    queries: ids.map(id => ({
      queryKey: versionHistoryKeys.entry(id),
      queryFn: async () => {
        logDebug('Fetching version history entry by ID', {
          component: 'useVersionHistoryEntries',
          operation: 'queryFn',
          versionHistoryId: id,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        const response = await versionHistoryService.getVersionHistoryEntry(id);

        if (response.ok) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to fetch version history entry');
        }
      },
      enabled: !!id,
      staleTime: 30000,
      gcTime: 120000,
      refetchOnWindowFocus: false,
      retry: 1,
    })),
  });

  // Analytics tracking for batch operations
  const loadedCount = results.filter(r => r.data).length;
  if (loadedCount > 0 && loadedCount === ids.length) {
    analytics('version_history_entries_batch_loaded', {
      count: loadedCount,
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });
  }

  return {
    data: results.map(r => r.data).filter(Boolean) as VersionHistoryEntry[],
    isLoading: results.some(r => r.isLoading),
    isError: results.some(r => r.isError),
    errors: results.filter(r => r.error).map(r => r.error),
  };
}

// ====================
// Mutation Hooks - Create, Update, Delete Operations
// ====================

export function useDeleteVersionHistoryBulk() {
  const queryClient = useQueryClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async (versionIds: string[]) => {
      logDebug('Bulk deleting version history entries', {
        component: 'useDeleteVersionHistoryBulk',
        operation: 'mutationFn',
        count: versionIds.length,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      const response = await versionHistoryService.bulkDeleteVersionHistory(versionIds);

      if (response.ok) {
        logInfo('Version history bulk delete completed successfully', {
          component: 'useDeleteVersionHistoryBulk',
          operation: 'mutationFn',
          requested: versionIds.length,
          deleted: response.data.deleted,
          failed: response.data.failed,
          loadTime: Date.now(),
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to bulk delete version history');
      }
    },
    onSuccess: (data, versionIds) => {
      // Invalidate all version history queries
      queryClient.invalidateQueries({ queryKey: versionHistoryKeys.all });

      // Remove individual entries from cache
      versionIds.forEach(id => {
        queryClient.removeQueries({ queryKey: versionHistoryKeys.entry(id) });
      });

      // Analytics tracking
      analytics('version_history_bulk_deleted', {
        requested: versionIds.length,
        deleted: data.deleted,
        failed: data.failed,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });
    },
    onError: (error, versionIds) => {
      logError('Version history bulk delete failed', {
        component: 'useDeleteVersionHistoryBulk',
        operation: 'bulkDeleteVersionHistory',
        error: error instanceof Error ? error.message : 'Unknown error',
        count: versionIds.length,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });
    },
  });
}

// ====================
// Export Default
// ====================

export default {
  useInfiniteVersionHistory,
  useVersionHistoryEntry,
  useProposalVersionHistory,
  useVersionHistoryDetail,
  useVersionHistoryStats,
  useSearchVersionHistory,
  useUserVersionHistory,
  useVersionHistoryEntries,
  useDeleteVersionHistoryBulk,
};
