// React Query hooks for customers - New Architecture
import { analytics } from '@/lib/analytics';
import type { ApiResponse } from '@/lib/api/response';
import {
  Customer,
  CustomerCreate,
  CustomerQuery,
  customerService,
  CustomerUpdate,
  CustomerList,
} from '@/services/customerService';
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// Using centralized query keys
import { qk } from '@/features/customers/keys';

// Infinite query for customer list with cursor pagination
export function useInfiniteCustomers({
  search = '',
  limit = 20,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  status,
  tier,
  industry,
}: CustomerQuery) {
  return useInfiniteQuery({
    queryKey: qk.customers.list(search, limit, sortBy, sortOrder, status, tier, industry),
    queryFn: ({ pageParam }) =>
      customerService.getCustomers({
        search,
        limit,
        sortBy,
        sortOrder,
        status,
        tier,
        industry,
        cursor: (pageParam ?? null) as string | null,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: ApiResponse<CustomerList>) =>
      lastPage.ok ? lastPage.data.nextCursor ?? undefined : undefined,
    staleTime: 60_000, // 1 minute
    gcTime: 120_000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// Single customer query
export function useCustomer(id: string) {
  return useQuery({
    queryKey: qk.customers.detail(id),
    queryFn: () => customerService.getCustomer(id),
    enabled: !!id,
    staleTime: 60_000,
    gcTime: 120_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// Customer search query
export function useCustomerSearch(query: string, limit: number = 10) {
  return useQuery({
    queryKey: qk.customers.search(query, limit),
    queryFn: () => customerService.searchCustomers(query, limit),
    enabled: !!query && query.length >= 2,
    staleTime: 30_000, // 30 seconds for search results
    gcTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// Multiple customers by IDs using useQueries
export function useCustomersByIds(ids: string[]) {
  const results = useQueries({
    queries: ids.map(id => ({
      queryKey: qk.customers.detail(id),
      queryFn: () => customerService.getCustomer(id),
      enabled: !!id,
      staleTime: 60_000,
      gcTime: 120_000,
      refetchOnWindowFocus: false,
      retry: 1,
    })),
  });

  return {
    data: results.map(r => (r.data?.ok ? r.data.data : null)).filter(Boolean) as Customer[],
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

      if (response.ok) {
        analytics.trackOptimized('customer_create_success', {
          customerId: response.data.id,
          name: data.name,
          userStories: ['US-2.1'],
          hypotheses: ['H3'],
          priority: 'medium',
        });
      }

      return response;
    },
    onSuccess: response => {
      // Invalidate and refetch customers list
      queryClient.invalidateQueries({ queryKey: qk.customers.all });
      // Set the new customer data in cache
      if (response.ok && response.data) {
        queryClient.setQueryData(qk.customers.detail(response.data.id), response);
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

      if (response.ok) {
        analytics.trackOptimized('customer_update_success', {
          customerId: response.data.id,
          name: data.name,
          userStories: ['US-2.1'],
          hypotheses: ['H3'],
          priority: 'medium',
        });
      }

      return response;
    },
    onSuccess: (response, variables) => {
      // Update the specific customer in cache
      if (response.ok && response.data) {
        queryClient.setQueryData(qk.customers.detail(variables.id), response);
      }
      // Invalidate customers list to reflect changes
      queryClient.invalidateQueries({ queryKey: qk.customers.all });
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

      return response;
    },
    onSuccess: (response, id) => {
      // Remove the customer from cache
      queryClient.removeQueries({ queryKey: qk.customers.detail(id) });
      // Invalidate customers list
      queryClient.invalidateQueries({ queryKey: qk.customers.all });
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
        queryClient.removeQueries({ queryKey: qk.customers.detail(id) });
      });
      // Invalidate customers list
      queryClient.invalidateQueries({ queryKey: qk.customers.all });
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
