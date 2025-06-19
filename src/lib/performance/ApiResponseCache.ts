/**
 * PosalPro MVP2 - API Response Caching Service
 * Intelligent API response caching with optimization and monitoring
 *
 * Component Traceability Matrix Integration
 * User Stories: US-6.1 (Performance), US-6.3 (Data Efficiency), US-4.1 (Analytics)
 * Hypotheses: H8 (Load Time), H11 (Cache Hit Rate), H13 (API Performance)
 */

'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { LoggingService } from '@/lib/logging/LoggingService';
import React from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-6.1', 'US-6.3', 'US-4.1', 'US-2.1'],
  acceptanceCriteria: [
    'AC-6.1.5', // API response optimization
    'AC-6.3.5', // Response caching strategy
    'AC-6.3.6', // Bandwidth optimization
    'AC-4.1.9', // API performance analytics
    'AC-2.1.5', // Data transfer efficiency
  ],
  methods: [
    'optimizeApiResponse()',
    'implementResponseCaching()',
    'compressResponseData()',
    'trackApiPerformance()',
    'manageResponseHeaders()',
  ],
  hypotheses: ['H8', 'H11', 'H13'],
  testCases: ['TC-H8-008', 'TC-H11-004', 'TC-H13-001'],
};

// API cache configuration
export interface ApiCacheConfig {
  enableResponseCaching: boolean;
  enableCompression: boolean;
  enableEtagSupport: boolean;
  enableStaleWhileRevalidate: boolean;
  defaultCacheTTL: number;
  compressionThreshold: number; // bytes
  maxCacheSize: number;
  staleToleranceTime: number;
}

// Cache strategy options
export enum CacheStrategy {
  NO_CACHE = 'no-cache',
  CACHE_FIRST = 'cache-first',
  NETWORK_FIRST = 'network-first',
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate',
  CACHE_ONLY = 'cache-only',
  NETWORK_ONLY = 'network-only',
}

// API response cache entry
export interface ApiCacheEntry {
  url: string;
  method: string;
  headers: Record<string, string>;
  response: any;
  timestamp: number;
  ttl: number;
  etag?: string;
  lastModified?: string;
  contentLength: number;
  compressed: boolean;
  accessCount: number;
  lastAccessed: number;
}

// API performance metrics
export interface ApiPerformanceMetrics {
  totalRequests: number;
  cachedResponses: number;
  networkRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  compressionRatio: number;
  bandwidthSaved: number;
  topEndpoints: EndpointStats[];
  slowestEndpoints: EndpointStats[];
}

// Endpoint statistics
export interface EndpointStats {
  endpoint: string;
  method: string;
  requestCount: number;
  averageResponseTime: number;
  cacheHitRate: number;
  totalSize: number;
  compressionRatio: number;
}

// Request context for caching decisions
export interface RequestContext {
  url: string;
  method: string;
  headers: Record<string, string>;
  userId?: string;
  userRole?: string;
  strategy?: CacheStrategy;
  customTTL?: number;
  priority?: 'high' | 'medium' | 'low';
}

/**
 * API Response Caching Service with intelligent optimization
 */
export class ApiResponseCache {
  private static instance: ApiResponseCache;
  private errorHandlingService: ErrorHandlingService;
  private loggingService: LoggingService;
  private analytics: any;

  private config: ApiCacheConfig;
  private cache: Map<string, ApiCacheEntry> = new Map();
  private responseCache: Map<string, Promise<any>> = new Map(); // In-flight request deduplication

  private metrics: ApiPerformanceMetrics = {
    totalRequests: 0,
    cachedResponses: 0,
    networkRequests: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    compressionRatio: 0,
    bandwidthSaved: 0,
    topEndpoints: [],
    slowestEndpoints: [],
  };

  private endpointStats: Map<string, EndpointStats> = new Map();
  private responseTimes: number[] = [];

