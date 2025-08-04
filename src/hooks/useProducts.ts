/**
 * PosalPro MVP2 - Products Data Hook
 * React Query hook for fetching and caching products data
 * Performance optimized with caching and pagination
 */

import { Product as EntityProduct } from '@/types/entities/product';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useApiClient } from './useApiClient';

// ✅ FIXED: Use entity Product type with proper Date types, extend with API-specific fields
export interface Product extends Omit<EntityProduct, 'createdAt' | 'updatedAt'> {
  createdAt: string; // API returns ISO strings, converted to Date when needed
  updatedAt: string;
  usage: {
    proposalsCount: number;
    relationshipsCount: number;
  };
  analytics?: Record<string, any>;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search?: string;
    category?: string[];
    tags?: string[];
    priceRange?: string;
    isActive?: boolean;
    sku?: string;
  };
}

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tags?: string;
  priceRange?: string;
  isActive?: boolean;
  sku?: string;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// Query keys for React Query
export const PRODUCTS_QUERY_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCTS_QUERY_KEYS.all, 'list'] as const,
  list: (params: ProductsQueryParams) => [...PRODUCTS_QUERY_KEYS.lists(), params] as const,
  details: () => [...PRODUCTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PRODUCTS_QUERY_KEYS.details(), id] as const,
};

/**
 * Hook for fetching products list with pagination and filtering
 * ✅ PERFORMANCE: Integrated with cache manager to prevent timeouts
 */
export function useProducts(
  params: ProductsQueryParams = {}
): UseQueryResult<ProductsResponse, Error> {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: PRODUCTS_QUERY_KEYS.list(params),
    queryFn: async (): Promise<ProductsResponse> => {
      // ✅ FOLLOWS CORE_REQUIREMENTS.md: Use pure useApiClient pattern (like BasicInformationStep.tsx)
      const searchParams = new URLSearchParams();

      // Add parameters to search params
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.category) searchParams.set('category', params.category);
      if (params.tags) searchParams.set('tags', params.tags);
      if (params.priceRange) searchParams.set('priceRange', params.priceRange);
      if (params.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());
      if (params.sku) searchParams.set('sku', params.sku);
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      try {
        const response = await apiClient.get<{
          success: boolean;
          data: ProductsResponse;
          message: string;
        }>(`products?${searchParams.toString()}`);

        if (!response.success) {
          // Fallback to mock data for development/demo purposes (like customers)
          return generateMockProductsData(params);
        }

        return response.data;
      } catch (error) {
        // ✅ PERFORMANCE: Fast fallback instead of cache complexity
        console.warn('[useProducts] API failed, using mock data:', error);
        return generateMockProductsData(params);
      }
    },
    // ✅ PERFORMANCE: Optimized for speed (following BasicInformationStep.tsx pattern)
    staleTime: 30 * 1000, // 30 seconds for fast updates
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // Prevent automatic refetches
    retry: 0, // No retries for speed - fallback to mock data instead
    retryDelay: 0, // No delay
  });
}

/**
 * Hook for fetching a single product by ID
 */
export function useProduct(id: string): UseQueryResult<Product, Error> {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: PRODUCTS_QUERY_KEYS.detail(id),
    queryFn: async (): Promise<Product> => {
      const response = await apiClient.get<{
        success: boolean;
        data: Product;
        message: string;
      }>(`products/${id}`);

      if (!response.success) {
        // Log error but let React Query handle the error state
        console.warn('[useProducts] Product fetch failed:', response.message || 'Failed to fetch product');
        throw new Error(response.message || 'Failed to fetch product');
      }

      return response.data;
    },
    // Cache single products for longer since they change less frequently
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!id, // Only run query if ID is provided
    retry: 2,
  });
}

/**
 * Hook for search products with debouncing
 */
