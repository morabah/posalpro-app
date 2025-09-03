/**
 * Search Feature Module
 * User Story: US-4.1 (Content Search), US-4.2 (Advanced Search)
 * Hypothesis: H3 (Search Efficiency)
 *
 * ✅ SINGLE FEATURE EXPORT FILE - Follows CORE_REQUIREMENTS.md standards
 * ✅ CENTRALIZED EXPORTS - All search-related functionality in one place
 * ✅ CLEAN ARCHITECTURE - Separation of concerns with hooks, schemas, and keys
 */

// ====================
// Feature Keys
// ====================

export { qk as searchKeys } from './keys';

// ====================
// Feature Schemas
// ====================

export type {
  SearchQuery,
  SearchSuggestionsQuery,
  SearchFilters,
  SearchResult,
  PaginationInfo,
  SearchFacets,
  SearchResponse,
} from './schemas';

export {
  SearchQuerySchema,
  SearchSuggestionsQuerySchema,
  SearchFiltersSchema,
  SearchResultSchema,
  PaginationInfoSchema,
  SearchFacetsSchema,
  SearchResponseSchema,
  databaseIdSchema,
  validateSearchQuery,
  validateSearchSuggestionsQuery,
  parseSearchFilters,
  sortByRelevance,
  sortByField,
  calculateRelevanceScore,
} from './schemas';

// ====================
// Feature Hooks
// ====================

// Note: Search hooks are still under development
// Export any search-related hooks here when they are implemented
