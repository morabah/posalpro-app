/**
 * PosalPro MVP2 - Product Query Keys
 * Centralized React Query keys for product-related queries
 * Follows assessment recommendations for consistency and maintainability
 */

export const qk = {
  products: {
    all: ["products"] as const,
    list: (
      search: string,
      limit: number,
      sortBy: "createdAt" | "name" | "price" | "isActive",
      sortOrder: "asc" | "desc",
      category?: string,
      isActive?: boolean
    ) => ["products", "list", search, limit, sortBy, sortOrder, category, isActive] as const,
    byId: (id: string) => ["products", "byId", id] as const,
    search: (query: string, limit: number) => ["products", "search", query, limit] as const,
    relationships: (productId: string) => ["products", "relationships", productId] as const,
    stats: () => ["products", "stats"] as const,
    categories: () => ["products", "categories"] as const,
    tags: () => ["products", "tags"] as const,
  },
} as const;
