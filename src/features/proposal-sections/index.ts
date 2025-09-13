/**
 * Proposal Sections Feature Module
 * User Story: US-3.3 (Proposal Sections), US-3.4 (Section Management)
 * Hypothesis: H14 (Section caching improves proposal performance), H15 (Bulk operations enhance efficiency)
 *
 * ✅ SINGLE FEATURE EXPORT FILE - Follows CORE_REQUIREMENTS.md standards
 * ✅ CENTRALIZED EXPORTS - All proposal sections-related functionality in one place
 * ✅ CLEAN ARCHITECTURE - Separation of concerns with hooks, schemas, and keys
 */

// ====================
// Advanced Caching and Enhanced Hooks
// ====================

export { useProposalSectionsCache } from './hooks/useProposalSectionsCache';
export { useProposalSectionsEnhanced } from './hooks/useProposalSectionsEnhanced';

// ====================
// Existing Exports
// ====================

// Re-export schemas
export * from './schemas';

// Re-export keys
export { sectionKeys } from './keys';

// Re-export hooks
export * from './hooks';
