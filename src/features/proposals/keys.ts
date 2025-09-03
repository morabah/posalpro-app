/**
 * PosalPro MVP2 - Proposal Query Keys
 * Centralized React Query keys for proposal-related queries
 * Standardized structure for consistency across feature modules
 * Follows assessment recommendations for maintainability
 * ✅ ALIGNS: API route schemas for consistent frontend-backend integration
 */

export const qk = {
  proposals: {
    // ====================
    // Base Query Keys
    // ====================
    all: ['proposals'] as const,
    lists: () => [...qk.proposals.all, 'list'] as const,

    // ====================
    // Standard CRUD Keys
    // ====================
    list: (
      search: string,
      limit: number,
      sortBy: string,
      sortOrder: 'asc' | 'desc',
      filters?: Record<string, unknown>
    ) => [...qk.proposals.lists(), { search, limit, sortBy, sortOrder, filters }] as const,

    byId: (id: string) => [...qk.proposals.all, 'byId', id] as const,
    search: (query: string, limit: number) =>
      [...qk.proposals.all, 'search', query, limit] as const,

    // ====================
    // Feature-Specific Keys
    // ====================
    stats: () => [...qk.proposals.all, 'stats'] as const,
    due: (
      dueBefore?: string,
      dueAfter?: string,
      openOnly?: boolean,
      limit: number = 10,
      sortBy: string = 'dueDate',
      sortOrder: 'asc' | 'desc' = 'asc'
    ) =>
      [
        ...qk.proposals.all,
        'due',
        dueBefore,
        dueAfter,
        openOnly,
        limit,
        sortBy,
        sortOrder,
      ] as const,
  },
} as const;
