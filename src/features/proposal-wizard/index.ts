/**
 * Proposal Wizard Feature Module
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H18 (Wizard caching improves creation speed), H19 (Step prefetching enhances user experience)
 *
 * ✅ SINGLE FEATURE EXPORT FILE - Follows CORE_REQUIREMENTS.md standards
 * ✅ CENTRALIZED EXPORTS - All proposal wizard-related functionality in one place
 * ✅ CLEAN ARCHITECTURE - Separation of concerns with hooks, schemas, and keys
 */

// ====================
// Advanced Caching and Enhanced Hooks
// ====================

export { useProposalWizardCache } from './hooks/useProposalWizardCache';
export { useProposalWizardEnhanced } from './hooks/useProposalWizardEnhanced';

// ====================
// Future Exports (when implemented)
// ====================

// TODO: Add when wizard schemas are implemented
// export * from './schemas';

// TODO: Add when wizard keys are implemented
// export { wizardKeys } from './keys';

// TODO: Add when wizard hooks are implemented
// export * from './hooks';
