/**
 * PosalPro MVP2 - Customer Query Keys
 * Centralized React Query keys for customer-related queries
 * Standardized structure for consistency across feature modules
 * Follows assessment recommendations for maintainability
 */

// Local type aliases to keep query key signatures expressive without adding cross-feature imports
type CustomerSortBy = 'createdAt' | 'name' | 'status' | 'revenue';
type CustomerSortOrder = 'asc' | 'desc';
type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'PROSPECT';
type CustomerTier = 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';

export const qk = {
  customers: {
    // ====================
    // Base Query Keys
    // ====================
    all: ['customers'] as const,
    lists: () => [...qk.customers.all, 'list'] as const,

    // ====================
    // Standard CRUD Keys
    // ====================
    list: (
      search: string,
      limit: number,
      sortBy: string,
      sortOrder: 'asc' | 'desc',
      cursor?: string,
      filters?: Record<string, unknown>
    ) => [...qk.customers.lists(), { search, limit, sortBy, sortOrder, cursor, filters }] as const,

    byId: (id: string) => [...qk.customers.all, 'byId', id] as const,
    search: (query: string, limit: number) =>
      [...qk.customers.all, 'search', query, limit] as const,

    // ====================
    // Feature-Specific Keys
    // ====================
    details: () => [...qk.customers.all, 'detail'] as const,
    detail: (id: string) => [...qk.customers.details(), id] as const,
    stats: () => [...qk.customers.all, 'stats'] as const,
  },
} as const;
