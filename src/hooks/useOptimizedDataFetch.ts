/**
 * PosalPro MVP2 - Optimized Data Fetching Hook
 * High-performance data fetching with caching, deduplication, and error handling
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface FetchOptions {
  cacheTime?: number; // Cache duration in milliseconds
  staleTime?: number; // Time before data is considered stale
  retryCount?: number; // Number of retry attempts
  retryDelay?: number; // Delay between retries in milliseconds
  dedupe?: boolean; // Deduplicate identical requests
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  refetch: () => Promise<void>;
}

// Global cache for fetch results
const fetchCache = new Map<
  string,
  {
    data: any;
    timestamp: number;
    promise?: Promise<any>;
  }
>();

// Global request deduplication map
const pendingRequests = new Map<string, Promise<any>>();

// Cache cleanup interval
let cacheCleanupInterval: NodeJS.Timeout | null = null;

// Start cache cleanup if not already running
const startCacheCleanup = () => {
  if (!cacheCleanupInterval) {
    cacheCleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of fetchCache.entries()) {
        // Remove entries older than 10 minutes
        if (now - entry.timestamp > 10 * 60 * 1000) {
          fetchCache.delete(key);
        }
      }
    }, 60000); // Run every minute
  }
};

// Stop cache cleanup
const stopCacheCleanup = () => {
  if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval);
    cacheCleanupInterval = null;
  }
};

// Optimized fetch with retry logic
const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  retryCount: number = 3,
  retryDelay: number = 1000
): Promise<any> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes('HTTP 4')) {
        throw lastError;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError!;
};

export function useOptimizedDataFetch<T>(
  url: string | null,
  options: FetchOptions = {}
): FetchState<T> {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes default cache
    staleTime = 30 * 1000, // 30 seconds default stale time
    retryCount = 3,
    retryDelay = 1000,
    dedupe = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Generate cache key
  const cacheKey = url ? `${url}${JSON.stringify(options)}` : null;

  // Check if data is stale
  const isStale = useCallback(
    (timestamp: number) => {
      return Date.now() - timestamp > staleTime;
    },
    [staleTime]
  );

  // Check if data is expired
  const isExpired = useCallback(
    (timestamp: number) => {
      return Date.now() - timestamp > cacheTime;
    },
    [cacheTime]
  );

  // Fetch data function
  const fetchData = useCallback(
    async (force = false): Promise<void> => {
      if (!url || !mountedRef.current) return;

      const key = cacheKey!;

      // Check cache first (unless forced)
      if (!force && fetchCache.has(key)) {
        const cached = fetchCache.get(key)!;
        if (!isExpired(cached.timestamp)) {
          setData(cached.data);
          setLastFetched(cached.timestamp);
          setError(null);

          // If data is not stale, don't fetch
          if (!isStale(cached.timestamp)) {
            return;
          }
        }
      }

      // Deduplicate requests
      if (dedupe && pendingRequests.has(key)) {
        try {
          const result = await pendingRequests.get(key)!;
          if (mountedRef.current) {
            setData(result);
            setError(null);
          }
        } catch (err) {
          if (mountedRef.current) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
          }
        }
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        // Create fetch promise
        const fetchPromise = fetchWithRetry(
          url,
          { signal: abortControllerRef.current.signal },
          retryCount,
          retryDelay
        );

        // Store pending request for deduplication
        if (dedupe) {
          pendingRequests.set(key, fetchPromise);
        }

        const result = await fetchPromise;

        if (mountedRef.current) {
          const timestamp = Date.now();

          // Update state
          setData(result);
          setLastFetched(timestamp);
          setError(null);

          // Update cache
          fetchCache.set(key, {
            data: result,
            timestamp,
          });
        }
      } catch (err) {
        if (mountedRef.current && err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }

        // Clean up pending request
        if (dedupe) {
          pendingRequests.delete(key);
        }
      }
    },
    [url, cacheKey, retryCount, retryDelay, dedupe, isExpired, isStale]
  );

  // Refetch function
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Start cache cleanup
  useEffect(() => {
    startCacheCleanup();
    return () => {
      // Don't stop cleanup on unmount as other components might be using it
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastFetched,
    refetch,
  };
}

// Utility functions for cache management
export const clearFetchCache = (pattern?: string) => {
  if (pattern) {
    for (const key of fetchCache.keys()) {
      if (key.includes(pattern)) {
        fetchCache.delete(key);
      }
    }
  } else {
    fetchCache.clear();
  }
};

export const getFetchCacheStats = () => ({
  size: fetchCache.size,
  keys: Array.from(fetchCache.keys()),
  pendingRequests: pendingRequests.size,
});

// Prefetch data for better performance
export const prefetchData = async (url: string, options: FetchOptions = {}): Promise<void> => {
  const { retryCount = 3, retryDelay = 1000 } = options;

  const cacheKey = `${url}${JSON.stringify(options)}`;

  // Don't prefetch if already cached and not expired
  if (fetchCache.has(cacheKey)) {
    const cached = fetchCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < (options.cacheTime || 5 * 60 * 1000)) {
      return;
    }
  }

  try {
    const result = await fetchWithRetry(url, {}, retryCount, retryDelay);
    fetchCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('Prefetch failed:', error);
  }
};