  private constructor(config: Partial<ApiCacheConfig> = {}) {
    this.errorHandlingService = ErrorHandlingService.getInstance();
    this.loggingService = LoggingService.getInstance();

    this.config = {
      enableResponseCaching: true,
      enableCompression: true,
      enableEtagSupport: true,
      enableStaleWhileRevalidate: true,
      defaultCacheTTL: 5 * 60 * 1000, // 5 minutes
      compressionThreshold: 1024, // 1KB
      maxCacheSize: 50 * 1024 * 1024, // 50MB
      staleToleranceTime: 30 * 1000, // 30 seconds
      ...config,
    };

    this.startPerformanceMonitoring();
  }

  static getInstance(config?: Partial<ApiCacheConfig>): ApiResponseCache {
    if (!ApiResponseCache.instance) {
      ApiResponseCache.instance = new ApiResponseCache(config);
    }
    return ApiResponseCache.instance;
  }

  /**
   * Initialize analytics integration
   */
  initializeAnalytics(analytics: any) {
    this.analytics = analytics;
  }

  /**
   * Execute API request with intelligent caching
   */
  async executeRequest<T>(requestFn: () => Promise<T>, context: RequestContext): Promise<T> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(context);

    try {
      this.metrics.totalRequests++;

      // Check for in-flight request deduplication
      if (this.responseCache.has(cacheKey)) {
        const responseTime = performance.now() - startTime;
        this.trackRequestMetrics(context, responseTime, 'deduplication');

        this.loggingService.info('API request served from in-flight deduplication', {
          component: 'ApiResponseCache',
          operation: 'executeRequest',
          userStories: ['US-6.1', 'US-6.3'],
          hypotheses: ['H8', 'H11', 'H13'],
          url: context.url,
          method: context.method,
          cacheKey,
          responseTime,
          timestamp: Date.now(),
        });

        return await this.responseCache.get(cacheKey)!;
      }

      // Determine caching strategy
      const strategy = context.strategy || this.determineCacheStrategy(context);

      // Handle different caching strategies
      switch (strategy) {
        case CacheStrategy.CACHE_FIRST:
          return await this.handleCacheFirst<T>(requestFn, context, cacheKey, startTime);

        case CacheStrategy.NETWORK_FIRST:
          return await this.handleNetworkFirst<T>(requestFn, context, cacheKey, startTime);

        case CacheStrategy.STALE_WHILE_REVALIDATE:
          return await this.handleStaleWhileRevalidate<T>(requestFn, context, cacheKey, startTime);

        case CacheStrategy.CACHE_ONLY:
          return await this.handleCacheOnly<T>(context, cacheKey, startTime);

        case CacheStrategy.NETWORK_ONLY:
          return await this.handleNetworkOnly<T>(requestFn, context, startTime);

        default:
          return await this.handleNetworkFirst<T>(requestFn, context, cacheKey, startTime);
      }
    } catch (error) {
      const responseTime = performance.now() - startTime;

      const processedError = this.errorHandlingService.processError(
        error as Error,
        `API request failed: ${context.method} ${context.url}`,
        ErrorCodes.API.REQUEST_FAILED,
        {
          component: 'ApiResponseCache',
          operation: 'executeRequest',
          userStories: ['US-6.1', 'US-6.3'],
          hypotheses: ['H8', 'H11', 'H13'],
          url: context.url,
          method: context.method,
          responseTime,
          cacheKey,
          timestamp: Date.now(),
        }
      );

      throw processedError;
    }
  }

  /**
   * Handle cache-first strategy
   */
  private async handleCacheFirst<T>(
    requestFn: () => Promise<T>,
    context: RequestContext,
    cacheKey: string,
    startTime: number
  ): Promise<T> {
    // Try cache first
    const cachedResponse = this.getCachedResponse<T>(cacheKey);
    if (cachedResponse) {
      const responseTime = performance.now() - startTime;
      this.trackRequestMetrics(context, responseTime, 'cache');
      return cachedResponse;
    }

    // Fallback to network
    return await this.executeNetworkRequest<T>(requestFn, context, cacheKey, startTime);
  }

  /**
   * Handle network-first strategy
   */
  private async handleNetworkFirst<T>(
    requestFn: () => Promise<T>,
    context: RequestContext,
    cacheKey: string,
    startTime: number
  ): Promise<T> {
    try {
      // Try network first
      return await this.executeNetworkRequest<T>(requestFn, context, cacheKey, startTime);
    } catch (error) {
      // Fallback to cache if network fails
      const cachedResponse = this.getCachedResponse<T>(cacheKey);
      if (cachedResponse) {
        this.loggingService.warn('Network request failed, serving stale cache', {
          component: 'ApiResponseCache',
          url: context.url,
          method: context.method,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        });

        const responseTime = performance.now() - startTime;
        this.trackRequestMetrics(context, responseTime, 'stale');
        return cachedResponse;
      }
      throw error;
    }
  }

  /**
   * Handle stale-while-revalidate strategy
   */
  private async handleStaleWhileRevalidate<T>(
    requestFn: () => Promise<T>,
    context: RequestContext,
    cacheKey: string,
    startTime: number
  ): Promise<T> {
    const cachedEntry = this.cache.get(cacheKey);

    if (cachedEntry) {
      const age = Date.now() - cachedEntry.timestamp;

      if (age < cachedEntry.ttl) {
        // Cache is fresh, return immediately
        const responseTime = performance.now() - startTime;
        this.trackRequestMetrics(context, responseTime, 'cache');
        return this.deserializeResponse<T>(cachedEntry);
      } else if (age < cachedEntry.ttl + this.config.staleToleranceTime) {
        // Cache is stale but within tolerance, return stale and revalidate in background
        this.backgroundRevalidate(requestFn, context, cacheKey);

        const responseTime = performance.now() - startTime;
        this.trackRequestMetrics(context, responseTime, 'stale');
        return this.deserializeResponse<T>(cachedEntry);
      }
    }

    // No cache or too stale, fetch from network
    return await this.executeNetworkRequest<T>(requestFn, context, cacheKey, startTime);
  }

  /**
   * Handle cache-only strategy
   */
  private async handleCacheOnly<T>(
    context: RequestContext,
    cacheKey: string,
    startTime: number
  ): Promise<T> {
    const cachedResponse = this.getCachedResponse<T>(cacheKey);
    if (cachedResponse) {
      const responseTime = performance.now() - startTime;
      this.trackRequestMetrics(context, responseTime, 'cache');
      return cachedResponse;
    }

    throw new Error(`No cached response available for: ${context.method} ${context.url}`);
  }

  /**
   * Handle network-only strategy
   */
  private async handleNetworkOnly<T>(
    requestFn: () => Promise<T>,
    context: RequestContext,
    startTime: number
  ): Promise<T> {
    const responsePromise = requestFn();
    const result = await responsePromise;

    const responseTime = performance.now() - startTime;
    this.trackRequestMetrics(context, responseTime, 'network');

    return result;
  }

  /**
   * Execute network request with caching
   */
  private async executeNetworkRequest<T>(
    requestFn: () => Promise<T>,
    context: RequestContext,
    cacheKey: string,
    startTime: number
  ): Promise<T> {
    // Store in-flight request for deduplication
    const responsePromise = requestFn();
    this.responseCache.set(cacheKey, responsePromise);

    try {
      const result = await responsePromise;
      const responseTime = performance.now() - startTime;

      // Cache the response if caching is enabled
      if (this.config.enableResponseCaching && context.method === 'GET') {
        await this.cacheResponse(cacheKey, result, context, responseTime);
      }

      this.trackRequestMetrics(context, responseTime, 'network');

      this.loggingService.info('API request executed successfully', {
        component: 'ApiResponseCache',
        operation: 'executeNetworkRequest',
        userStories: ['US-6.1', 'US-6.3'],
        hypotheses: ['H8', 'H11', 'H13'],
        url: context.url,
        method: context.method,
        responseTime,
        cached: true,
        timestamp: Date.now(),
      });

      return result;
    } finally {
      // Remove from in-flight requests
      this.responseCache.delete(cacheKey);
    }
  }

  /**
   * Background revalidation for stale-while-revalidate
   */
  private backgroundRevalidate<T>(
    requestFn: () => Promise<T>,
    context: RequestContext,
    cacheKey: string
  ): void {
    const startTime = performance.now();

    requestFn()
      .then(async result => {
        const responseTime = performance.now() - startTime;
        await this.cacheResponse(cacheKey, result, context, responseTime);

        this.loggingService.info('Background revalidation completed', {
          component: 'ApiResponseCache',
          operation: 'backgroundRevalidate',
          url: context.url,
          method: context.method,
          responseTime,
          timestamp: Date.now(),
        });
      })
      .catch(error => {
        this.loggingService.warn('Background revalidation failed', {
          component: 'ApiResponseCache',
          operation: 'backgroundRevalidate',
          url: context.url,
          method: context.method,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        });
      });
  }

  /**
   * Get cached response
   */
  private getCachedResponse<T>(cacheKey: string): T | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return this.deserializeResponse<T>(entry);
  }

  /**
   * Cache API response
   */
  private async cacheResponse(
    cacheKey: string,
    response: any,
    context: RequestContext,
    responseTime: number
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(response);
      let compressed = false;
      let finalResponse = serialized;

      // Compress if above threshold
      if (this.config.enableCompression && serialized.length > this.config.compressionThreshold) {
        finalResponse = this.compress(serialized);
        compressed = true;
      }

      const contentLength = new Blob([finalResponse]).size;

      // Check cache size limits
      await this.ensureCacheSpace(contentLength);

      const cacheEntry: ApiCacheEntry = {
        url: context.url,
        method: context.method,
        headers: context.headers,
        response: finalResponse,
        timestamp: Date.now(),
        ttl: context.customTTL || this.config.defaultCacheTTL,
        contentLength,
        compressed,
        accessCount: 0,
        lastAccessed: Date.now(),
      };

      this.cache.set(cacheKey, cacheEntry);

      // Track metrics
      if (compressed) {
        const originalSize = new Blob([serialized]).size;
        const compressionSavings = originalSize - contentLength;
        this.metrics.bandwidthSaved += compressionSavings;
      }
    } catch (error) {
      this.loggingService.warn('Failed to cache API response', {
        component: 'ApiResponseCache',
        operation: 'cacheResponse',
        url: context.url,
        method: context.method,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Ensure cache space by evicting old entries
   */
  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    const currentSize = this.getCurrentCacheSize();

    if (currentSize + requiredSize <= this.config.maxCacheSize) {
      return;
    }

    // Sort by last accessed time (LRU)
    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.lastAccessed - b.lastAccessed
    );

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSize) break;

      this.cache.delete(key);
      freedSpace += entry.contentLength;
    }
  }

  /**
   * Calculate current cache size
   */
  private getCurrentCacheSize(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.contentLength;
    }
    return totalSize;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(context: RequestContext): string {
    const keyData = {
      url: context.url,
      method: context.method,
      userId: context.userId,
      userRole: context.userRole,
    };

    return btoa(JSON.stringify(keyData));
  }

  /**
   * Determine cache strategy based on context
   */
  private determineCacheStrategy(context: RequestContext): CacheStrategy {
    // GET requests default to cache-first
    if (context.method === 'GET') {
      return CacheStrategy.CACHE_FIRST;
    }

    // POST, PUT, DELETE default to network-only
    return CacheStrategy.NETWORK_ONLY;
  }

  /**
   * Compress response data
   */
  private compress(data: string): string {
    // Simple base64 compression for demo (use proper compression in production)
    return btoa(data);
  }

  /**
   * Decompress response data
   */
  private decompress(data: string): string {
    return atob(data);
  }

  /**
   * Deserialize cached response
   */
  private deserializeResponse<T>(entry: ApiCacheEntry): T {
    const data = entry.compressed ? this.decompress(entry.response) : entry.response;
    return JSON.parse(data);
  }

  /**
   * Track request metrics
   */
  private trackRequestMetrics(
    context: RequestContext,
    responseTime: number,
    source: 'cache' | 'network' | 'stale' | 'deduplication'
  ): void {
    this.responseTimes.push(responseTime);

    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    // Update metrics
    if (source === 'cache' || source === 'stale' || source === 'deduplication') {
      this.metrics.cachedResponses++;
    } else {
      this.metrics.networkRequests++;
    }

    this.metrics.averageResponseTime =
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;

    this.metrics.cacheHitRate = this.metrics.cachedResponses / this.metrics.totalRequests;

    // Update endpoint stats
    const endpointKey = `${context.method} ${context.url}`;
    const stats = this.endpointStats.get(endpointKey) || {
      endpoint: context.url,
      method: context.method,
      requestCount: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      totalSize: 0,
      compressionRatio: 0,
    };

    stats.requestCount++;
    stats.averageResponseTime =
      (stats.averageResponseTime * (stats.requestCount - 1) + responseTime) / stats.requestCount;

    this.endpointStats.set(endpointKey, stats);

    // Analytics tracking
    if (this.analytics) {
      this.analytics.track('api_request_completed', {
        userStories: ['US-6.1', 'US-6.3', 'US-4.1'],
        hypotheses: ['H8', 'H11', 'H13'],
        url: context.url,
        method: context.method,
        responseTime,
        source,
        cacheHit: source !== 'network',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): ApiPerformanceMetrics {
    // Update top and slowest endpoints
    const sortedEndpoints = Array.from(this.endpointStats.values());

    this.metrics.topEndpoints = sortedEndpoints
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 10);

    this.metrics.slowestEndpoints = sortedEndpoints
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
      .slice(0, 10);

    return { ...this.metrics };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.responseCache.clear();

    this.loggingService.info('API response cache cleared', {
      component: 'ApiResponseCache',
      operation: 'clearCache',
      timestamp: Date.now(),
    });
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Update metrics every 30 seconds
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 30000);

    // Cleanup expired entries every 5 minutes
    setInterval(
      () => {
        this.cleanupExpiredEntries();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    // Calculate compression ratio
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    for (const entry of this.cache.values()) {
      if (entry.compressed) {
        totalCompressedSize += entry.contentLength;
        totalOriginalSize += entry.contentLength * 1.5; // Estimate
      }
    }

    this.metrics.compressionRatio =
      totalOriginalSize > 0 ? totalCompressedSize / totalOriginalSize : 1;

    // Analytics tracking
    if (this.analytics) {
      this.analytics.track('api_cache_metrics_updated', {
        userStories: ['US-6.1', 'US-6.3', 'US-4.1'],
        hypotheses: ['H8', 'H11', 'H13'],
        metrics: this.metrics,
        cacheSize: this.cache.size,
        totalCacheSize: this.getCurrentCacheSize(),
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.loggingService.info('Expired cache entries cleaned up', {
        component: 'ApiResponseCache',
        operation: 'cleanupExpiredEntries',
        expiredCount,
        remainingEntries: this.cache.size,
        timestamp: Date.now(),
      });
    }
  }
}

/**
 * Hook for API response caching
 */
export function useApiCache(config?: Partial<ApiCacheConfig>) {
  const analytics = useAnalytics();

  const apiCache = React.useMemo(() => {
    return ApiResponseCache.getInstance(config);
  }, [config]);

  React.useEffect(() => {
    apiCache.initializeAnalytics(analytics);
  }, [apiCache, analytics]);

  return {
    executeRequest: apiCache.executeRequest.bind(apiCache),
    getMetrics: apiCache.getMetrics.bind(apiCache),
    clearCache: apiCache.clearCache.bind(apiCache),
  };
}

// Export singleton instance
export const apiResponseCache = ApiResponseCache.getInstance();

export default ApiResponseCache;
