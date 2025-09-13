/**
 * PosalPro MVP2 - Product Query Keys
 * Centralized React Query keys for product-related queries
 * Standardized structure for consistency across feature modules
 * Follows assessment recommendations for maintainability
 */

export const qk = {
  products: {
    // ====================
    // Base Query Keys
    // ====================
    all: ['products'] as const,
    lists: () => [...qk.products.all, 'list'] as const,

    // ====================
    // Standard CRUD Keys
    // ====================
    list: (
      search: string,
      category: string | undefined,
      limit: number,
      sortBy: string,
      sortOrder: 'asc' | 'desc',
      cursor?: string,
      filters?: Record<string, unknown>
    ) =>
      [
        ...qk.products.lists(),
        { search, category, limit, sortBy, sortOrder, cursor, filters },
      ] as const,

    byId: (id: string) => [...qk.products.all, 'byId', id] as const,
    search: (query: string, limit: number) => [...qk.products.all, 'search', query, limit] as const,

    // ====================
    // Feature-Specific Keys
    // ====================
    stats: () => [...qk.products.all, 'stats'] as const,
    categories: () => [...qk.products.all, 'categories'] as const,
    tags: () => [...qk.products.all, 'tags'] as const,
    relationships: (productId: string) => [...qk.products.all, 'relationships', productId] as const,
    images: (productId: string) => [...qk.products.all, 'images', productId] as const,
  },
} as const;

// Export for backward compatibility and easier imports
export const productKeys = qk.products;
