/**
 * Proposal Hooks - Fetch, create, and update proposal data
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination)
 */

import { qk } from '@/features/proposals/keys';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { proposalService } from '@/services/proposalService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useProposal(proposalId: string) {
  return useQuery({
    queryKey: qk.proposals.byId(proposalId),
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
        const proposal = await proposalService.getProposal(proposalId);
        const loadTime = Date.now() - startTime;

        logInfo('Proposal fetched successfully', {
          component: 'useProposal',
          operation: 'fetchProposal',
          proposalId,
          loadTime,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        });

        return proposal;
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
    staleTime: 30000, // 30 seconds
    gcTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      logDebug('Creating proposal', {
        component: 'useCreateProposal',
        operation: 'createProposal',
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      try {
        const startTime = Date.now();
        const proposal = await proposalService.createProposal(data);
        const loadTime = Date.now() - startTime;

        logInfo('Proposal created successfully', {
          component: 'useCreateProposal',
          operation: 'createProposal',
          proposalId: proposal.id,
          loadTime,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });

        return proposal;
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
      queryClient.invalidateQueries({ queryKey: qk.proposals.all });
      // Set the new proposal data in cache
      queryClient.setQueryData(qk.proposals.byId(data.id), data);
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
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      logDebug('Updating proposal', {
        component: 'useUpdateProposal',
        operation: 'updateProposal',
        proposalId: id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      try {
        const startTime = Date.now();
        const proposal = await proposalService.updateProposal(id, data);
        const loadTime = Date.now() - startTime;

        logInfo('Proposal updated successfully', {
          component: 'useUpdateProposal',
          operation: 'updateProposal',
          proposalId: id,
          loadTime,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        });

        return proposal;
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
      // Update the specific proposal in cache
      queryClient.setQueryData(qk.proposals.byId(variables.id), data);
      // Invalidate proposals list to reflect changes
      queryClient.invalidateQueries({ queryKey: qk.proposals.all });
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
        await proposalService.deleteProposal(id);
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
      queryClient.removeQueries({ queryKey: qk.proposals.byId(id) });
      // Invalidate proposals list
      queryClient.invalidateQueries({ queryKey: qk.proposals.all });
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
