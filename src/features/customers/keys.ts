/**
 * PosalPro MVP2 - Customer Query Keys
 * Centralized React Query keys for customer-related queries
 * Follows assessment recommendations for consistency and maintainability
 */

export const qk = {
  customers: {
    all: ['customers'] as const,
    lists: () => [...qk.customers.all, 'list'] as const,
    list: (
      search: string,
      limit: number,
      sortBy: 'createdAt' | 'name' | 'status' | 'revenue',
      sortOrder: 'asc' | 'desc'
    ) => [...qk.customers.lists(), search, limit, sortBy, sortOrder] as const,
    details: () => [...qk.customers.all, 'detail'] as const,
    detail: (id: string) => [...qk.customers.details(), id] as const,
    search: (query: string, limit: number) =>
      [...qk.customers.all, 'search', query, limit] as const,
  },
} as const;
