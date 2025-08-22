/**
 * PosalPro MVP2 - Customers Data Hook
 * React Query hook for fetching and caching customers data
 * Performance optimized with caching and pagination
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logWarn } from '@/lib/logger';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useApiClient } from './useApiClient';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  industry?: string;
  companySize?: string;
  revenue?: number;
  tier: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' | 'VIP';
  status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'CHURNED';
  tags: string[];
  metadata?: Record<string, unknown>;
  segmentation?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  proposalsCount?: number;
  contactsCount?: number;
}

export interface CustomersResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
    hasMore: boolean;
    nextCursor?: string | null;
  };
  filters?: {
    search?: string;
    status?: string;
    tier?: string;
    industry?: string;
  };
}

export interface CustomersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  tier?: string;
  industry?: string;
  cursor?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'tier';
  sortOrder?: 'asc' | 'desc';
}

// Query keys for React Query
export const CUSTOMERS_QUERY_KEYS = {
  all: ['customers'] as const,
  lists: () => [...CUSTOMERS_QUERY_KEYS.all, 'list'] as const,
  list: (params: CustomersQueryParams) => [...CUSTOMERS_QUERY_KEYS.lists(), params] as const,
  details: () => [...CUSTOMERS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CUSTOMERS_QUERY_KEYS.details(), id] as const,
  search: (query: string) => [...CUSTOMERS_QUERY_KEYS.all, 'search', query] as const,
};

/**
 * Hook for fetching customers list with pagination and filtering
 * ✅ PERFORMANCE: Integrated with cache manager to prevent timeouts
 */
export function useCustomers(
  params: CustomersQueryParams = {}
): UseQueryResult<CustomersResponse, Error> {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: CUSTOMERS_QUERY_KEYS.list(params),
    queryFn: async (): Promise<CustomersResponse> => {
      // ✅ FOLLOWS CORE_REQUIREMENTS.md: Use pure useApiClient pattern (like BasicInformationStep.tsx)
      const searchParams = new URLSearchParams();

      // Add parameters to search params
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.status) searchParams.set('status', params.status);
      if (params.tier) searchParams.set('tier', params.tier);
      if (params.industry) searchParams.set('industry', params.industry);
      if (params.cursor) searchParams.set('cursor', params.cursor);
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      try {
        const response = await apiClient.get<{
          success: boolean;
          data: CustomersResponse;
          message: string;
        }>(`customers?${searchParams.toString()}`);

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch customers');
        }

        return response.data;
      } catch (error) {
        logWarn('Failed to fetch customers:', {
          error: error instanceof Error ? error.message : String(error),
        });
        ErrorHandlingService.getInstance().processError(
          error as Error,
          'Failed to fetch customers',
          ErrorCodes.API.REQUEST_FAILED,
          {
            component: 'useCustomers',
            operation: 'fetchCustomers',
          }
        );
        throw error;
      }
    },
    // ✅ PERFORMANCE: Optimized for speed with minimal resilience to dev rebuilds
    staleTime: 30 * 1000, // 30 seconds for fast updates
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // Keep disabled; use targeted retry below
    retry: (failureCount, error) => {
      // Only retry transient network errors (e.g., during Fast Refresh)
      const isNetworkError =
        error instanceof TypeError || /Failed to fetch|load failed/i.test(String(error));
      return isNetworkError && failureCount < 2;
    },
    retryDelay: 300,
  });
}

/**
 * Hook for fetching a single customer by ID
 */
export function useCustomer(id: string): UseQueryResult<Customer, Error> {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: CUSTOMERS_QUERY_KEYS.detail(id),
    queryFn: async (): Promise<Customer> => {
      const response = await apiClient.get<{
        success: boolean;
        data: Customer;
        message: string;
      }>(`customers/${id}`);

      if (!response.success) {
        // Log error but let React Query handle the error state
        logWarn('[useCustomers] Customer fetch failed:', {
          message: response.message || 'Failed to fetch customer',
        });
        throw new Error(response.message || 'Failed to fetch customer');
      }

      return response.data;
    },
    // Cache single customers for longer since they change less frequently
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!id, // Only run query if ID is provided
    retry: 2,
  });
}

/**
 * Hook for searching customers with debouncing
 */
export function useCustomerSearch(
  searchTerm: string,
  options: Omit<CustomersQueryParams, 'search'> = {}
): UseQueryResult<CustomersResponse, Error> {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: CUSTOMERS_QUERY_KEYS.search(searchTerm),
    queryFn: async (): Promise<CustomersResponse> => {
      const searchParams = new URLSearchParams();
      searchParams.set('search', searchTerm);

      // Add other options (entries only includes present keys)
      Object.entries(options).forEach(([key, value]) => {
        searchParams.set(key, String(value));
      });

      const response = await apiClient.get<{
        success: boolean;
        data: CustomersResponse;
        message: string;
      }>(`customers?${searchParams.toString()}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to search customers');
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
