// __FILE_DESCRIPTION__: Centralized React Query keys (feature-based)
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

/**
 * Centralized query keys must use stable primitives only.
 * Avoid passing objects directly; if you need custom filters, append them
 * as ordered primitives via the variadic `extras` parameter.
 */

export const qk = {
  __RESOURCE__: {
    all: ['__RESOURCE__'] as const,

    /**
     * List keys with common primitives + domain extras.
     * Example usage (customers): qk.customers.list('', 20, 'createdAt', 'desc', status, region)
     */
    list: (
      search: string = '',
      limit: number = 20,
      sortBy: string = 'createdAt',
      sortOrder: 'asc' | 'desc' = 'desc',
      ...extras: (string | number | boolean | null | undefined)[]
    ) => ['__RESOURCE__', 'list', search, limit, sortBy, sortOrder, ...extras] as const,

    byId: (id: string) => ['__RESOURCE__', 'byId', id] as const,

    /**
     * Optional: search key for typeahead/suggestions
     */
    search: (query: string, limit: number = 10) => ['__RESOURCE__', 'search', query, limit] as const,

    /**
     * Optional: stats/dashboard data
     */
    stats: () => ['__RESOURCE__', 'stats'] as const,
  },
} as const;

