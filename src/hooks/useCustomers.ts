// React Query hooks for customers - New Architecture
import { analytics } from '@/lib/analytics';
import {
  Customer,
  CustomerCreate,
  CustomerQuery,
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

// Stable query keys
export const qk = {
  customers: {
    all: ['customers'] as const,
    lists: () => [...qk.customers.all, 'list'] as const,
    list: (search: string, limit: number, sortBy: string, sortOrder: string) =>
      [...qk.customers.lists(), search, limit, sortBy, sortOrder] as const,
    details: () => [...qk.customers.all, 'detail'] as const,
    detail: (id: string) => [...qk.customers.details(), id] as const,
    search: (query: string, limit: number) =>
      [...qk.customers.all, 'search', query, limit] as const,
  },
};

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
    queryKey: qk.customers.list(search, limit, sortBy, sortOrder),
    queryFn: ({ pageParam }) =>
      customerService.getCustomers({
        search,
        limit,
        sortBy,
        sortOrder,
        status,
        tier,
        industry,
        cursor: pageParam as string | null,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: any) => lastPage.data?.nextCursor || undefined,
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
    mutationFn: (data: CustomerCreate) => customerService.createCustomer(data),
    onSuccess: response => {
      // Invalidate all customer lists
      queryClient.invalidateQueries({ queryKey: qk.customers.all });

      // Track analytics
      analytics.trackOptimized(
        'customer_created',
        {
          customerId: response.ok ? response.data?.id : undefined,
          customerName: response.ok ? response.data?.name : undefined,
        },
        'US-3.1',
        'H4'
      );
    },
    onError: error => {
      analytics.trackOptimized(
        'customer_creation_failed',
        {
          error: error instanceof Error ? error.message : String(error),
        },
        'US-3.1',
        'H4'
      );
    },
  });
}

// Update customer mutation
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerUpdate }) =>
      customerService.updateCustomer(id, data),
    onSuccess: (response, { id }) => {
      // Invalidate specific customer and all lists
      queryClient.invalidateQueries({ queryKey: qk.customers.detail(id) });
      queryClient.invalidateQueries({ queryKey: qk.customers.all });

      // Track analytics
      analytics.trackOptimized(
        'customer_updated',
        {
          customerId: id,
          customerName: response.ok ? response.data?.name : undefined,
        },
        'US-3.2',
        'H4'
      );
    },
    onError: (error, { id }) => {
      analytics.trackOptimized(
        'customer_update_failed',
        {
          customerId: id,
          error: error instanceof Error ? error.message : String(error),
        },
        'US-3.2',
        'H4'
      );
    },
  });
}

// Delete customer mutation
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerService.deleteCustomer(id),
    onSuccess: (_, id) => {
      // Invalidate all customer queries
      queryClient.invalidateQueries({ queryKey: qk.customers.all });

      // Remove from cache
      queryClient.removeQueries({ queryKey: qk.customers.detail(id) });

      // Track analytics
      analytics.trackOptimized(
        'customer_deleted',
        {
          customerId: id,
        },
        'US-3.3',
        'H4'
      );
    },
    onError: (error, id) => {
      analytics.trackOptimized(
        'customer_deletion_failed',
        {
          customerId: id,
          error: error instanceof Error ? error.message : String(error),
        },
        'US-3.3',
        'H4'
      );
    },
  });
}

// Bulk delete customers mutation
export function useDeleteCustomersBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => customerService.deleteCustomersBulk(ids),
    onSuccess: (response, ids) => {
      // Invalidate all customer queries
      queryClient.invalidateQueries({ queryKey: qk.customers.all });

      // Remove from cache
      ids.forEach(id => {
        queryClient.removeQueries({ queryKey: qk.customers.detail(id) });
      });

      // Track analytics
      analytics.trackOptimized(
        'customers_bulk_deleted',
        {
          deletedCount: response.ok ? response.data?.deleted || 0 : 0,
          customerIds: ids,
        },
        'US-3.4',
        'H4'
      );
    },
    onError: (error, ids) => {
      analytics.trackOptimized(
        'customers_bulk_deletion_failed',
        {
          customerCount: ids.length,
          error: error instanceof Error ? error.message : String(error),
        },
        'US-3.4',
        'H4'
      );
    },
  });
}

// Optimistic updates for better UX
export function useOptimisticCustomerUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerUpdate }) =>
      customerService.updateCustomer(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: qk.customers.detail(id) });

      // Snapshot previous value
      const previousCustomer = queryClient.getQueryData(qk.customers.detail(id));

      // Optimistically update
      queryClient.setQueryData(qk.customers.detail(id), (old: any) => ({
        ...old,
        data: { ...old?.data, ...data, updatedAt: new Date().toISOString() },
      }));

      return { previousCustomer };
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousCustomer) {
        queryClient.setQueryData(qk.customers.detail(id), context.previousCustomer);
      }
    },
    onSettled: (_, __, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: qk.customers.detail(id) });
    },
  });
}
