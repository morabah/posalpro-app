/**
 * Content Feature Module
 * User Story: US-6.3 (Content Management), US-6.4 (Content Templates)
 * Hypothesis: H12 (Content caching improves performance), H13 (Template prefetching enhances user experience)
 *
 * ✅ SINGLE FEATURE EXPORT FILE - Follows CORE_REQUIREMENTS.md standards
 * ✅ CENTRALIZED EXPORTS - All content-related functionality in one place
 * ✅ CLEAN ARCHITECTURE - Separation of concerns with hooks, schemas, and keys
 */

// ====================
// Advanced Caching and Enhanced Hooks
// ====================

export { useContentCache } from './hooks/useContentCache';
export { useContentEnhanced } from './hooks/useContentEnhanced';

// ====================
// Future Exports (when implemented)
// ====================

// TODO: Add when content schemas are implemented
// export * from './schemas';

// TODO: Add when content keys are implemented
// export { contentKeys } from './keys';

// TODO: Add when content hooks are implemented
// export * from './hooks';
