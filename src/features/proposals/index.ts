/**
 * Proposals Feature Module
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 *
 * ✅ SINGLE FEATURE EXPORT FILE - Follows CORE_REQUIREMENTS.md standards
 * ✅ CENTRALIZED EXPORTS - All proposal-related functionality in one place
 * ✅ CLEAN ARCHITECTURE - Separation of concerns with hooks, schemas, and keys
 */

// ====================
// Feature Keys
// ====================

export { qk as proposalKeys } from './keys';

// ====================
// Feature Schemas
// ====================

export type {
  BasicInformation,
  ContentSelection,
  ProductSelection,
  Proposal,
  ProposalCreateData,
  ProposalMetadata,
  ProposalPriority,
  ProposalQueryData,
  ProposalStatus,
  ProposalUpdateData,
  ProposalWizardData,
  Review,
  SectionAssignment,
  TeamAssignment,
  WizardProposalUpdateData,
} from './schemas';

export {
  BasicInformationSchema,
  ContentSelectionSchema,
  ProductSelectionSchema,
  ProposalBulkDeleteSchema,
  ProposalCreateSchema,
  ProposalListSchema,
  ProposalMetadataSchema,
  ProposalPlanTypeSchema,
  ProposalPrioritySchema,
  ProposalQuerySchema,
  ProposalRiskLevelSchema,
  ProposalSchema,
  ProposalStatusSchema,
  ProposalUpdateSchema,
  ProposalVersionsQuerySchema,
  ProposalWizardSchema,
  ProposalWorkflowBulkUpdateSchema,
  ProposalWorkflowStatusUpdateSchema,
  ReviewSchema,
  SectionAssignmentSchema,
  TeamAssignmentSchema,
  WizardProposalUpdateSchema,
} from './schemas';

// ====================
// Feature Hooks
// ====================

export {
  useCreateProposal,
  useDeleteProposal,
  useDeleteProposalsBulk,
  useDueProposals,
  useInfiniteProposals,
  useProposal,
  useProposalStats,
  useProposalsByIds,
  useUpdateProposal,
} from './hooks';

// ====================
// Advanced Caching and Enhanced Hooks
// ====================

export { useProposalCache } from './hooks/useProposalCache';
export { useProposalEnhanced } from './hooks/useProposalEnhanced';