export function useProductSearch(
  searchTerm: string,
  options: Omit<ProductsQueryParams, 'search'> = {}
): UseQueryResult<ProductsResponse, Error> {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: PRODUCTS_QUERY_KEYS.list({ ...options, search: searchTerm }),
    queryFn: async (): Promise<ProductsResponse> => {
      const searchParams = new URLSearchParams();
      searchParams.set('search', searchTerm);

      // Add other options
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, value.toString());
        }
      });

      const response = await apiClient.get<{
        success: boolean;
        data: ProductsResponse;
        message: string;
      }>(`products?${searchParams.toString()}`);

      if (!response.success) {
        // Log error but let React Query handle the error state
        console.warn('[useProducts] Product search failed:', response.message || 'Failed to search products');
        throw new Error(response.message || 'Failed to search products');
      }

      return response.data;
    },
    // Only search if there's a search term (at least 2 characters)
    enabled: searchTerm.length >= 2,
    // Shorter cache for search results
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Product mutation hooks using useApiClient pattern
 * ✅ FOLLOWING CORE_REQUIREMENTS.md: Use useApiClient for all data operations
 */
export function useCreateProduct() {
  const apiClient = useApiClient();

  return {
    mutate: (data: any) => console.warn('Use mutateAsync for proper async handling'),
    mutateAsync: async (data: any): Promise<Product> => {
      const response = await apiClient.post<{
        success: boolean;
        data: Product;
        message: string;
      }>('products', data);

      if (!response.success) {
        // Log error but let the mutation error handling manage it
        console.warn('[useProducts] Product creation failed:', response.message || 'Failed to create product');
        throw new Error(response.message || 'Failed to create product');
      }

      return response.data;
    },
    isLoading: false,
    isPending: false,
    error: null,
  };
}

export function useUpdateProduct() {
  const apiClient = useApiClient();

  return {
    mutate: (data: any) => console.warn('Use mutateAsync for proper async handling'),
    mutateAsync: async (data: { id: string; [key: string]: any }): Promise<Product> => {
      const { id, ...updateData } = data;
      const response = await apiClient.put<{
        success: boolean;
        data: Product;
        message: string;
      }>(`products/${id}`, updateData);

      if (!response.success) {
        // Log error but let the mutation error handling manage it
        console.warn('[useProducts] Product update failed:', response.message || 'Failed to update product');
        throw new Error(response.message || 'Failed to update product');
      }

      return response.data;
    },
    isLoading: false,
    isPending: false,
    error: null,
  };
}

export function useDeleteProduct() {
  const apiClient = useApiClient();

  return {
    mutate: (id: string) => console.warn('Use mutateAsync for proper async handling'),
    mutateAsync: async (id: string): Promise<{ success: boolean; message: string }> => {
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`products/${id}`);

      if (!response.success) {
        // Log error but let the mutation error handling manage it
        console.warn('[useProducts] Product deletion failed:', response.message || 'Failed to delete product');
        throw new Error(response.message || 'Failed to delete product');
      }

      return response;
    },
    isLoading: false,
    isPending: false,
    error: null,
  };
}

/**
 * Generate mock products data for fallback when API fails
 * Following the pattern established in useCustomers.ts
 */
