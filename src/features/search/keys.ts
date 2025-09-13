/**
 * Centralized React Query keys for search feature
 */

export const qk = {
  search: {
    suggestions: (
      q: string,
      type: 'all' | 'content' | 'proposals' | 'products' | 'customers' = 'all',
      limit: number = 10
    ) => ['search', 'suggestions', q, type, limit] as const,

    searchResults: (query: string, module: string) =>
      ['search', 'results', query, module] as const,
  },
} as const;
