/**
 * PosalPro MVP2 - Proposal Query Keys
 * Centralized React Query keys for proposal-related queries
 * Follows assessment recommendations for consistency and maintainability
 * ✅ ALIGNS: API route schemas for consistent frontend-backend integration
 */

export const qk = {
  proposals: {
    all: ['proposals'] as const,
    list: (
      search: string,
      limit: number,
      sortBy: 'createdAt' | 'updatedAt' | 'title' | 'status' | 'priority' | 'value',
      sortOrder: 'asc' | 'desc',
      status?: string,
      priority?: string,
      customerId?: string,
      assignedTo?: string
    ) =>
      [
        'proposals',
        'list',
        search,
        limit,
        sortBy,
        sortOrder,
        status,
        priority,
        customerId,
        assignedTo,
      ] as const,
    byId: (id: string) => ['proposals', 'byId', id] as const,
    search: (query: string, limit: number) => ['proposals', 'search', query, limit] as const,
    stats: () => ['proposals', 'stats'] as const,
  },
} as const;