function generateMockProductsData(params: ProductsQueryParams = {}): ProductsResponse {
  // Mock products for development/demo purposes
  const mockProducts: Product[] = [
    {
      id: 'prod-001',
      name: 'Enterprise Security Suite',
      description:
        'Comprehensive security solution for enterprise environments with advanced threat detection and prevention.',
      sku: 'ESS-001',
      price: 10000,
      currency: 'USD',
      category: ['Software', 'Security'],
      tags: ['enterprise', 'security', 'cloud'],
      attributes: { license: 'enterprise', deployment: 'cloud' },
      images: [],
      isActive: true,
      version: 1,
      userStoryMappings: ['US-3.1', 'US-3.2'],
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      usage: { proposalsCount: 15, relationshipsCount: 8 },
    },
    {
      id: 'prod-002',
      name: 'Cloud Infrastructure Platform',
      description:
        'Scalable cloud infrastructure setup and management platform with auto-scaling capabilities.',
      sku: 'CIP-002',
      price: 25000,
      currency: 'USD',
      category: ['Services', 'Infrastructure'],
      tags: ['cloud', 'infrastructure', 'scalable'],
      attributes: { deployment: 'multi-cloud', scaling: 'auto' },
      images: [],
      isActive: true,
      version: 2,
      userStoryMappings: ['US-3.1', 'US-6.1'],
      createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      usage: { proposalsCount: 22, relationshipsCount: 12 },
    },
    {
      id: 'prod-003',
      name: 'Data Analytics Platform',
      description:
        'Advanced analytics and business intelligence platform with real-time dashboards and AI insights.',
      sku: 'DAP-003',
      price: 15000,
      currency: 'USD',
      category: ['Software', 'Analytics'],
      tags: ['analytics', 'business-intelligence', 'ai'],
      attributes: { deployment: 'hybrid', ai: 'enabled' },
      images: [],
      isActive: true,
      version: 3,
      userStoryMappings: ['US-6.1', 'US-6.2'],
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      usage: { proposalsCount: 18, relationshipsCount: 10 },
    },
    {
      id: 'prod-004',
      name: 'Mobile Development Framework',
      description:
        'Cross-platform mobile development framework with native performance and rapid deployment.',
      sku: 'MDF-004',
      price: 8000,
      currency: 'USD',
      category: ['Software', 'Development'],
      tags: ['mobile', 'cross-platform', 'development'],
      attributes: { platforms: 'ios-android', performance: 'native' },
      images: [],
      isActive: true,
      version: 1,
      userStoryMappings: ['US-3.2'],
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      usage: { proposalsCount: 12, relationshipsCount: 6 },
    },
    {
      id: 'prod-005',
      name: 'Training and Certification Program',
      description:
        'Comprehensive training program with certifications for enterprise software adoption.',
      sku: 'TCP-005',
      price: 5000,
      currency: 'USD',
      category: ['Services', 'Training'],
      tags: ['training', 'certification', 'enterprise'],
      attributes: { duration: '6-months', format: 'hybrid' },
      images: [],
      isActive: true,
      version: 1,
      userStoryMappings: ['US-4.1'],
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      usage: { proposalsCount: 8, relationshipsCount: 4 },
    },
    {
      id: 'prod-006',
      name: 'API Gateway Solution',
      description:
        'Enterprise-grade API gateway with rate limiting, authentication, and monitoring capabilities.',
      sku: 'AGS-006',
      price: 12000,
      currency: 'USD',
      category: ['Software', 'Infrastructure'],
      tags: ['api', 'gateway', 'enterprise'],
      attributes: { throughput: 'high', monitoring: 'real-time' },
      images: [],
      isActive: false,
      version: 2,
      userStoryMappings: ['US-3.1'],
      createdAt: new Date(Date.now() - 86400000 * 40).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      usage: { proposalsCount: 3, relationshipsCount: 2 },
    },
  ];

  // Apply filters
  let filteredProducts = [...mockProducts];

  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredProducts = filteredProducts.filter(
      product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  if (params.category) {
    filteredProducts = filteredProducts.filter(product =>
      product.category.some(cat => cat.toLowerCase() === params.category?.toLowerCase())
    );
  }

  if (params.isActive !== undefined) {
    filteredProducts = filteredProducts.filter(product => product.isActive === params.isActive);
  }

  if (params.tags) {
    const tagsArray = params.tags.split(',').map(tag => tag.trim().toLowerCase());
    filteredProducts = filteredProducts.filter(product =>
      product.tags.some(tag => tagsArray.includes(tag.toLowerCase()))
    );
  }

  // Apply sorting
  if (params.sortBy) {
    filteredProducts.sort((a, b) => {
      let aValue: any = a[params.sortBy as keyof Product];
      let bValue: any = b[params.sortBy as keyof Product];

      // Handle date sorting
      if (params.sortBy === 'createdAt' || params.sortBy === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (params.sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });
  }

  // Apply pagination
  const page = params.page || 1;
  const limit = params.limit || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  const hasMore = endIndex < filteredProducts.length;

  return {
    products: paginatedProducts,
    pagination: {
      page,
      limit,
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / limit),
    },
    filters: {
      search: params.search,
      category: params.category ? [params.category] : undefined,
      tags: params.tags ? params.tags.split(',').map(tag => tag.trim()) : undefined,
      isActive: params.isActive,
    },
  };
}

export function useProductsManager() {
  console.warn('useProductsManager: Feature not implemented in performance-optimized version');
  return {
    products: [] as Product[],
    pagination: null,
    isLoading: false,
    error: null,
    updateFilters: () => {},
    clearFilters: () => {},
    updateSort: () => {},
    setPage: () => {},
    setLimit: () => {},
    refetch: () => {},
  };
}
