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

import { useAnalytics } from '@/hooks/useAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { AdvancedCacheManager } from '@/lib/performance/AdvancedCacheManager';
import { useCallback, useEffect, useMemo } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-6.1', 'US-6.3', 'US-4.1'],
  acceptanceCriteria: [
    'AC-6.1.1', // Performance optimization
    'AC-6.3.1', // Data access efficiency
    'AC-6.3.2', // Intelligent caching
    'AC-4.1.6', // Analytics tracking
  ],
  methods: [
    'optimizeDataFetching()',
    'integrateNextJSPrimitives()',
    'maintainAnalyticsTracking()',
    'preserveErrorHandling()',
  ],
  hypotheses: ['H8', 'H11'],
  testCases: ['TC-H8-005', 'TC-H11-002'],
};

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
    context?: Record<string, any>;
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
  private static instance: NextJSDataFetchingService;
  private errorHandlingService: ErrorHandlingService;
  private cacheManager: AdvancedCacheManager;
  private analytics: any;

  private constructor() {
    this.errorHandlingService = ErrorHandlingService.getInstance();
    this.cacheManager = AdvancedCacheManager.getInstance();
  }

  static getInstance(): NextJSDataFetchingService {
    if (!NextJSDataFetchingService.instance) {
      NextJSDataFetchingService.instance = new NextJSDataFetchingService();
    }
    return NextJSDataFetchingService.instance;
  }

  initializeAnalytics(analytics: any) {
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
        this.analytics.track('enhanced_fetch_started', {
          userStories: ['US-6.1', 'US-6.3'],
          hypotheses: ['H8', 'H11'],
          url,
          useNextJSPrimitives: !!next,
          cacheEnabled: cache.enabled,
          userStory: analytics.userStory,
          hypothesis: analytics.hypothesis,
          timestamp: Date.now(),
        });
      }

      let response: Response;
      let fromNextJS = false;
      let cacheHit = false;
      let source: 'nextjs' | 'advanced-cache' | 'network' = 'network';

      // 1. Check our advanced cache first (always fastest)
      if (cache.enabled) {
        const cacheKey = cache.key || `${url}_${JSON.stringify(fetchOptions)}`;
        const cachedData = await this.cacheManager.get<T>(cacheKey);

        if (cachedData) {
          const fetchTime = performance.now() - startTime;

          if (analytics.trackPerformance && this.analytics) {
            this.analytics.track('enhanced_fetch_cache_hit', {
              userStories: ['US-6.1', 'US-6.3'],
              hypotheses: ['H8', 'H11'],
              url,
              source: 'advanced-cache',
              fetchTime,
              userStory: analytics.userStory,
              hypothesis: analytics.hypothesis,
            });
          }

          return {
            data: cachedData,
            success: true,
            cached: true,
            fromNextJS: false,
            performance: {
              fetchTime,
              cacheHit: true,
              source: 'advanced-cache',
            },
          };
        }
      }

      // 2. Use Next.js primitives with our enhancements
      if (next) {
        response = await fetch(url, {
          ...fetchOptions,
          next,
        });
        fromNextJS = true;
        source = 'nextjs';
      } else {
        // 3. Fallback to standard fetch
        response = await fetch(url, fetchOptions);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: T = await response.json();
      const fetchTime = performance.now() - startTime;

      // Store in our advanced cache for future requests
      if (cache.enabled && response.ok) {
        const cacheKey = cache.key || `${url}_${JSON.stringify(fetchOptions)}`;
        await this.cacheManager.set(cacheKey, data, {
          ttl: cache.ttl,
          tags: next?.tags || [],
          metadata: {
            nextJSRevalidate: next?.revalidate,
            url,
            timestamp: Date.now(),
          },
        });
      }

      // Analytics tracking success
      if (analytics.trackPerformance && this.analytics) {
        this.analytics.track('enhanced_fetch_success', {
          userStories: ['US-6.1', 'US-6.3'],
          hypotheses: ['H8', 'H11'],
          url,
          source,
          fetchTime,
          responseSize: JSON.stringify(data).length,
          fromNextJS,
          userStory: analytics.userStory,
          hypothesis: analytics.hypothesis,
        });
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
        const processedError = this.errorHandlingService.processError(
          error as Error,
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
            timestamp: Date.now(),
          }
        );

        throw processedError;
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
    return async (endpoint: string = '', userId?: string): Promise<EnhancedFetchResponse<T>> => {
      const url = `${baseUrl}${endpoint}`;

      const response = await this.enhancedFetch<T>(url, {
        next: {
          revalidate: cacheTime,
          tags: userId ? [`dynamic-user-${userId}`] : ['dynamic-global'],
        },
        cache: {
          enabled: true,
          ttl: cacheTime * 1000,
          key: userId ? `${url}_user_${userId}` : url,
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
   * Revalidate cached data by tags
   * Integrates with Next.js revalidateTag when available
   */
  async revalidateByTags(tags: string[]): Promise<void> {
    try {
      // Clear our advanced cache entries with matching tags
      // Note: clearByTags method needs to be implemented in AdvancedCacheManager
      this.cacheManager.clear(); // Temporary fallback

      // Use Next.js revalidateTag if available (server-side)
      if (typeof window === 'undefined') {
        const { revalidateTag } = await import('next/cache');
        for (const tag of tags) {
          revalidateTag(tag);
        }
      }

      if (this.analytics) {
        this.analytics.track('cache_revalidation_performed', {
          userStories: ['US-6.1', 'US-6.3'],
          hypotheses: ['H8', 'H11'],
          tags,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      this.errorHandlingService.processError(
        error as Error,
        'Cache revalidation failed',
        ErrorCodes.SYSTEM.CACHE_OPERATION_FAILED,
        {
          component: 'NextJSDataFetchingService',
          operation: 'revalidateByTags',
          tags,
        }
      );
    }
  }
}

/**
 * Hook for Next.js data fetching with infrastructure integration
 */
export function useEnhancedFetch() {
  const analytics = useAnalytics();
  const fetchingService = useMemo(() => {
    return NextJSDataFetchingService.getInstance();
  }, []);

  useEffect(() => {
    fetchingService.initializeAnalytics(analytics);
  }, [fetchingService, analytics]);

  return {
    enhancedFetch: fetchingService.enhancedFetch.bind(fetchingService),
    createStaticFetcher: fetchingService.createStaticFetcher.bind(fetchingService),
    createDynamicFetcher: fetchingService.createDynamicFetcher.bind(fetchingService),
    revalidateByTags: fetchingService.revalidateByTags.bind(fetchingService),
  };
}

/**
 * Hook that provides a drop-in replacement for useApiClient
 * with Next.js primitives integration
 */
export function useHybridApiClient() {
  const originalApiClient = useApiClient();
  const { enhancedFetch } = useEnhancedFetch();
  const analytics = useAnalytics();

  const get = useCallback(
    async <T>(
      endpoint: string,
      options: {
        revalidate?: number;
        tags?: string[];
        cacheTime?: number;
      } = {}
    ): Promise<{ data: T; success: boolean }> => {
      const { revalidate, tags, cacheTime } = options;

      // Use enhanced fetch for better performance
      if (revalidate !== undefined || tags || cacheTime) {
        const response = await enhancedFetch<T>(endpoint, {
          next:
            revalidate !== undefined || tags
              ? {
                  revalidate,
                  tags,
                }
              : undefined,
          cache: {
            enabled: true,
            ttl: cacheTime || 300000,
          },
          analytics: {
            trackPerformance: true,
            userStory: 'US-6.1',
            hypothesis: 'H8',
          },
        });

        return {
          data: response.data,
          success: response.success,
        };
      }

      // Fallback to original API client for compatibility
      const response = await originalApiClient.get<any>(endpoint);

      // Handle different response formats
      if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
        return { data: response.data as T, success: response.success };
      } else {
        // Legacy response format - wrap in our expected structure
        return { data: response as T, success: true };
      }
    },
    [originalApiClient, enhancedFetch]
  );

  return {
    ...originalApiClient,
    get,
    // Add convenience methods
    getStatic: useCallback(
      <T>(endpoint: string, revalidate = 3600) => get<T>(endpoint, { revalidate }),
      [get]
    ),
    getDynamic: useCallback(
      <T>(endpoint: string, cacheTime = 60) => get<T>(endpoint, { cacheTime }),
      [get]
    ),
  };
}

// Export singleton instance
export const nextJSDataFetching = NextJSDataFetchingService.getInstance();
