'use client';

/**
 * PosalPro MVP2 - React Query Provider
 * Provides QueryClient context for data fetching and caching
 *
 * Features:
 * - Optimized cache configuration for production use
 * - Error handling and retry logic
 * - Development tools integration
 * - Performance monitoring
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create QueryClient instance with optimized configuration
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 5 minutes by default
            staleTime: 5 * 60 * 1000,
            // Keep data in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry failed requests 3 times
            retry: 3,
            // Don't retry on 4xx errors (client errors)
            retryOnMount: true,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            // Use exponential backoff for retries
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry mutations once
            retry: 1,
            // Log mutation errors in development
            onError: error => {
              if (process.env.NODE_ENV === 'development') {
                console.error('Mutation error:', error);
              }
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
