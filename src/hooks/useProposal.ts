/**
 * Proposal Hooks - Fetch, create, and update proposal data
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination)
 */

import { proposalKeys, type ProposalCreateData } from '@/features/proposals';
import { logDebug, logError, logInfo } from '@/lib/logger';
import type { ProposalUpdate } from '@/services/proposalService';
import { proposalService } from '@/services/proposalService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useProposal(
  proposalId: string,
  options?: {
    staleTime?: number;
    refetchOnMount?: boolean;
  }
) {
  return useQuery({
    queryKey: proposalKeys.proposals.byId(proposalId),
    queryFn: async () => {
      logDebug('Fetching proposal', {
        component: 'useProposal',
        operation: 'fetchProposal',
        proposalId,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      try {
        const startTime = Date.now();
        const data = await proposalService.getProposal(proposalId);
        const loadTime = Date.now() - startTime;

        logInfo('Proposal fetched successfully', {
          component: 'useProposal',
          operation: 'fetchProposal',
          proposalId,
          loadTime,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        });

        return data;
      } catch (error) {
        logError('Failed to fetch proposal', {
          component: 'useProposal',
          operation: 'fetchProposal',
          proposalId,
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: 'US-3.2',
          hypothesis: 'H4',
        });
        throw error;
      }
    },
    enabled: !!proposalId,
    // ✅ STANDARDIZED CACHE CONFIG: Match features/proposals/hooks/useProposals.ts
    staleTime: 5000, // Short stale time for responsiveness
    gcTime: 120000,
    refetchOnWindowFocus: true, // Enabled for freshness
    refetchOnMount: false, // ✅ DISABLED: Prevent redundant fetches on mount
    retry: 1,
    // Override with custom options if provided (options take precedence)
    ...(options || {}),
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProposalCreateData) => {
      logDebug('Creating proposal', {
        component: 'useCreateProposal',
        operation: 'createProposal',
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      try {
        const startTime = Date.now();
        const result = await proposalService.createProposal(data as any);
        const loadTime = Date.now() - startTime;

        logInfo('Proposal created successfully', {
          component: 'useCreateProposal',
          operation: 'createProposal',
          proposalId: result.id,
          loadTime,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });

        return result;
      } catch (error) {
        logError('Failed to create proposal', {
          component: 'useCreateProposal',
          operation: 'createProposal',
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });
        throw error;
      }
    },
    onSuccess: data => {
      // Invalidate and refetch proposals list
      queryClient.invalidateQueries({ queryKey: proposalKeys.proposals.all });
      // Set the new proposal data in cache
      queryClient.setQueryData(proposalKeys.proposals.byId(data.id), data);
    },
    onError: error => {
      logError('Proposal creation failed', {
        component: 'useCreateProposal',
        operation: 'createProposal',
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
    },
  });
}

export function useUpdateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProposalUpdate }) => {
      logDebug('Updating proposal', {
        component: 'useUpdateProposal',
        operation: 'updateProposal',
        proposalId: id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      try {
        const startTime = Date.now();
        const result = await proposalService.updateProposal(id, data);
        const loadTime = Date.now() - startTime;

        logInfo('Proposal updated successfully', {
          component: 'useUpdateProposal',
          operation: 'updateProposal',
          proposalId: id,
          loadTime,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        });

        return result;
      } catch (error) {
        logError('Failed to update proposal', {
          component: 'useUpdateProposal',
          operation: 'updateProposal',
          proposalId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: 'US-3.2',
          hypothesis: 'H4',
        });
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      logDebug('Invalidating proposal cache after update', {
        component: 'useUpdateProposal',
        operation: 'invalidateCache',
        proposalId: variables.id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      // ✅ AGGRESSIVE CACHE INVALIDATION: Force complete refresh
      // 1. Remove all cached data for this proposal
      queryClient.removeQueries({ queryKey: proposalKeys.proposals.byId(variables.id) });

      // 2. Invalidate all proposal-related queries to force refetch
      queryClient.invalidateQueries({ queryKey: proposalKeys.proposals.all });
      queryClient.invalidateQueries({ queryKey: proposalKeys.proposals.byId(variables.id) });

      // 3. Set fresh data immediately to prevent loading states
      queryClient.setQueryData(proposalKeys.proposals.byId(variables.id), data);

      // 4. Force refetch to ensure data consistency
      queryClient.refetchQueries({
        queryKey: proposalKeys.proposals.byId(variables.id),
        type: 'active',
      });

      logDebug('Proposal cache aggressively invalidated and refreshed', {
        component: 'useUpdateProposal',
        operation: 'cacheUpdated',
        proposalId: variables.id,
        productCount: (data as any)?.products?.length || 0,
        totalValue: data?.value || 0,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
    },
    onError: (error, variables) => {
      logError('Proposal update failed', {
        component: 'useUpdateProposal',
        operation: 'updateProposal',
        proposalId: variables.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
    },
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logDebug('Deleting proposal', {
        component: 'useDeleteProposal',
        operation: 'deleteProposal',
        proposalId: id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      try {
        const startTime = Date.now();
        const result = await proposalService.deleteProposal(id);
        const loadTime = Date.now() - startTime;

        logInfo('Proposal deleted successfully', {
          component: 'useDeleteProposal',
          operation: 'deleteProposal',
          proposalId: id,
          loadTime,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        });

        return id;
      } catch (error) {
        logError('Failed to delete proposal', {
          component: 'useDeleteProposal',
          operation: 'deleteProposal',
          proposalId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: 'US-3.2',
          hypothesis: 'H4',
        });
        throw error;
      }
    },
    onSuccess: id => {
      // Remove the proposal from cache
      queryClient.removeQueries({ queryKey: proposalKeys.proposals.byId(id) });
      // Invalidate proposals list
      queryClient.invalidateQueries({ queryKey: proposalKeys.proposals.all });
    },
    onError: (error, id) => {
      logError('Proposal deletion failed', {
        component: 'useDeleteProposal',
        operation: 'deleteProposal',
        proposalId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
    },
  });
}
