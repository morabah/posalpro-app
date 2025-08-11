/**
 * PosalPro MVP2 - Optimized Search Hook
 * High-performance search with debouncing, memoization, and caching
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface SearchOptions {
  debounceMs?: number;
  minSearchLength?: number;
  caseSensitive?: boolean;
  searchFields?: string[];
  maxResults?: number;
}

interface SearchResult<T> {
  items: T[];
  totalCount: number;
  searchTime: number;
  isLoading: boolean;
}

// Cache for search results
const searchCache: Map<string, { items: unknown[]; totalCount: number }> = new Map();
const CACHE_SIZE_LIMIT = 100;

// Optimized string matching with pre-computed lowercase versions
const createSearchMatcher = (query: string, caseSensitive: boolean = false) => {
  const searchQuery = caseSensitive ? query : query.toLowerCase();

  return (text: string): boolean => {
    if (!text) return false;
    const searchText = caseSensitive ? text : text.toLowerCase();
    return searchText.includes(searchQuery);
  };
};

// Advanced search with field weighting and relevance scoring
const searchWithRelevance = <T extends Record<string, unknown>>(
  items: T[],
  query: string,
  searchFields: string[],
  caseSensitive: boolean = false
): T[] => {
  if (!query.trim()) return items;

  const matcher = createSearchMatcher(query, caseSensitive);
  const results: Array<{ item: T; score: number }> = [];

  for (const item of items) {
    let score = 0;
    let hasMatch = false;

    for (let i = 0; i < searchFields.length; i++) {
      const field = searchFields[i];
      const value = item[field];

      if (value && typeof value === 'string') {
        if (matcher(value)) {
          hasMatch = true;
          // Higher score for earlier fields (more important)
          const fieldWeight = searchFields.length - i;
          // Bonus for exact matches or matches at start
          const exactMatch = value.toLowerCase() === query.toLowerCase();
          const startsWithMatch = value.toLowerCase().startsWith(query.toLowerCase());

          score += fieldWeight * (exactMatch ? 10 : startsWithMatch ? 5 : 1);
        }
      }
    }

    if (hasMatch) {
      results.push({ item, score });
    }
  }

  // Sort by relevance score (highest first)
  return results.sort((a, b) => b.score - a.score).map(result => result.item);
};

export function useOptimizedSearch<T extends Record<string, unknown>>(
  data: T[],
  options: SearchOptions = {}
): [string, (query: string) => void, SearchResult<T>] {
  const {
    debounceMs = 300,
    minSearchLength = 1,
    caseSensitive = false,
    searchFields = ['name', 'title', 'description'],
    maxResults = 100,
  } = options;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounced query update
  const updateQuery = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      setIsLoading(true);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        setDebouncedQuery(newQuery);
        setIsLoading(false);
      }, debounceMs);
    },
    [debounceMs]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Memoized search results with caching
  const searchResult = useMemo((): SearchResult<T> => {
    const startTime = performance.now();

    // Return all items if query is too short
    if (debouncedQuery.length < minSearchLength) {
      const endTime = performance.now();
      return {
        items: data.slice(0, maxResults),
        totalCount: data.length,
        searchTime: endTime - startTime,
        isLoading: false,
      };
    }

    // Check cache first
    const cacheKey = `${debouncedQuery}-${searchFields.join(',')}-${caseSensitive}`;
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey)!; // safe due to has(cacheKey)
      return {
        items: cached.items as T[],
        totalCount: cached.totalCount,
        searchTime: performance.now() - startTime,
        isLoading: false,
      };
    }

    // Perform search
    const filteredItems = searchWithRelevance(data, debouncedQuery, searchFields, caseSensitive);

    const result = {
      items: filteredItems.slice(0, maxResults),
      totalCount: filteredItems.length,
      searchTime: performance.now() - startTime,
      isLoading: false,
    };

    // Cache result (with size limit)
    if (searchCache.size >= CACHE_SIZE_LIMIT) {
      const firstKey = Array.from(searchCache.keys())[0];
      if (firstKey) {
        searchCache.delete(firstKey);
      }
    }
    searchCache.set(cacheKey, {
      items: result.items as unknown[],
      totalCount: result.totalCount,
    });

    return result;
  }, [data, debouncedQuery, searchFields, caseSensitive, minSearchLength, maxResults]);

  return [query, updateQuery, { ...searchResult, isLoading }];
}

// Specialized hook for multi-field search with custom scoring
export function useAdvancedSearch<T extends Record<string, unknown>>(
  data: T[],
  fieldWeights: Record<string, number> = {},
  options: SearchOptions = {}
) {
  const searchFields = Object.keys(fieldWeights);

  return useOptimizedSearch(data, {
    ...options,
    searchFields,
  });
}

// Clear search cache (useful for memory management)
export const clearSearchCache = () => {
  searchCache.clear();
};

// Get cache statistics
export const getSearchCacheStats = () => ({
  size: searchCache.size,
  limit: CACHE_SIZE_LIMIT,
  keys: Array.from(searchCache.keys()),
});
