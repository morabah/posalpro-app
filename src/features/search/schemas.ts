/**
 * PosalPro MVP2 - Search Feature Schemas
 * Centralized Zod schemas for search operations
 * Based on global search functionality and advanced search requirements
 *
 * Component Traceability Matrix:
 * - User Stories: US-4.1 (Content Search), US-4.2 (Advanced Search)
 * - Acceptance Criteria: AC-4.1.1, AC-4.1.2, AC-4.2.1, AC-4.2.2
 * - Hypotheses: H3 (Search Efficiency), H4 (Advanced Search)
 * - Test Cases: TC-H3-001, TC-H3-002, TC-H4-001, TC-H4-002
 */

import { z } from 'zod';

// ====================
// Search Query Schemas
// ====================

/**
 * Database-agnostic ID validation (CORE_REQUIREMENTS.md)
 */
export const databaseIdSchema = z
  .string()
  .min(1, 'ID is required')
  .refine(id => id !== 'undefined' && id.trim().length > 0);

/**
 * Enhanced search query validation schema with cursor pagination
 * Used by global search API and search components
 */
export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  type: z.enum(['all', 'content', 'proposals', 'products', 'customers', 'users']).default('all'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['relevance', 'date', 'title', 'status', 'id']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  cursor: databaseIdSchema.optional(),
  fields: z.array(z.string()).optional(),
  filters: z.string().optional(),
});

/**
 * Search suggestions query schema
 * Used by search suggestions API
 */
export const SearchSuggestionsQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  type: z.enum(['all', 'content', 'proposals', 'products', 'customers', 'users']).optional(),
  limit: z.coerce.number().min(1).max(10).default(5),
});

// ====================
// Search Filter Schemas
// ====================

/**
 * Search filters interface (used internally for parsing)
 */
export const SearchFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  customerId: z.string().optional(),
  userId: z.string().optional(),
  contentType: z.string().optional(),
  priceRange: z.tuple([z.number(), z.number()]).optional(),
  industry: z.string().optional(),
  tier: z.string().optional(),
  department: z.string().optional(),
  role: z.string().optional(),
}).catchall(z.unknown()); // Allow additional filter fields

// ====================
// Search Response Schemas
// ====================

/**
 * Individual search result schema
 */
export const SearchResultSchema = z.object({
  id: z.string(),
  entityType: z.string(),
  title: z.string().optional(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  relevanceScore: z.number().optional(),
  url: z.string().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  type: z.string().optional(),
  tags: z.array(z.string()).nullable().optional(),
  status: z.string().optional(),
}).catchall(z.unknown()); // Allow additional fields

/**
 * Pagination information schema
 */
export const PaginationInfoSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasMore: z.boolean(),
  nextPage: z.number().nullable(),
  prevPage: z.number().nullable(),
  nextCursor: z.string().nullable().optional(),
});

/**
 * Search facets schema (for advanced filtering UI)
 */
export const SearchFacetsSchema = z.object({
  types: z.array(z.object({
    type: z.string(),
    count: z.number(),
  })),
  statuses: z.array(z.object({
    status: z.string(),
    count: z.number(),
  })),
  dateRanges: z.array(z.object({
    range: z.string(),
    count: z.number(),
  })),
});

/**
 * Complete search response schema
 */
export const SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema),
  pagination: PaginationInfoSchema,
  facets: SearchFacetsSchema,
  searchTerm: z.string(),
  totalTime: z.number(),
  suggestions: z.array(z.string()),
  meta: z.object({
    paginationType: z.enum(['cursor', 'offset']),
    paginationReason: z.string(),
    totalCount: z.number(),
    executionTime: z.number(),
  }),
});

// ====================
// Type Exports
// ====================

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchSuggestionsQuery = z.infer<typeof SearchSuggestionsQuerySchema>;
export type SearchFilters = z.infer<typeof SearchFiltersSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type PaginationInfo = z.infer<typeof PaginationInfoSchema>;
export type SearchFacets = z.infer<typeof SearchFacetsSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

// ====================
// Search Utility Functions
// ====================

/**
 * Validate search query parameters
 */
export function validateSearchQuery(query: unknown): SearchQuery {
  return SearchQuerySchema.parse(query);
}

/**
 * Validate search suggestions query parameters
 */
export function validateSearchSuggestionsQuery(query: unknown): SearchSuggestionsQuery {
  return SearchSuggestionsQuerySchema.parse(query);
}

/**
 * Parse search filters from string
 */
export function parseSearchFilters(filtersString: string): SearchFilters {
  try {
    const parsed = JSON.parse(filtersString);
    return SearchFiltersSchema.parse(parsed);
  } catch (error) {
    throw new Error('Invalid search filters format');
  }
}

/**
 * Sort results by relevance score
 */
export function sortByRelevance(results: SearchResult[], searchTerm: string): SearchResult[] {
  return results.sort((a, b) => {
    const scoreA = calculateRelevanceScore(a, searchTerm);
    const scoreB = calculateRelevanceScore(b, searchTerm);
    return scoreB - scoreA;
  });
}

/**
 * Sort results by specified field
 */
export function sortByField(results: SearchResult[], field: string, order: 'asc' | 'desc'): SearchResult[] {
  return results.sort((a, b) => {
    let valueA: string | number | Date = a[field] as string | number | Date;
    let valueB: string | number | Date = b[field] as string | number | Date;

    // Handle different field types
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }

    // Handle missing values for title/name
    if (field === 'title') {
      valueA = a.title || a.name || '';
      valueB = b.title || b.name || '';
    }

    if (valueA < valueB) return order === 'asc' ? -1 : 1;
    if (valueA > valueB) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Calculate relevance score for search result
 */
export function calculateRelevanceScore(item: SearchResult, searchTerm: string): number {
  let score = 0;
  const term = searchTerm.toLowerCase();

  // Title/name match gets highest score
  const title = item.title || item.name || '';
  if (title.toLowerCase().includes(term)) {
    score += title.toLowerCase() === term ? 100 : 50;
  }

  // Description match
  if (item.description?.toLowerCase().includes(term)) {
    score += 25;
  }

  // Tag match
  if (item.tags?.some((tag: string) => tag.toLowerCase().includes(term))) {
    score += 15;
  }

  // Exact matches get bonus
  if (title.toLowerCase() === term) {
    score += 200;
  }

  return score;
}
