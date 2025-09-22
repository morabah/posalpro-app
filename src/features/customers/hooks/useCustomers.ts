// React Query hooks for customers - New Architecture
import { analytics } from '@/lib/analytics';
import {
  Customer,
  CustomerCreate,
  CustomerList,
  customerService,
  CustomerUpdate,
} from '@/services/customerService';
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// Using centralized query keys
import { customerKeys } from '@/features/customers';

// Infinite query for customer list with cursor pagination
export function useInfiniteCustomers({
  search = '',
  limit = 20,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  status,
  tier,
  customerType,
  industry,
}: {
  search?: string;
  limit?: number;
  sortBy?: 'createdAt' | 'name' | 'status' | 'revenue';
  sortOrder?: 'asc' | 'desc';
  status?: 'ACTIVE' | 'INACTIVE' | 'PROSPECT';
  tier?: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  customerType?:
    | 'MIDDLEMAN'
    | 'ENDUSER'
    | 'DISTRIBUTOR'
    | 'VENDOR'
    | 'CONTRACTOR'
    | 'GOVERNMENTAL'
    | 'NGO'
    | 'SYSTEM_INTEGRATOR';
  industry?: string;
}) {
  return useInfiniteQuery({
    queryKey: customerKeys.customers.list(search, limit, sortBy, sortOrder, undefined, {
      status,
      tier,
      customerType,
      industry,
    }),
    queryFn: ({ pageParam }) =>
      customerService.getCustomers({
        search,
        limit,
        sortBy,
        sortOrder,
        status,
        tier,
        customerType,
        industry: industry as any,
        cursor: (pageParam ?? null) as string | null,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: CustomerList) => lastPage.nextCursor ?? undefined,
    staleTime: 30000, // 30 seconds - data considered fresh
    gcTime: 120000, // 2 minutes - cache retention
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: true, // Refetch when connection restored
    retry: 2, // Retry failed requests twice
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    placeholderData: previousData => previousData, // Keep previous data while loading
    networkMode: 'online', // Only fetch when online
  });
}

// Single customer query
export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.customers.detail(id),
    queryFn: () => customerService.getCustomer(id),
    enabled: !!id,
    staleTime: 30000, // 30 seconds - data considered fresh
    gcTime: 120000, // 2 minutes - cache retention
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: true, // Refetch when connection restored
    retry: 2, // Retry failed requests twice
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    placeholderData: previousData => previousData, // Keep previous data while loading
    networkMode: 'online', // Only fetch when online
  });
}

// Customer search query
export function useCustomerSearch(query: string, limit: number = 10) {
  return useQuery({
    queryKey: customerKeys.customers.search(query, limit),
    queryFn: () => customerService.searchCustomers(query, limit),
    enabled: !!query && query.length >= 2,
    staleTime: 30000, // 30 seconds - search results considered fresh
    gcTime: 120000, // 2 minutes - cache retention
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: true, // Refetch when connection restored
    retry: 2, // Retry failed requests twice
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    placeholderData: previousData => previousData, // Keep previous data while loading
    networkMode: 'online', // Only fetch when online
  });
}

// Multiple customers by IDs using useQueries
export function useCustomersByIds(ids: string[]) {
  const results = useQueries({
    queries: ids.map(id => ({
      queryKey: customerKeys.customers.detail(id),
      queryFn: () => customerService.getCustomer(id),
      enabled: !!id,
      staleTime: 30000, // 30 seconds - data considered fresh
      gcTime: 120000, // 2 minutes - cache retention
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnReconnect: true, // Refetch when connection restored
      retry: 2, // Retry failed requests twice
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
      placeholderData: (previousData: any) => previousData, // Keep previous data while loading
      networkMode: 'online' as const, // Only fetch when online
    })),
  });

  return {
    data: results.map(r => r.data || null).filter(Boolean) as Customer[],
    isLoading: results.some(r => r.isLoading),
    isError: results.some(r => r.isError),
    errors: results.filter(r => r.error).map(r => r.error),
  };
}

// Create customer mutation
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CustomerCreate) => {
      analytics.trackOptimized('customer_create_attempt', {
        name: data.name,
        industry: data.industry,
        userStories: ['US-2.1'],
        hypotheses: ['H3'],
        priority: 'medium',
      });

      const response = await customerService.createCustomer(data);

      analytics.trackOptimized('customer_create_success', {
        customerId: response.id,
        name: data.name,
        userStories: ['US-2.1'],
        hypotheses: ['H3'],
        priority: 'medium',
      });

      return response;
    },
    onSuccess: response => {
      // Invalidate and refetch customers list
      queryClient.invalidateQueries({ queryKey: customerKeys.customers.all });
      // Set the new customer data in cache
      if (response) {
        queryClient.setQueryData(customerKeys.customers.detail(response.id), response);
      }
    },
    onError: (error, variables) => {
      analytics.trackOptimized('customer_create_failed', {
        name: variables.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStories: ['US-2.1'],
        hypotheses: ['H3'],
        priority: 'high',
      });
    },
  });
}

