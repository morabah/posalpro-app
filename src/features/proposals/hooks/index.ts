/**
 * PosalPro MVP2 - Proposals Hooks Index
 * Centralized exports for proposal-related React Query hooks
 * All hooks are now implemented locally within the features module
 */

// Export local proposal hook implementations
export {
  useProposal,
  useInfiniteProposals,
  useProposalsByIds,
  useProposalStats,
  useDueProposals,
  useCreateProposal,
  useUpdateProposal,
  useDeleteProposal,
  useDeleteProposalsBulk
} from './useProposals';

// UNIQUE FUNCTIONALITY - Server state persistence hook
export { usePersistProposalWizard } from './useProposalServerState';
