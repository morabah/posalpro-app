/**
 * PosalPro MVP2 - Next.js Data Fetching Primitives Integration
 *
 * Hybrid approach that combines Next.js built-in caching with our existing
 * infrastructure while maintaining ErrorHandlingService and analytics integration
 *
 * Component Traceability Matrix Integration
 * User Stories: US-6.1 (Performance), US-6.3 (Data Efficiency)
 * Hypotheses: H8 (Load Time), H11 (Cache Hit Rate)
 */

'use client';

import { useApiClient } from '@/hooks/useApiClient';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';

import { useEffect } from 'react';

// ✅ FIXED: Add specific interface for analytics function
export interface AnalyticsFunction {
  (event: string, properties: Record<string, unknown>, priority: 'high' | 'medium' | 'low'): void;
}

// ✅ FIXED: Add specific interface for error context
export interface ErrorContext {
  [key: string]: unknown;
}

// Enhanced fetch options with Next.js primitives
export interface NextJSFetchOptions extends Omit<RequestInit, 'cache'> {
  // Next.js specific options
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };

  // Our existing infrastructure options
  cache?: {
    enabled?: boolean;
    ttl?: number;
    key?: string;
  };

  analytics?: {
    trackPerformance?: boolean;
    userStory?: string;
    hypothesis?: string;
  };

  errorHandling?: {
    enabled?: boolean;
    context?: ErrorContext;
  };
}

// Response interface that maintains our existing patterns
export interface EnhancedFetchResponse<T> {
  data: T;
  success: boolean;
  cached: boolean;
  fromNextJS: boolean;
  performance: {
    fetchTime: number;
    cacheHit: boolean;
    source: 'nextjs' | 'advanced-cache' | 'network';
  };
  meta?: {
    revalidatedAt?: number;
    tags?: string[];
  };
}

/**
 * Next.js Data Fetching Service with Infrastructure Integration
 */
export class NextJSDataFetchingService {
  private static instance: NextJSDataFetchingService | null = null;
  private errorHandlingService: ErrorHandlingService;

  // ✅ FIXED: Replace 'any' with specific interface
  private analytics: AnalyticsFunction | null = null;

  private constructor() {
    this.errorHandlingService = ErrorHandlingService.getInstance();
  }

  static getInstance(): NextJSDataFetchingService {
    if (NextJSDataFetchingService.instance === null) {
      NextJSDataFetchingService.instance = new NextJSDataFetchingService();
    }
    return NextJSDataFetchingService.instance;
  }

  // ✅ FIXED: Use specific interface for analytics function
  initializeAnalytics(analytics: AnalyticsFunction) {
    this.analytics = analytics;
  }

