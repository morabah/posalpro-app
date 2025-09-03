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
  TeamAssignment,
  ContentSelection,
  ProductSelection,
  SectionAssignment,
  Review,
  ProposalWizardData,
  ProposalCreateData,
  ProposalQueryData,
  ProposalUpdateData,
  WizardProposalUpdateData,
  ProposalMetadata,
  Proposal,
} from './schemas';

export {
  ProposalStatusSchema,
  ProposalPrioritySchema,
  ProposalRiskLevelSchema,
  ProposalPlanTypeSchema,
  BasicInformationSchema,
  TeamAssignmentSchema,
  ContentSelectionSchema,
  ProductSelectionSchema,
  SectionAssignmentSchema,
  ReviewSchema,
  ProposalMetadataSchema,
  ProposalQuerySchema,
  ProposalCreateSchema,
  ProposalUpdateSchema,
  WizardProposalUpdateSchema,
  ProposalSchema,
  ProposalListSchema,
  ProposalBulkDeleteSchema,
  ProposalVersionsQuerySchema,
  ProposalWorkflowStatusUpdateSchema,
  ProposalWorkflowBulkUpdateSchema,
  ProposalWizardSchema,
} from './schemas';

// ====================
// Feature Hooks
// ====================

export {
  useInfiniteProposals,
  useProposal,
  useProposalsByIds,
  useProposalStats,
  useDueProposals,
  useCreateProposal,
  useUpdateProposal,
  useDeleteProposal,
  useDeleteProposalsBulk,
} from './hooks';
