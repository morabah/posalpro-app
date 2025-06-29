/**
 * PosalPro MVP2 - Advanced Cache System Implementation
 * Intelligent caching with performance optimization and analytics integration
 *
 * Component Traceability Matrix Integration
 * User Stories: US-6.1 (Performance), US-6.3 (Data Efficiency)
 * Hypotheses: H8 (Load Time), H11 (Cache Hit Rate)
 */

'use client';

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import React from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-6.1', 'US-6.3', 'US-4.1'],
  acceptanceCriteria: [
    'AC-6.1.3', // Cache performance optimization
    'AC-6.3.1', // Data access efficiency
    'AC-6.3.2', // Intelligent prefetching
    'AC-4.1.6', // Performance tracking
  ],
  methods: [
    'optimizeCachePerformance()',
    'implementIntelligentPrefetching()',
    'trackCacheMetrics()',
    'manageMemoryEfficiently()',
    'validateCacheIntegrity()',
  ],
  hypotheses: ['H8', 'H11'],
  testCases: ['TC-H8-004', 'TC-H11-001'],
};

// Cache configuration interface
export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxItems: number; // Maximum number of items
  defaultTTL: number; // Default time to live in ms
  enableCompression: boolean;
  enablePrefetching: boolean;
  enableAnalytics: boolean;
}

// Cache item interface
export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  compressed: boolean;
}

// Cache metrics interface
export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  memoryUsage: number;
  totalRequests: number;
  averageResponseTime: number;
  compressionRatio: number;
}

/**
 * Advanced Cache System with intelligent optimization
 */
export class AdvancedCacheSystem {
  private static instance: AdvancedCacheSystem;
  private errorHandlingService: ErrorHandlingService;
  private analytics: any;

  private cache: Map<string, CacheItem> = new Map();
  private accessOrder: string[] = []; // For LRU tracking
  private prefetchQueue: Set<string> = new Set();

  private config: CacheConfig;
  private metrics: CacheMetrics = {
    hitRate: 0,
    missRate: 0,
    memoryUsage: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    compressionRatio: 0,
  };

  private requestCounts = { hits: 0, misses: 0, totalRequests: 0 };
  private responseTimes: number[] = [];

  private constructor(config: Partial<CacheConfig> = {}) {
    this.errorHandlingService = ErrorHandlingService.getInstance();
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB default
      maxItems: 1000,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      enableCompression: true,
      enablePrefetching: true,
      enableAnalytics: true,
      ...config,
    };

