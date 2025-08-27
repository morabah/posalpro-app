/**
 * PosalPro MVP2 - Infinite Proposals Hook
 * Implements infinite scrolling for proposals with proper cursor pagination
 * Follows best practices for React Query infinite queries
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { qk } from '@/features/proposals/keys';
import { http } from '@/lib/http';

interface ProposalItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  value: number;
  createdAt: string;
  updatedAt: string;
  customerId?: string;
  assignedTo?: string;
  [key: string]: unknown;
}

interface ProposalFilters {
  search?: string;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'status' | 'priority' | 'value';
  sortOrder?: 'asc' | 'desc';
  status?: string;
  priority?: string;
  customerId?: string;
  assignedTo?: string;
}

interface ProposalListResponse {
  items: ProposalItem[];
  nextCursor: string | null;
  meta?: {
    total?: number;
    hasNextPage?: boolean;
  };
}

export function useInfiniteProposals(filters: ProposalFilters = {}) {
  const {
    search = '',
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
    priority,
    customerId,
    assignedTo,
  } = filters;

  return useInfiniteQuery({
    queryKey: qk.proposals.list(search, limit, sortBy, sortOrder),
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const params = new URLSearchParams({
        search,
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(status && { status }),
        ...(priority && { priority }),
        ...(customerId && { customerId }),
        ...(assignedTo && { assignedTo }),
        ...(pageParam && { cursor: pageParam }),
      });

      const response = await http.get<{ ok: true; data: ProposalListResponse }>(
        `/api/proposals?${params.toString()}`
      );

      return response.data;
    },
    getNextPageParam: (lastPage: ProposalListResponse) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Helper hook to get all items from infinite query
export function useInfiniteProposalsData(filters: ProposalFilters = {}) {
  const query = useInfiniteProposals(filters);
  
  const items: ProposalItem[] = query.data?.pages.flatMap(page => page.items) ?? [];
  const totalCount = query.data?.pages[0]?.meta?.total;
  
  return {
    ...query,
    items,
    totalCount,
  };
}
