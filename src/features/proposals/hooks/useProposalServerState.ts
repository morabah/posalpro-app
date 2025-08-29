/**
 * PosalPro MVP2 - Proposal Wizard Persistence Hook
 * UNIQUE FUNCTIONALITY: Handles wizard data persistence to server
 * This is the ONLY unique hook in this file - replaces isPersisting, persistenceErrors, lastPersistedAt from store
 * Component Traceability: US-3.1, US-3.2, H4
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '../keys';
import { proposalService } from '@/services/proposalService';

/**
 * UNIQUE HOOK: Persists proposal wizard data to server
 * Replaces isPersisting, persistenceErrors, lastPersistedAt from unifiedProposalStore
 * This is the ONLY non-duplicate functionality in this file
 */
export function usePersistProposalWizard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      proposalId,
      wizardData,
      step,
    }: {
      proposalId: string;
      wizardData: any;
      step?: number;
    }): Promise<{ success: boolean; timestamp: number }> => {
      // Use the existing service which transforms wizard payload to API schema
      const res = await proposalService.updateProposal(proposalId, wizardData);

      if (!res.ok) {
        throw new Error(res.message || 'Failed to persist proposal wizard data');
      }

      return { success: true, timestamp: Date.now() };
    },
    onSuccess: (data, variables) => {
      // Update the proposal query with the new persisted data
      queryClient.invalidateQueries({ queryKey: qk.proposals.byId(variables.proposalId) });
    },
  });
}

// ===========================================
// 🚨 DEPRECATED FUNCTIONS - DO NOT USE 🚨
// ===========================================
// The functions below are DUPLICATES of existing hooks:
// - useProposal() → Use from src/hooks/useProposal.ts or src/hooks/useProposals.ts
// - useCreateProposal() → Use from src/hooks/useProposal.ts or src/hooks/useProposals.ts
// - useUpdateProposal() → Use from src/hooks/useProposal.ts or src/hooks/useProposals.ts
// - useDeleteProposal() → Use from src/hooks/useProposal.ts or src/hooks/useProposals.ts
//
// This file should ONLY contain usePersistProposalWizard() - the unique functionality
// All other functions should be imported from the existing, well-established hook files