// Update customer mutation
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CustomerUpdate }) => {
      analytics.trackOptimized('customer_update_attempt', {
        customerId: id,
        name: data.name,
        userStories: ['US-2.1'],
        hypotheses: ['H3'],
        priority: 'medium',
      });

      const response = await customerService.updateCustomer(id, data);

      analytics.trackOptimized('customer_update_success', {
        customerId: response.id,
        name: data.name,
        userStories: ['US-2.1'],
        hypotheses: ['H3'],
        priority: 'medium',
      });

      return response;
    },
    onSuccess: (response, variables) => {
      // Update the specific customer in cache
      if (response) {
        queryClient.setQueryData(customerKeys.customers.detail(variables.id), response);
      }
      // Invalidate customers list to reflect changes
      queryClient.invalidateQueries({ queryKey: customerKeys.customers.all });
    },
    onError: (error, variables) => {
      analytics.trackOptimized('customer_update_failed', {
        customerId: variables.id,
        name: variables.data.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStories: ['US-2.1'],
        hypotheses: ['H3'],
        priority: 'high',
      });
    },
  });
}

// Delete customer mutation
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      analytics.trackOptimized('customer_delete_attempt', {
        customerId: id,
        userStories: ['US-2.1'],
        hypotheses: ['H3'],
        priority: 'high',
      });

      const response = await customerService.deleteCustomer(id);

      if (response.ok) {
        analytics.trackOptimized('customer_delete_success', {
          customerId: id,
          userStories: ['US-2.1'],
          hypotheses: ['H3'],
          priority: 'high',
        });
      }

      return undefined;
    },
    onSuccess: (response, id) => {
      // Remove the customer from cache
      queryClient.removeQueries({ queryKey: customerKeys.customers.detail(id) });
      // Invalidate customers list
      queryClient.invalidateQueries({ queryKey: customerKeys.customers.all });
    },
    onError: (error, id) => {
      analytics.trackOptimized('customer_delete_failed', {
        customerId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStories: ['US-2.1'],
        hypotheses: ['H3'],
        priority: 'high',
      });
    },
  });
}

// Bulk delete customers mutation - Note: Implement when bulk delete API is available
export function useDeleteCustomersBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      analytics.trackOptimized('customers_bulk_delete_attempt', {
        customerIds: ids,
        count: ids.length,
        userStories: ['US-2.1'],
        hypotheses: ['H3'],
        priority: 'high',
      });

      // TODO: Implement when bulk delete API is available
      throw new Error('Bulk delete not yet implemented');
    },
    onSuccess: (response, ids) => {
      // Remove all deleted customers from cache
      ids.forEach(id => {
        queryClient.removeQueries({ queryKey: customerKeys.customers.detail(id) });
      });
      // Invalidate customers list
      queryClient.invalidateQueries({ queryKey: customerKeys.customers.all });
    },
    onError: (error, ids) => {
      analytics.trackOptimized('customers_bulk_delete_failed', {
        customerIds: ids,
        count: ids.length,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStories: ['US-2.1'],
        hypotheses: ['H3'],
        priority: 'high',
      });
    },
  });
}

// ====================
// Unified Data Loading Hook
// ====================

// Customer stats hook
export function useCustomerStats() {
  return useQuery({
    queryKey: customerKeys.customers.stats(),
    queryFn: () => customerService.getCustomerStats(),
    staleTime: 60000, // 1 minute - stats change less frequently
    gcTime: 300000, // 5 minutes - longer cache for stats
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: true, // Refetch when connection restored
    refetchInterval: 300000, // Auto-refresh every 5 minutes
    retry: 2, // Retry failed requests twice
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    placeholderData: previousData => previousData, // Keep previous data while loading
    networkMode: 'online', // Only fetch when online
  });
}

// Unified hook for loading customers and stats in parallel
export function useUnifiedCustomerData(
  customerType?:
    | 'MIDDLEMAN'
    | 'ENDUSER'
    | 'DISTRIBUTOR'
    | 'VENDOR'
    | 'CONTRACTOR'
    | 'GOVERNMENTAL'
    | 'NGO'
    | 'SYSTEM_INTEGRATOR'
) {
  // 🚀 OPTIMIZATION: Load ALL customer data in parallel
  const customersResult = useInfiniteCustomers({
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    customerType,
  });

  const statsResult = useCustomerStats();

  return {
    customers: customersResult,
    stats: statsResult,
  };
}
