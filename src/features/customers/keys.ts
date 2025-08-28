/**
 * PosalPro MVP2 - Customer Query Keys
 * Centralized React Query keys for customer-related queries
 * Follows assessment recommendations for consistency and maintainability
 */

// Local type aliases to keep query key signatures expressive without adding cross-feature imports
type CustomerSortBy = 'createdAt' | 'name' | 'status' | 'revenue';
type CustomerSortOrder = 'asc' | 'desc';
type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'PROSPECT';
type CustomerTier = 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';

export const qk = {
  customers: {
    all: ['customers'] as const,
    lists: () => [...qk.customers.all, 'list'] as const,
    list: (
      search: string,
      limit: number,
      sortBy: CustomerSortBy,
      sortOrder: CustomerSortOrder,
      status?: CustomerStatus,
      tier?: CustomerTier,
      industry?: string
    ) =>
      [
        ...qk.customers.lists(),
        {
          search,
          limit,
          sortBy,
          sortOrder,
          status,
          tier,
          industry,
        },
      ] as const,
    details: () => [...qk.customers.all, 'detail'] as const,
    detail: (id: string) => [...qk.customers.details(), id] as const,
    search: (query: string, limit: number) =>
      [...qk.customers.all, 'search', query, limit] as const,
  },
} as const;
