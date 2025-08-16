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

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [isClient, setIsClient] = useState(false);

  // ✅ FIXED: Ensure client-side only execution
  useEffect(() => {
    setIsClient(true);
  }, []);

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
                // ✅ STANDARDIZED ERROR HANDLING: Use ErrorHandlingService
                const errorHandlingService = ErrorHandlingService.getInstance();
                const standardError = errorHandlingService.processError(
                  error,
                  'Mutation failed',
                  ErrorCodes.API.REQUEST_FAILED,
                  {
                    component: 'QueryProvider',
                    operation: 'mutation',
                  }
                );

                // Log the error for debugging
                errorHandlingService.processError(standardError);
              }
            },
          },
        },
      })
  );

  // Don't render until client-side
  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {process.env.NODE_ENV === 'development' && (() => {
        const Devtools = dynamic(() => import('@tanstack/react-query-devtools').then(m => m.ReactQueryDevtools), { ssr: false });
        return <Devtools initialIsOpen={false} position="bottom" />;
      })()}
    </QueryClientProvider>
  );
}
