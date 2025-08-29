/**
 * Search suggestions hook (feature-based, centralized query keys)
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/hooks/useApiClient';
import { qk } from '../keys';

export type Suggestion = {
  text: string;
  type: 'recent' | 'content' | 'product' | 'customer' | 'tag' | string;
  subtype?: string;
  metadata?: Record<string, unknown>;
};

export function useSuggestions(
  query: string,
  {
    type = 'all',
    limit = 10,
    enabled = true,
  }: { type?: 'all' | 'content' | 'proposals' | 'products' | 'customers'; limit?: number; enabled?: boolean } = {}
) {
  const { get } = useApiClient();

  return useQuery({
    queryKey: qk.search.suggestions(query, type, limit),
    queryFn: async () => {
      const qs = new URLSearchParams({ q: query, limit: String(limit), type }).toString();
      const res = await get<{ success: boolean; data: { suggestions: Suggestion[] } }>(
        'api/search/suggestions?' + qs
      );
      return res.data.suggestions;
    },
    enabled: enabled && (query?.length || 0) >= 2,
    staleTime: 15000,
  });
}

