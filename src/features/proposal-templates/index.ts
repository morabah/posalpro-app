/**
 * Proposal Templates Feature Module
 * User Story: US-3.5 (Template Management), US-3.6 (Template Reuse)
 * Hypothesis: H16 (Template caching improves creation speed), H17 (Template reuse enhances efficiency)
 *
 * ✅ SINGLE FEATURE EXPORT FILE - Follows CORE_REQUIREMENTS.md standards
 * ✅ CENTRALIZED EXPORTS - All template-related functionality in one place
 * ✅ CLEAN ARCHITECTURE - Separation of concerns with hooks, schemas, and keys
 */

// ====================
// Advanced Caching and Enhanced Hooks
// ====================

export { useTemplatesCache } from './hooks/useTemplatesCache';
export { useTemplatesEnhanced } from './hooks/useTemplatesEnhanced';

// ====================
// Future Exports (when implemented)
// ====================

// TODO: Add when template schemas are implemented
// export * from './schemas';

// TODO: Add when template keys are implemented
// export { templateKeys } from './keys';

// TODO: Add when template hooks are implemented
// export * from './hooks';
