/**
 * Proposal React Query Hooks - Modern Architecture
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 */

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logError, logInfo } from '@/lib/logger';
import {
  Proposal,
  ProposalCreate,
  ProposalUpdate,
  proposalService,
} from '@/services/proposalService';
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

import { proposalKeys } from '@/features/proposals';

// ====================
// Infinite Query Hook
// ====================

export function useInfiniteProposals({
  search = '',
  limit = 20,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  cursor,
  filters,
}: {
  search?: string;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'status' | 'priority' | 'value';
  sortOrder?: 'asc' | 'desc';
  cursor?: string;
  filters?: Record<string, unknown>;
} = {}) {
  return useInfiniteQuery({
    queryKey: proposalKeys.proposals.list(search, limit, sortBy, sortOrder, cursor, filters),
    queryFn: async ({ pageParam }) => {
      logDebug('Fetching proposals with cursor pagination', {
        component: 'useInfiniteProposals',
        operation: 'queryFn',
        search,
        limit,
        sortBy,
        sortOrder,
        cursor: pageParam || undefined,
        filters,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      const data = await proposalService.getProposals({
        search,
        limit,
        sortBy,
        sortOrder,
        cursor: pageParam || undefined,
        filters,
      });

      logInfo('Proposals fetched successfully', {
        component: 'useInfiniteProposals',
        operation: 'queryFn',
        count: data.items?.length || 0,
        hasNextPage: !!data.nextCursor,
        loadTime: Date.now(),
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      return data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: lastPage => lastPage?.nextCursor || undefined,
    staleTime: 30000, // 30 seconds
    gcTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ====================
// Individual Proposal Hook
// ====================

export function useProposal(id: string) {
  return useQuery({
    queryKey: proposalKeys.proposals.byId(id),
    queryFn: async () => {
      // Reduced logging - only in development
      if (process.env.NODE_ENV === 'development') {
        logDebug('Fetching proposal', {
          component: 'useProposal',
          operation: 'queryFn',
          proposalId: id,
        });
      }

      const data = await proposalService.getProposal(id);

      // Reduced logging - only in development
      if (process.env.NODE_ENV === 'development') {
        logInfo('Proposal fetched successfully', {
          component: 'useProposal',
          operation: 'queryFn',
          proposalId: id,
          loadTime: Date.now(),
        });
      }

      return data;
    },
    enabled: !!id,
    staleTime: 5000, // ✅ REDUCED: Short stale time for responsiveness
    gcTime: 120000,
    refetchOnWindowFocus: true, // ✅ ENABLED: Refetch on window focus
    refetchOnMount: false, // ✅ DISABLED: Prevent redundant fetches on mount
    retry: 1,
  });
}

// ====================
// Multiple Proposals Hook
// ====================

export function useProposalsByIds(ids: string[]) {
  const results = useQueries({
    queries: ids.map(id => ({
      queryKey: proposalKeys.proposals.byId(id),
      queryFn: async () => {
        logDebug('Fetching proposal by ID', {
          component: 'useProposalsByIds',
          operation: 'queryFn',
          proposalId: id,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        });

        const data = await proposalService.getProposal(id);
        return data;
      },
      enabled: !!id,
      staleTime: 30000,
      gcTime: 120000,
    })),
  });

  return {
    data: results.map(r => (r.data ? r.data : null)).filter(Boolean) as Proposal[],
    isLoading: results.some(r => r.isLoading),
    isError: results.some(r => r.isError),
    errors: results.filter(r => r.error).map(r => r.error),
  };
}

// ====================
// Stats Hook
// ====================

export function useProposalStats() {
  return useQuery({
    queryKey: proposalKeys.proposals.stats(),
    queryFn: async () => {
      logDebug('Fetching proposal stats', {
        component: 'useProposalStats',
        operation: 'queryFn',
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      const data = await proposalService.getProposalStats();

      logInfo('Proposal stats fetched successfully', {
        component: 'useProposalStats',
        operation: 'queryFn',
        loadTime: Date.now(),
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      return data;
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ====================
// Due Date Focused Hooks
// ====================

export function useDueProposals({
  dueBefore,
  dueAfter,
  openOnly = true,
  limit = 10,
  sortBy = 'dueDate',
  sortOrder = 'asc',
}: {
  dueBefore?: string;
  dueAfter?: string;
  openOnly?: boolean;
  limit?: number;
  sortBy?: 'dueDate' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: proposalKeys.proposals.due(dueBefore, dueAfter, openOnly, limit, sortBy, sortOrder),
    queryFn: async () => {
      const data = await proposalService.getProposals({
        limit,
        sortBy: sortBy as any,
        sortOrder,
        ...(dueBefore ? { dueBefore } : {}),
        ...(dueAfter ? { dueAfter } : {}),
        ...(openOnly ? { openOnly } : {}),
      });

      // Ensure we always return an array, never undefined
      return data?.items || [];
    },
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    retry: 0,
  });
}

// ====================
// Mutation Hooks
// ====================

export function useCreateProposal() {
  const queryClient = useQueryClient();
  const analytics = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async (proposal: ProposalCreate) => {
      logDebug('Creating proposal', {
        component: 'useCreateProposal',
        operation: 'mutationFn',
        proposal: { title: proposal.basicInfo.title, customerId: proposal.basicInfo.customerId },
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      const data = await proposalService.createProposal(proposal);

      logInfo('Proposal created successfully', {
        component: 'useCreateProposal',
        operation: 'mutationFn',
        proposalId: data.id,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      return data;
    },
    onSuccess: (data, proposal) => {
      // ✅ IMMEDIATE CACHE UPDATES - Following MIGRATION_LESSONS.md
      queryClient.setQueryData(proposalKeys.proposals.byId(data.id), data);
      queryClient.invalidateQueries({ queryKey: proposalKeys.proposals.all });
      queryClient.invalidateQueries({ queryKey: proposalKeys.proposals.stats() });

      // Track analytics
      analytics.trackOptimized(
        'proposal_created',
        {
          proposalId: data.id,
          title: proposal.basicInfo.title,
          customerId: proposal.basicInfo.customerId,
          status: 'DRAFT', // Default status for new proposals
          priority: proposal.basicInfo.priority,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        },
        'high'
      );
    },
    onError: error => {
      logError('Failed to create proposal', error, {
        component: 'useCreateProposal',
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
    },
  });
}

export function useUpdateProposal() {
  const queryClient = useQueryClient();
  const analytics = useOptimizedAnalytics();

  return useMutation({
    // ✅ ADDED: Prevent multiple simultaneous updates
    mutationKey: ['update-proposal'],
    mutationFn: async ({ id, proposal }: { id: string; proposal: ProposalUpdate }) => {
      logDebug('Updating proposal', {
        component: 'useUpdateProposal',
        operation: 'mutationFn',
        proposalId: id,
        updates: Object.keys(proposal),
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      const data = await proposalService.updateProposal(id, proposal);

      logInfo('Proposal updated successfully', {
        component: 'useUpdateProposal',
        operation: 'mutationFn',
        proposalId: id,
        loadTime: Date.now(),
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      return data;
    },
    onSuccess: (data, { id, proposal }) => {
      // ✅ FIXED: Aggressive cache management strategy from MIGRATION_LESSONS.md

      // 1. Immediate cache updates - ensure data is immediately available
      queryClient.setQueryData(proposalKeys.proposals.byId(id), data);

      // 2. Comprehensive invalidation with exact matches
      queryClient.invalidateQueries({ queryKey: proposalKeys.proposals.all, exact: true });
      queryClient.invalidateQueries({ queryKey: proposalKeys.proposals.byId(id), exact: true });

      // 3. Force refetch to ensure fresh data
      queryClient.refetchQueries({ queryKey: proposalKeys.proposals.byId(id), exact: true });

      // 4. Invalidate related queries with broader patterns
      queryClient.invalidateQueries({ queryKey: proposalKeys.proposals.stats() });
      queryClient.invalidateQueries({
        queryKey: proposalKeys.proposals.list('', 20, 'createdAt', 'desc'),
      });

      // 5. Additional invalidation for any proposal-related queries
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'proposals',
        exact: false,
      });

      // Track analytics
      analytics.trackOptimized(
        'proposal_updated',
        {
          proposalId: id,
          updates: Object.keys(proposal),
          userStory: 'US-3.2',
          hypothesis: 'H4',
        },
        'high'
      );
    },
    onError: (error, { id }) => {
      logError('Failed to update proposal', error, {
        component: 'useUpdateProposal',
        proposalId: id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
    },
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();
  const analytics = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async (id: string) => {
      logDebug('Deleting proposal', {
        component: 'useDeleteProposal',
        operation: 'mutationFn',
        proposalId: id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      const data = await proposalService.deleteProposal(id);

      logInfo('Proposal deleted successfully', {
        component: 'useDeleteProposal',
        operation: 'mutationFn',
        proposalId: id,
        loadTime: Date.now(),
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      return data;
    },
    onSuccess: (response, id) => {
      // Invalidate all proposal queries
      queryClient.invalidateQueries({ queryKey: proposalKeys.proposals.all });

      // Track analytics
      analytics.trackOptimized(
        'proposal_deleted',
        {
          proposalId: id,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        },
        'high'
      );
    },
    onError: (error, id) => {
      logError('Failed to delete proposal', error, {
        component: 'useDeleteProposal',
        proposalId: id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
    },
  });
}

// ====================
// Bulk Operations
// ====================

export function useDeleteProposalsBulk() {
  const queryClient = useQueryClient();
  const analytics = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      logDebug('Bulk deleting proposals', {
        component: 'useDeleteProposalsBulk',
        operation: 'mutationFn',
        proposalIds: ids,
        count: ids.length,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      const response = await fetch('/api/proposals/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      logInfo('Proposals bulk deleted successfully', {
        component: 'useDeleteProposalsBulk',
        operation: 'mutationFn',
        deletedCount: data.data?.deleted || 0,
        loadTime: Date.now(),
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      return data;
    },
    onSuccess: (response, ids) => {
      // Invalidate all proposal queries
      queryClient.invalidateQueries({ queryKey: proposalKeys.proposals.all });

      // Track analytics
      analytics.trackOptimized(
        'proposals_bulk_deleted',
        {
          deletedCount: response.data?.deleted || 0,
          proposalIds: ids,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        },
        'high'
      );
    },
    onError: (error, ids) => {
      logError('Failed to bulk delete proposals', error, {
        component: 'useDeleteProposalsBulk',
        proposalIds: ids,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
    },
  });
}
