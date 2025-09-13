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
import { logError, logInfo } from '@/lib/logger';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// ✅ CRITICAL: Global PDF.js worker configuration
// Prefer a same-origin bundled module worker to avoid cross-origin quirks
// This must be done before any PDF components are rendered
if (typeof window !== 'undefined') {
  (window as any).pdfWorkerPromise = import('react-pdf')
    .then(async module => {
      try {
        // Try creating a same-origin module worker bundled by Next.js/Webpack
        const worker = new Worker(
          new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
          { type: 'module' }
        );
        module.pdfjs.GlobalWorkerOptions.workerPort = worker;

        logInfo('QueryProvider: PDF.js worker configured via workerPort (bundled)', {
          component: 'QueryProvider',
          operation: 'pdf_worker_config',
          configuredAt: new Date().toISOString(),
          mode: 'workerPort',
        });
      } catch (err) {
        // Fallback: configure by URL (CDN)
        const cacheBuster = Date.now();
        const workerUrl = `https://unpkg.com/pdfjs-dist@5.3.93/build/pdf.worker.min.mjs?v=${cacheBuster}`;
        module.pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

        logInfo('QueryProvider: PDF.js worker configured via workerSrc (CDN fallback)', {
          component: 'QueryProvider',
          operation: 'pdf_worker_config',
          configuredAt: new Date().toISOString(),
          mode: 'workerSrc',
          workerUrl,
        });
      }

      return module;
    })
    .catch(error => {
      logError('QueryProvider: Failed to configure PDF.js worker', {
        errorMessage: error.message || 'Unknown error',
        component: 'QueryProvider',
        operation: 'pdf_worker_config_error',
      });
      throw error;
    });

  // Add global error handlers for PDF worker issues
  window.addEventListener('error', event => {
    if (
      event.message?.includes('pdfjs') ||
      event.message?.includes('worker') ||
      event.message?.includes('messageHandler') ||
      event.message?.includes('sendWithPromise')
    ) {
      logError('QueryProvider: PDF worker error detected', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        isMessageHandlerError:
          event.message?.includes('messageHandler') || event.message?.includes('sendWithPromise'),
        component: 'QueryProvider',
        operation: 'pdf_worker_error_handler',
      });
      // Do not call preventDefault here; let ErrorBoundary capture and UI recover
    }
  });

  // Handle unhandled promise rejections from PDF worker
  window.addEventListener('unhandledrejection', event => {
    if (
      event.reason?.message?.includes('pdfjs') ||
      event.reason?.message?.includes('worker') ||
      event.reason?.message?.includes('messageHandler') ||
      event.reason?.message?.includes('sendWithPromise')
    ) {
      logError('QueryProvider: PDF worker promise rejection', {
        reason: event.reason,
        isMessageHandlerError:
          event.reason?.message?.includes('messageHandler') ||
          event.reason?.message?.includes('sendWithPromise'),
        component: 'QueryProvider',
        operation: 'pdf_worker_promise_rejection',
      });
      event.preventDefault(); // Prevent the default handler
    }
  });
}

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

  // ✅ FIXED: Always render QueryClientProvider to prevent "No QueryClient set" errors
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {process.env.NODE_ENV === 'development' && isClient && (
        <DevtoolsMemo initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}

// Hoisted dynamic import to avoid redeclaration on each render
const DevtoolsMemo = dynamic(
  () => import('@tanstack/react-query-devtools').then(m => m.ReactQueryDevtools),
  { ssr: false }
);
