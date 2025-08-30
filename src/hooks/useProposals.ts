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

import { qk } from '@/features/proposals/keys';

// ====================
// Infinite Query Hook
// ====================

export function useInfiniteProposals({
  search = '',
  limit = 20,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  status,
  priority,
  customerId,
  assignedTo,
}: {
  search?: string;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'status' | 'priority' | 'value';
  sortOrder?: 'asc' | 'desc';
  status?:
    | 'DRAFT'
    | 'IN_REVIEW'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'REJECTED'
    | 'SUBMITTED'
    | 'ACCEPTED'
    | 'DECLINED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  customerId?: string;
  assignedTo?: string;
} = {}) {
  return useInfiniteQuery({
    queryKey: qk.proposals.list(
      search,
      limit,
      sortBy,
      sortOrder,
      status,
      priority,
      customerId,
      assignedTo
    ),
    queryFn: async ({ pageParam }) => {
      logDebug('Fetching proposals with cursor pagination', {
        component: 'useInfiniteProposals',
        operation: 'queryFn',
        search,
        limit,
        sortBy,
        sortOrder,
        status,
        priority,
        customerId,
        assignedTo,
        cursor: pageParam,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (limit) params.append('limit', limit.toString());
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (customerId) params.append('customerId', customerId);
      if (assignedTo) params.append('assignedTo', assignedTo);
      if (pageParam) params.append('cursor', pageParam);

      const response = await proposalService.getProposals({
        search,
        limit,
        cursor: pageParam,
        sortBy,
        sortOrder,
        status,
        priority,
        customerId,
        assignedTo
      });

      if (response.ok) {
        logInfo('Proposals fetched successfully', {
          component: 'useInfiniteProposals',
          operation: 'queryFn',
          count: response.data.items?.length || 0,
          hasNextPage: !!response.data.nextCursor,
          loadTime: Date.now(),
          userStory: 'US-3.2',
          hypothesis: 'H4',
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch proposals');
      }
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
    queryKey: qk.proposals.byId(id),
    queryFn: async () => {
      logDebug('Fetching proposal', {
        component: 'useProposal',
        operation: 'queryFn',
        proposalId: id,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      const response = await proposalService.getProposal(id);

      if (response.ok) {
        logInfo('Proposal fetched successfully', {
          component: 'useProposal',
          operation: 'queryFn',
          proposalId: id,
          loadTime: Date.now(),
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch proposal');
      }
    },
    enabled: !!id,
    staleTime: 5000, // ✅ REDUCED: Short stale time for responsiveness
    gcTime: 120000,
    refetchOnWindowFocus: true, // ✅ ENABLED: Refetch on window focus
    retry: 1,
  });
}

// ====================
// Multiple Proposals Hook
// ====================

export function useProposalsByIds(ids: string[]) {
  const results = useQueries({
    queries: ids.map(id => ({
      queryKey: qk.proposals.byId(id),
      queryFn: async () => {
        logDebug('Fetching proposal by ID', {
          component: 'useProposalsByIds',
          operation: 'queryFn',
          proposalId: id,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        });

        const response = await proposalService.getProposal(id);

        if (response.ok) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to fetch proposal');
        }
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
    queryKey: qk.proposals.stats(),
    queryFn: async () => {
      logDebug('Fetching proposal stats', {
        component: 'useProposalStats',
        operation: 'queryFn',
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      const response = await proposalService.getProposalStats();

      if (response.ok) {
        logInfo('Proposal stats fetched successfully', {
          component: 'useProposalStats',
          operation: 'queryFn',
          loadTime: Date.now(),
          userStory: 'US-3.2',
          hypothesis: 'H4',
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch proposal stats');
      }
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
    queryKey: qk.proposals.due(dueBefore, dueAfter, openOnly, limit, sortBy, sortOrder),
    queryFn: async () => {
      const response = await proposalService.getProposals({
        limit,
        sortBy: sortBy as any,
        sortOrder,
        ...(dueBefore ? { dueBefore } : {}),
        ...(dueAfter ? { dueAfter } : {}),
        ...(openOnly ? { openOnly } : {}),
      });

      if (response.ok) {
        return response.data.items;
      }
      throw new Error(response.message || 'Failed to fetch due proposals');
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

      const response = await proposalService.createProposal(proposal);

      if (response.ok) {
        logInfo('Proposal created successfully', {
          component: 'useCreateProposal',
          operation: 'mutationFn',
          proposalId: response.data.id,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create proposal');
      }
    },
    onSuccess: (response, proposal) => {
      // ✅ IMMEDIATE CACHE UPDATES - Following MIGRATION_LESSONS.md
      queryClient.setQueryData(qk.proposals.byId(response.id), response);
      queryClient.invalidateQueries({ queryKey: qk.proposals.all });
      queryClient.invalidateQueries({ queryKey: qk.proposals.stats() });

      // Track analytics
      analytics.trackOptimized(
        'proposal_created',
        {
          proposalId: response.id,
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
    mutationFn: async ({ id, proposal }: { id: string; proposal: ProposalUpdate }) => {
      logDebug('Updating proposal', {
        component: 'useUpdateProposal',
        operation: 'mutationFn',
        proposalId: id,
        updates: Object.keys(proposal),
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      const response = await proposalService.updateProposal(id, proposal);

      if (response.ok) {
        logInfo('Proposal updated successfully', {
          component: 'useUpdateProposal',
          operation: 'mutationFn',
          proposalId: id,
          loadTime: Date.now(),
          userStory: 'US-3.2',
          hypothesis: 'H4',
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update proposal');
      }
    },
    onSuccess: (response, { id, proposal }) => {
      // ✅ FIXED: Aggressive cache management strategy from MIGRATION_LESSONS.md

      // 1. Immediate cache updates
      queryClient.setQueryData(qk.proposals.byId(id), response);

      // 2. Comprehensive invalidation
      queryClient.invalidateQueries({ queryKey: qk.proposals.all });
      queryClient.invalidateQueries({ queryKey: qk.proposals.byId(id) });
      queryClient.refetchQueries({ queryKey: qk.proposals.byId(id) });

      // 3. Invalidate related queries
      queryClient.invalidateQueries({ queryKey: qk.proposals.stats() });
      queryClient.invalidateQueries({ queryKey: qk.proposals.list('', 20, 'createdAt', 'desc') });

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

      const response = await proposalService.deleteProposal(id);

      logInfo('Proposal deleted successfully', {
        component: 'useDeleteProposal',
        operation: 'mutationFn',
        proposalId: id,
        loadTime: Date.now(),
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      return response;
    },
    onSuccess: (response, id) => {
      // Invalidate all proposal queries
      queryClient.invalidateQueries({ queryKey: qk.proposals.all });

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
      queryClient.invalidateQueries({ queryKey: qk.proposals.all });

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