    this.startBackgroundCleanup();
  }

  static getInstance(config?: Partial<CacheConfig>): AdvancedCacheSystem {
    if (!AdvancedCacheSystem.instance) {
      AdvancedCacheSystem.instance = new AdvancedCacheSystem(config);
    }
    return AdvancedCacheSystem.instance;
  }

  /**
   * Initialize analytics integration
   */
  initializeAnalytics(analytics: any) {
    this.analytics = analytics;
  }

  /**
   * Set cache item with intelligent optimization
   */
  async set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      compress?: boolean;
    } = {}
  ): Promise<boolean> {
    const startTime = performance.now();

    try {
      const { ttl = this.config.defaultTTL, compress = this.config.enableCompression } = options;

      // Serialize and optionally compress data
      let serializedData = JSON.stringify(data);
      let compressed = false;

      if (compress && serializedData.length > 1024) {
        // Only compress if > 1KB
        serializedData = this.compress(serializedData);
        compressed = true;
      }

      const size = this.calculateSize(serializedData);

      // Check if we need to make space
      await this.ensureSpace(size);

      const cacheItem: CacheItem<T> = {
        data: compressed ? (serializedData as T) : data,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        size,
        compressed,
      };

      this.cache.set(key, cacheItem);
      this.updateAccessOrder(key);

      const responseTime = performance.now() - startTime;
      this.recordResponseTime(responseTime);

      // Analytics tracking
      if (this.config.enableAnalytics && this.analytics) {
        this.analytics.track('cache_item_set', {
          userStories: ['US-6.1', 'US-6.3'],
          hypotheses: ['H8', 'H11'],
          cacheKey: key,
          itemSize: size,
          compressed,
          responseTime,
          timestamp: Date.now(),
        });
      }

      return true;
    } catch (error) {
      const responseTime = performance.now() - startTime;

      this.errorHandlingService.processError(
        error as Error,
        'Failed to set cache item',
        ErrorCodes.SYSTEM.CACHE_OPERATION_FAILED,
        {
          component: 'AdvancedCacheSystem',
          operation: 'set',
          userStories: ['US-6.1', 'US-6.3'],
          hypotheses: ['H8', 'H11'],
          cacheKey: key,
          responseTime,
          timestamp: Date.now(),
        }
      );

      return false;
    }
  }

  /**
   * Get cache item with intelligent prefetching
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    this.requestCounts = {
      ...this.requestCounts,
      totalRequests: this.requestCounts.hits + this.requestCounts.misses + 1,
    };

    try {
      const item = this.cache.get(key);

      if (!item) {
        this.requestCounts.misses++;
        this.recordResponseTime(performance.now() - startTime);

        // Trigger intelligent prefetching
        if (this.config.enablePrefetching) {
          this.triggerIntelligentPrefetch(key);
        }

        return null;
      }

      // Check expiration
      if (this.isExpired(item)) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        this.requestCounts.misses++;
        this.recordResponseTime(performance.now() - startTime);
        return null;
      }

      // Update access tracking
      item.accessCount++;
      item.lastAccessed = Date.now();
      this.updateAccessOrder(key);
      this.requestCounts.hits++;

      // Decompress if needed
      let data = item.data;
      if (item.compressed) {
        const decompressed = this.decompress(data as string);
        data = JSON.parse(decompressed);
      }

      const responseTime = performance.now() - startTime;
      this.recordResponseTime(responseTime);

      // Analytics tracking
      if (this.config.enableAnalytics && this.analytics) {
        this.analytics.track('cache_item_retrieved', {
          userStories: ['US-6.1', 'US-6.3'],
          hypotheses: ['H8', 'H11'],
          cacheKey: key,
          hit: true,
          accessCount: item.accessCount,
          itemAge: Date.now() - item.timestamp,
          responseTime,
          timestamp: Date.now(),
        });
      }

      return data as T;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.requestCounts.misses++;

      this.errorHandlingService.processError(
        error as Error,
        'Failed to get cache item',
        ErrorCodes.SYSTEM.CACHE_OPERATION_FAILED,
        {
          component: 'AdvancedCacheSystem',
          operation: 'get',
          userStories: ['US-6.1', 'US-6.3'],
          hypotheses: ['H8', 'H11'],
          cacheKey: key,
          responseTime,
          timestamp: Date.now(),
        }
      );

      return null;
    }
  }

  /**
   * Intelligent prefetching based on access patterns
   */
  private async triggerIntelligentPrefetch(requestedKey: string): Promise<void> {
    if (this.prefetchQueue.has(requestedKey)) {
      return; // Already in prefetch queue
    }

    try {
      // Analyze access patterns to determine related keys
      const relatedKeys = this.analyzeAccessPatterns(requestedKey);

      for (const relatedKey of relatedKeys) {
        if (!this.cache.has(relatedKey) && !this.prefetchQueue.has(relatedKey)) {
          this.prefetchQueue.add(relatedKey);

          // Note: In real implementation, this would trigger actual data fetching
          // For now, we'll just track the prefetch attempt
          if (this.analytics) {
            this.analytics.track('prefetch_triggered', {
              userStories: ['US-6.1', 'US-6.3'],
              hypotheses: ['H8', 'H11'],
              requestedKey,
              relatedKey,
              timestamp: Date.now(),
            });
          }
        }
      }
    } catch (error) {
      // Prefetch failures shouldn't block main operations
      if (this.analytics) {
        this.analytics.track('prefetch_failed', {
          userStories: ['US-6.1', 'US-6.3'],
          hypotheses: ['H8', 'H11'],
          requestedKey,
          errorType: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Analyze access patterns for intelligent prefetching
   */
  private analyzeAccessPatterns(key: string): string[] {
    const relatedKeys: string[] = [];

    // Simple pattern analysis - look for keys with similar prefixes
    const keyPrefix = key.split(':')[0];

    for (const [cacheKey, item] of this.cache.entries()) {
      if (cacheKey.startsWith(keyPrefix) && cacheKey !== key) {
        // Prioritize frequently accessed items
        if (item.accessCount > 1) {
          relatedKeys.push(cacheKey);
        }
      }
    }

    // Return top 3 related keys
    return relatedKeys
      .sort((a, b) => {
        const itemA = this.cache.get(a);
        const itemB = this.cache.get(b);
        return (itemB?.accessCount || 0) - (itemA?.accessCount || 0);
      })
      .slice(0, 3);
  }

  /**
   * Ensure sufficient cache space using LRU eviction
   */
  private async ensureSpace(requiredSize: number): Promise<void> {
    const currentSize = this.getCurrentCacheSize();
    const currentCount = this.cache.size;

    if (currentSize + requiredSize <= this.config.maxSize && currentCount < this.config.maxItems) {
      return; // Sufficient space available
    }

    // Evict least recently used items until we have enough space
    while (
      (this.getCurrentCacheSize() + requiredSize > this.config.maxSize ||
        this.cache.size >= this.config.maxItems) &&
      this.accessOrder.length > 0
    ) {
      const lruKey = this.accessOrder.shift();
      if (lruKey && this.cache.has(lruKey)) {
        this.cache.delete(lruKey);
      }
    }

    // Analytics tracking for evictions
    if (this.config.enableAnalytics && this.analytics) {
      this.analytics.track('cache_eviction_performed', {
        userStories: ['US-6.1', 'US-6.3'],
        hypotheses: ['H8', 'H11'],
        evictionStrategy: 'LRU',
        requiredSize,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Check if cache item is expired
   */
  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * Calculate current cache size
   */
  private getCurrentCacheSize(): number {
    let totalSize = 0;
    for (const item of this.cache.values()) {
      totalSize += item.size;
    }
    return totalSize;
  }

  /**
   * Calculate serialized data size
   */
  private calculateSize(data: string): number {
    return new Blob([data]).size;
  }

  /**
   * Simple compression (base64 for demo)
   */
  private compress(data: string): string {
    return btoa(data);
  }

  /**
   * Simple decompression
   */
  private decompress(data: string): string {
    return atob(data);
  }

  /**
   * Record response time for metrics
   */
  private recordResponseTime(time: number): void {
    this.responseTimes.push(time);
    // Keep only last 1000 measurements
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  /**
   * Start background cleanup tasks
   */
  private startBackgroundCleanup(): void {
    // Cleanup expired items every minute
    setInterval(() => {
      this.cleanupExpiredItems();
    }, 60000);

    // Update metrics every 30 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 30000);
  }

  /**
   * Cleanup expired items
   */
  private cleanupExpiredItems(): void {
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    }

    if (this.analytics && expiredKeys.length > 0) {
      this.analytics.track('cache_cleanup_performed', {
        userStories: ['US-6.1', 'US-6.3'],
        hypotheses: ['H8', 'H11'],
        expiredItemsCount: expiredKeys.length,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(): void {
    const totalRequests = this.requestCounts.hits + this.requestCounts.misses;

    this.metrics = {
      hitRate: totalRequests > 0 ? this.requestCounts.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.requestCounts.misses / totalRequests : 0,
      memoryUsage: this.getCurrentCacheSize(),
      totalRequests,
      averageResponseTime:
        this.responseTimes.length > 0
          ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
          : 0,
      compressionRatio: this.calculateCompressionRatio(),
    };
  }

  /**
   * Calculate compression ratio
   */
  private calculateCompressionRatio(): number {
    let originalSize = 0;
    let compressedSize = 0;

    for (const item of this.cache.values()) {
      if (item.compressed) {
        compressedSize += item.size;
        // Estimate original size (simplified)
        originalSize += item.size * 1.5; // Assume 33% compression
      }
    }

    return originalSize > 0 ? compressedSize / originalSize : 1;
  }

  /**
   * Get current cache metrics
   */
  getMetrics(): CacheMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.prefetchQueue.clear();
    this.requestCounts = { hits: 0, misses: 0, totalRequests: 0 };
    this.responseTimes = [];
  }

  /**
   * Get cache statistics for monitoring
   */
  getStatistics(): Record<string, any> {
    return {
      cacheSize: this.cache.size,
      memoryUsage: this.getCurrentCacheSize(),
      accessOrderLength: this.accessOrder.length,
      prefetchQueueSize: this.prefetchQueue.size,
      metrics: this.getMetrics(),
      config: this.config,
    };
  }
}

/**
 * Hook for advanced cache management
 */
export function useAdvancedCache(config?: Partial<CacheConfig>) {
  const cacheSystem = React.useMemo(() => {
    return AdvancedCacheSystem.getInstance(config);
  }, [config]);

  const metrics = React.useMemo(() => {
    return cacheSystem.getMetrics();
  }, [cacheSystem]);

  return {
    cache: cacheSystem,
    metrics,
    statistics: cacheSystem.getStatistics(),
  };
}

// Export singleton instance
export const advancedCacheSystem = AdvancedCacheSystem.getInstance();

export default AdvancedCacheSystem;
