/**
 * PosalPro MVP2 - Performance Optimizer
 * Advanced caching and optimization utilities
 * Addresses TTFB regression and admin API slowness
 */

import { logDebug, logError, logInfo } from '@/lib/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
  slow: boolean;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private cache = new Map<string, CacheEntry<any>>();
  private queryMetrics: QueryMetrics[] = [];
  private readonly SLOW_QUERY_THRESHOLD = 500; // ms
  private readonly DEFAULT_CACHE_TTL = 30000; // 30 seconds

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Cache expensive operations with TTL
   */
  async withCache<T>(
    key: string,
    operation: () => Promise<T>,
    ttl: number = this.DEFAULT_CACHE_TTL
  ): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      logDebug('Cache hit', {
        component: 'PerformanceOptimizer',
        operation: 'withCache',
        key,
        age: Date.now() - cached.timestamp,
      });
      return cached.data;
    }

    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;

    // Cache the result
    this.cache.set(key, {
      data: result,
      timestamp: Date.now(),
      ttl,
    });

    // Track performance metrics
    this.recordQueryMetrics(`cache:${key}`, duration);

    logDebug('Cache miss - operation completed', {
      component: 'PerformanceOptimizer',
      operation: 'withCache',
      key,
      duration,
      cached: true,
    });

    return result;
  }

  /**
   * Invalidate cache entries
   */
  invalidateCache(pattern: string | RegExp): void {
    if (typeof pattern === 'string') {
      // Exact match
      this.cache.delete(pattern);
    } else {
      // Regex pattern match
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      }
    }

    logDebug('Cache invalidated', {
      component: 'PerformanceOptimizer',
      operation: 'invalidateCache',
      pattern: typeof pattern === 'string' ? pattern : pattern.toString(),
    });
  }

  /**
   * Record query performance metrics
   */
  recordQueryMetrics(query: string, duration: number): void {
    const metrics: QueryMetrics = {
      query,
      duration,
      timestamp: Date.now(),
      slow: duration > this.SLOW_QUERY_THRESHOLD,
    };

    this.queryMetrics.push(metrics);

    // Keep only last 100 metrics
    if (this.queryMetrics.length > 100) {
      this.queryMetrics.shift();
    }

    if (metrics.slow) {
      logInfo('Slow query detected', {
        component: 'PerformanceOptimizer',
        operation: 'recordQueryMetrics',
        query,
        duration,
        threshold: this.SLOW_QUERY_THRESHOLD,
      });
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    cacheSize: number;
    slowQueries: QueryMetrics[];
    averageQueryTime: number;
    cacheHitRate: number;
  } {
    const slowQueries = this.queryMetrics.filter(m => m.slow);
    const totalQueries = this.queryMetrics.length;
    const averageQueryTime =
      totalQueries > 0
        ? this.queryMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries
        : 0;

    // Simple cache hit rate estimation (this would need more sophisticated tracking)
    const cacheHitRate = 0.75; // Placeholder - implement proper tracking

    return {
      cacheSize: this.cache.size,
      slowQueries,
      averageQueryTime,
      cacheHitRate,
    };
  }

  /**
   * Optimize database queries with connection pooling hints
   */
  async optimizeQuery<T>(
    operation: () => Promise<T>,
    queryName: string,
    options: {
      useCache?: boolean;
      cacheKey?: string;
      cacheTtl?: number;
      priority?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<T> {
    const {
      useCache = false,
      cacheKey = queryName,
      cacheTtl = this.DEFAULT_CACHE_TTL,
      priority = 'medium',
    } = options;

    if (useCache) {
      return this.withCache(cacheKey, operation, cacheTtl);
    }

    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;

    this.recordQueryMetrics(queryName, duration);

    logDebug('Query executed', {
      component: 'PerformanceOptimizer',
      operation: 'optimizeQuery',
      queryName,
      duration,
      priority,
      slow: duration > this.SLOW_QUERY_THRESHOLD,
    });

    return result;
  }

  /**
   * Batch multiple database operations
   */
  async batchOperations<T>(
    operations: Array<{
      operation: () => Promise<any>;
      name: string;
      priority?: 'low' | 'medium' | 'high';
    }>
  ): Promise<T[]> {
    const startTime = Date.now();

    // Execute operations in parallel with error handling
    const results = await Promise.allSettled(
      operations.map(async ({ operation, name }) => {
        const opStartTime = Date.now();
        try {
          const result = await operation();
          const duration = Date.now() - opStartTime;
          this.recordQueryMetrics(name, duration);
          return result;
        } catch (error) {
          const duration = Date.now() - opStartTime;
          logError('Batch operation failed', {
            component: 'PerformanceOptimizer',
            operation: 'batchOperations',
            operationName: name,
            duration,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      })
    );

    const totalDuration = Date.now() - startTime;

    // Extract successful results
    const successfulResults: T[] = [];
    const failures: any[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value);
      } else {
        failures.push({
          operation: operations[index].name,
          error: result.reason,
        });
      }
    });

    logInfo('Batch operations completed', {
      component: 'PerformanceOptimizer',
      operation: 'batchOperations',
      totalOperations: operations.length,
      successfulOperations: successfulResults.length,
      failedOperations: failures.length,
      totalDuration,
      averageDuration: totalDuration / operations.length,
    });

    if (failures.length > 0) {
      logError('Some batch operations failed', {
        component: 'PerformanceOptimizer',
        operation: 'batchOperations',
        failures,
      });
    }

    return successfulResults;
  }

  /**
   * Clear all caches (useful for testing or cache invalidation)
   */
  clearCache(): void {
    const cacheSize = this.cache.size;
    this.cache.clear();

    logInfo('Cache cleared', {
      component: 'PerformanceOptimizer',
      operation: 'clearCache',
      previousCacheSize: cacheSize,
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();