  /**
   * Enhanced fetch that intelligently chooses between Next.js primitives
   * and our existing infrastructure based on context
   */
  async enhancedFetch<T>(
    url: string,
    options: NextJSFetchOptions = {}
  ): Promise<EnhancedFetchResponse<T>> {
    const startTime = performance.now();

    const {
      next,
      cache = { enabled: true, ttl: 300000 },
      analytics = { trackPerformance: true },
      errorHandling = { enabled: true },
      ...fetchOptions
    } = options;

    try {
      // Analytics tracking start
      if (analytics.trackPerformance && this.analytics) {
        this.analytics(
          'enhanced_fetch_started',
          {
            userStories: ['US-6.1', 'US-6.3'],
            hypotheses: ['H8', 'H11'],
            url,
            useNextJSPrimitives: !!next,
            cacheEnabled: cache.enabled,
            userStory: analytics.userStory,
            hypothesis: analytics.hypothesis,
          },
          'low'
        );
      }

      let response: Response;
      let fromNextJS = false;
      let source: 'nextjs' | 'advanced-cache' | 'network' = 'network';

      // Use Next.js built-in caching or standard fetch

      // 2. Use Next.js primitives with our enhancements
      if (next) {
        response = await fetch(url, {
          ...fetchOptions,
          next: {
            revalidate: next.revalidate,
            tags: next.tags,
          },
        });
        fromNextJS = true;
        source = 'nextjs';
      } else {
        // Standard fetch with our caching
        response = await fetch(url, fetchOptions);
        source = 'network';
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // ✅ FIXED: Use proper type assertion for JSON response
      const data = (await response.json()) as T;
      const fetchTime = performance.now() - startTime;

      // Caching is handled by Next.js built-in fetch caching

      // Analytics tracking success
      if (analytics.trackPerformance && this.analytics) {
        this.analytics(
          'enhanced_fetch_completed',
          {
            userStories: ['US-6.1', 'US-6.3'],
            hypotheses: ['H8', 'H11'],
            url,
            fetchTime,
            cacheHit: false,
            fromNextJS,
            source,
          },
          'low'
        );
      }

      return {
        data,
        success: true,
        cached: false,
        fromNextJS,
        performance: {
          fetchTime,
          cacheHit: false,
          source,
        },
        meta: {
          revalidatedAt: next?.revalidate ? Date.now() + next.revalidate * 1000 : undefined,
          tags: next?.tags,
        },
      };
    } catch (error) {
      const fetchTime = performance.now() - startTime;

      // Use our standardized error handling
      if (errorHandling.enabled) {
        // ✅ FIXED: Use standardized error handling
        const standardError = this.errorHandlingService.processError(
          error,
          'Enhanced fetch failed',
          ErrorCodes.API.REQUEST_FAILED,
          {
            component: 'NextJSDataFetchingService',
            operation: 'enhancedFetch',
            userStories: ['US-6.1', 'US-6.3'],
            hypotheses: ['H8', 'H11'],
            url,
            useNextJSPrimitives: !!next,
            fetchTime,
            context: errorHandling.context,
          }
        );

        throw standardError;
      }

      throw error;
    }
  }

  /**
   * Get optimized fetch function for static data
   * Ideal for product catalogs, user lists, etc.
   */
  createStaticFetcher<T>(
    baseUrl: string,
    revalidateInterval: number = 3600 // 1 hour default
  ) {
    return async (endpoint: string = ''): Promise<EnhancedFetchResponse<T>> => {
      const url = `${baseUrl}${endpoint}`;

      const response = await this.enhancedFetch<T>(url, {
        next: {
          revalidate: revalidateInterval,
          tags: [`static-${baseUrl.replace(/[^a-zA-Z0-9]/g, '-')}`],
        },
        analytics: {
          trackPerformance: true,
          userStory: 'US-6.1',
          hypothesis: 'H8',
        },
      });

      return response;
    };
  }

  /**
   * Get optimized fetch function for dynamic data
   * Ideal for user-specific dashboards, real-time data
   */
  createDynamicFetcher<T>(
    baseUrl: string,
    cacheTime: number = 60 // 1 minute default
  ) {
    return async (endpoint: string = ''): Promise<EnhancedFetchResponse<T>> => {
      const url = `${baseUrl}${endpoint}`;

      const response = await this.enhancedFetch<T>(url, {
        next: {
          revalidate: cacheTime,
          tags: [`dynamic-${baseUrl.replace(/[^a-zA-Z0-9]/g, '-')}`],
        },
        analytics: {
          trackPerformance: true,
          userStory: 'US-6.3',
          hypothesis: 'H11',
        },
      });

      return response;
    };
  }

  /**
   * Revalidate data by tags
   */
  async revalidateByTags(tags: string[]): Promise<void> {
    try {
      // ✅ FIXED: Use standardized error handling
      const standardError = this.errorHandlingService.processError(
        new Error('Revalidation not implemented in this version'),
        'Revalidation by tags failed',
        ErrorCodes.API.REQUEST_FAILED,
        {
          component: 'NextJSDataFetchingService',
          operation: 'revalidateByTags',
          tags,
        }
      );

      throw standardError;
    } catch (error) {
      // ✅ FIXED: Use standardized error handling
      const standardError = this.errorHandlingService.processError(
        error,
        'Revalidation by tags failed',
        ErrorCodes.API.REQUEST_FAILED,
        {
          component: 'NextJSDataFetchingService',
          operation: 'revalidateByTags',
          tags,
        }
      );

      throw standardError;
    }
  }
}

/**
 * React hook for enhanced fetching
 */
export function useEnhancedFetch() {
  const service = NextJSDataFetchingService.getInstance();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  useEffect(() => {
    service.initializeAnalytics(analytics);
  }, [service, analytics]);

  return {
    enhancedFetch: service.enhancedFetch.bind(service),
    createStaticFetcher: service.createStaticFetcher.bind(service),
    createDynamicFetcher: service.createDynamicFetcher.bind(service),
    revalidateByTags: service.revalidateByTags.bind(service),
  };
}

/**
 * Hybrid API client that combines Next.js primitives with our infrastructure
 */
export function useHybridApiClient() {
  const apiClient = useApiClient();
  const enhancedFetch = useEnhancedFetch();

  return {
    ...apiClient,
    ...enhancedFetch,
  };
}
