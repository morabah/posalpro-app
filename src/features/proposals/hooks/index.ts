/**
 * PosalPro MVP2 - Proposals Hooks Index
 * Centralized exports for proposal-related React Query hooks
 */

// Export existing proposal hooks from main hooks directory to avoid duplication
export {
  useProposal,
  useInfiniteProposals,
  useProposalsByIds,
  useProposalStats,
  useCreateProposal,
  useUpdateProposal,
  useDeleteProposal,
  useDeleteProposalsBulk
} from '@/hooks/useProposals';

// UNIQUE FUNCTIONALITY - Only export the non-duplicate hook
export { usePersistProposalWizard } from './useProposalServerState';

// ===========================================
// 🚨 DEPRECATED EXPORTS - DO NOT USE 🚨
// ===========================================
// The following functions are DUPLICATES and should NOT be exported:
// - useCreateProposal() → Use from src/hooks/useProposal.ts or src/hooks/useProposals.ts
// - useUpdateProposal() → Use from src/hooks/useProposal.ts or src/hooks/useProposals.ts
// - useDeleteProposal() → Use from src/hooks/useProposal.ts or src/hooks/useProposals.ts
//
// These functions were removed to prevent duplication with existing, well-established hooks
