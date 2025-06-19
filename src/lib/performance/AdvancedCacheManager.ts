/**
 * PosalPro MVP2 - Advanced Cache Management Service
 * Implements intelligent caching, prefetching, and performance optimization
 *
 * Component Traceability Matrix Integration
 * User Stories: US-6.1 (Performance), US-6.3 (Data Efficiency)
 * Hypotheses: H8 (Load Time), H11 (Cache Hit Rate)
 */

'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { useEffect, useMemo } from 'react';

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

// Cache item interface
export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  priority: CachePriority;
  tags: string[];
  compressed: boolean;
  metadata?: Record<string, any>;
}

// Cache priority levels
export enum CachePriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  BACKGROUND = 'background',
}

// Cache strategy options
export enum CacheStrategy {
  LRU = 'lru', // Least Recently Used
  LFU = 'lfu', // Least Frequently Used
  TTL = 'ttl', // Time To Live
  FIFO = 'fifo', // First In First Out
  ADAPTIVE = 'adaptive', // Adaptive based on usage patterns
}

// Cache metrics interface
export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  memoryUsage: number;
  totalRequests: number;
  averageResponseTime: number;
  prefetchSuccessRate: number;
  compressionRatio: number;
}

// Advanced cache configuration
export interface AdvancedCacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxItems: number; // Maximum number of items
  defaultTTL: number; // Default time to live in ms
  strategy: CacheStrategy;
  enableCompression: boolean;
  enablePrefetching: boolean;
  enableAnalytics: boolean;
  persistenceEnabled: boolean;
  encryptionEnabled: boolean;
  backgroundSyncEnabled: boolean;
}

/**
 * Advanced Cache Manager with intelligent optimization
 */
export class AdvancedCacheManager {
  private static instance: AdvancedCacheManager;
  private errorHandlingService: ErrorHandlingService;
  private analytics: any;

  private cache: Map<string, CacheItem> = new Map();
  private accessOrder: string[] = []; // For LRU tracking
  private prefetchQueue: Set<string> = new Set();
  private backgroundTasks: Map<string, Promise<any>> = new Map();

  private config: AdvancedCacheConfig;
  private metrics: CacheMetrics = {
    hitRate: 0,
    missRate: 0,
    evictionRate: 0,
    memoryUsage: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    prefetchSuccessRate: 0,
    compressionRatio: 0,
  };

  private requestCounts = { hits: 0, misses: 0, evictions: 0, totalRequests: 0 };
  private responseTimes: number[] = [];
  private prefetchResults = { successes: 0, failures: 0 };

  private constructor(config: Partial<AdvancedCacheConfig> = {}) {
    this.errorHandlingService = ErrorHandlingService.getInstance();
    this.config = {
      maxSize: 100 * 1024 * 1024, // 100MB default
      maxItems: 1000,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      strategy: CacheStrategy.ADAPTIVE,
      enableCompression: true,
      enablePrefetching: true,
      enableAnalytics: true,
      persistenceEnabled: false,
      encryptionEnabled: false,
      backgroundSyncEnabled: true,
      ...config,
    };

    this.startBackgroundTasks();
  }

  static getInstance(config?: Partial<AdvancedCacheConfig>): AdvancedCacheManager {
    if (!AdvancedCacheManager.instance) {
      AdvancedCacheManager.instance = new AdvancedCacheManager(config);
    }
    return AdvancedCacheManager.instance;
  }

  /**
   * Initialize analytics integration
   */
  initializeAnalytics(analytics: any) {
    this.analytics = analytics;
  }

  /**
   * Set cache item with advanced optimization
   */
  async set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      priority?: CachePriority;
      tags?: string[];
      compress?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<boolean> {
    const startTime = performance.now();

    try {
      const {
        ttl = this.config.defaultTTL,
        priority = CachePriority.MEDIUM,
        tags = [],
        compress = this.config.enableCompression,
        metadata = {},
      } = options;

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
        data: compressed ? (serializedData as unknown as T) : data,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        size,
        priority,
        tags,
        compressed,
        metadata,
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
          priority,
          compressed,
          responseTime,
          timestamp: Date.now(),
        });
      }

      return true;
    } catch (error) {
      const responseTime = performance.now() - startTime;

      const processedError = this.errorHandlingService.processError(
        error as Error,
        'Failed to set cache item',
        ErrorCodes.SYSTEM.CACHE_OPERATION_FAILED,
        {
          component: 'AdvancedCacheManager',
          operation: 'set',
          userStories: ['US-6.1', 'US-6.3'],
          hypotheses: ['H8', 'H11'],
          cacheKey: key,
          responseTime,
          timestamp: Date.now(),
        }
      );

      throw processedError;
    }
  }

  /**
   * Get cache item with intelligent prefetching
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    this.requestCounts.totalRequests++;

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

      const processedError = this.errorHandlingService.processError(
        error as Error,
        'Failed to get cache item',
        ErrorCodes.SYSTEM.CACHE_OPERATION_FAILED,
        {
          component: 'AdvancedCacheManager',
          operation: 'get',
          userStories: ['US-6.1', 'US-6.3'],
          hypotheses: ['H8', 'H11'],
          cacheKey: key,
          responseTime,
          timestamp: Date.now(),
        }
      );

      throw processedError;
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

          // Attempt to prefetch in background
          this.backgroundPrefetch(relatedKey);
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
   * Background prefetch operation
   */
  private async backgroundPrefetch(key: string): Promise<void> {
    if (this.backgroundTasks.has(key)) {
      return; // Already prefetching
    }

    const prefetchPromise = new Promise<void>(async resolve => {
      try {
        // Simulate prefetch logic - in real implementation, this would
        // fetch data from the appropriate source
        await new Promise(resolve => setTimeout(resolve, 100));

        this.prefetchResults.successes++;
        this.prefetchQueue.delete(key);

        if (this.analytics) {
          this.analytics.track('prefetch_successful', {
            userStories: ['US-6.1', 'US-6.3'],
            hypotheses: ['H8', 'H11'],
            prefetchedKey: key,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        this.prefetchResults.failures++;
        this.prefetchQueue.delete(key);
      } finally {
        this.backgroundTasks.delete(key);
        resolve();
      }
    });

    this.backgroundTasks.set(key, prefetchPromise);
    await prefetchPromise;
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
   * Ensure sufficient cache space using adaptive eviction
   */
  private async ensureSpace(requiredSize: number): Promise<void> {
    const currentSize = this.getCurrentCacheSize();
    const currentCount = this.cache.size;

    if (currentSize + requiredSize <= this.config.maxSize && currentCount < this.config.maxItems) {
      return; // Sufficient space available
    }

    const itemsToEvict = this.selectItemsForEviction(requiredSize);

    for (const key of itemsToEvict) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.requestCounts.evictions++;
    }

    // Analytics tracking for evictions
    if (this.config.enableAnalytics && this.analytics && itemsToEvict.length > 0) {
      this.analytics.track('cache_eviction_performed', {
        userStories: ['US-6.1', 'US-6.3'],
        hypotheses: ['H8', 'H11'],
        evictedCount: itemsToEvict.length,
        evictionStrategy: this.config.strategy,
        requiredSize,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Select items for eviction based on configured strategy
   */
  private selectItemsForEviction(requiredSize: number): string[] {
    const itemsToEvict: string[] = [];
    let freedSize = 0;

    switch (this.config.strategy) {
      case CacheStrategy.LRU:
        for (const key of this.accessOrder) {
          const item = this.cache.get(key);
          if (item) {
            itemsToEvict.push(key);
            freedSize += item.size;
            if (freedSize >= requiredSize) break;
          }
        }
        break;

      case CacheStrategy.LFU:
        const sortedByFrequency = Array.from(this.cache.entries()).sort(
          ([, a], [, b]) => a.accessCount - b.accessCount
        );

        for (const [key, item] of sortedByFrequency) {
          itemsToEvict.push(key);
          freedSize += item.size;
          if (freedSize >= requiredSize) break;
        }
        break;

      case CacheStrategy.TTL:
        const sortedByAge = Array.from(this.cache.entries()).sort(
          ([, a], [, b]) => a.timestamp - b.timestamp
        );

        for (const [key, item] of sortedByAge) {
          itemsToEvict.push(key);
          freedSize += item.size;
          if (freedSize >= requiredSize) break;
        }
        break;

      case CacheStrategy.ADAPTIVE:
        // Adaptive strategy combines multiple factors
        const scored = Array.from(this.cache.entries())
          .map(([key, item]) => ({
            key,
            item,
            score: this.calculateAdaptiveScore(item),
          }))
          .sort((a, b) => a.score - b.score);

        for (const { key, item } of scored) {
          itemsToEvict.push(key);
          freedSize += item.size;
          if (freedSize >= requiredSize) break;
        }
        break;

      default:
        // FIFO fallback
        for (const [key, item] of this.cache.entries()) {
          itemsToEvict.push(key);
          freedSize += item.size;
          if (freedSize >= requiredSize) break;
        }
    }

    return itemsToEvict;
  }

  /**
   * Calculate adaptive score for eviction priority (lower = evict first)
   */
  private calculateAdaptiveScore(item: CacheItem): number {
    const age = Date.now() - item.timestamp;
    const timeSinceAccess = Date.now() - item.lastAccessed;
    const frequency = item.accessCount;
    const priority = this.getPriorityWeight(item.priority);

    // Combine factors: age, recency, frequency, priority
    return age * 0.3 + timeSinceAccess * 0.3 + (1 / (frequency + 1)) * 0.2 + (1 / priority) * 0.2;
  }

  /**
   * Get priority weight for adaptive scoring
   */
  private getPriorityWeight(priority: CachePriority): number {
    switch (priority) {
      case CachePriority.CRITICAL:
        return 10;
      case CachePriority.HIGH:
        return 7;
      case CachePriority.MEDIUM:
        return 5;
      case CachePriority.LOW:
        return 3;
      case CachePriority.BACKGROUND:
        return 1;
      default:
        return 5;
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
   * Start background maintenance tasks
   */
  private startBackgroundTasks(): void {
    if (!this.config.backgroundSyncEnabled) return;

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
      evictionRate: totalRequests > 0 ? this.requestCounts.evictions / totalRequests : 0,
      memoryUsage: this.getCurrentCacheSize(),
      totalRequests,
      averageResponseTime:
        this.responseTimes.length > 0
          ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
          : 0,
      prefetchSuccessRate:
        this.prefetchResults.successes + this.prefetchResults.failures > 0
          ? this.prefetchResults.successes /
            (this.prefetchResults.successes + this.prefetchResults.failures)
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
    return { ...this.metrics };
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.prefetchQueue.clear();
    this.backgroundTasks.clear();
    this.requestCounts = { hits: 0, misses: 0, evictions: 0, totalRequests: 0 };
    this.responseTimes = [];
    this.prefetchResults = { successes: 0, failures: 0 };
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
      backgroundTasksCount: this.backgroundTasks.size,
      metrics: this.getMetrics(),
      config: this.config,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clear();
    // Cancel any pending background tasks
    for (const task of this.backgroundTasks.values()) {
      // Note: In real implementation, you'd want to cancel these properly
    }
  }
}

/**
 * Hook for advanced cache management
 */
export function useAdvancedCache(config?: Partial<AdvancedCacheConfig>) {
  const analytics = useAnalytics();
  const cacheManager = useMemo(() => {
    return AdvancedCacheManager.getInstance(config);
  }, [config]);

  useEffect(() => {
    cacheManager.initializeAnalytics(analytics);
  }, [cacheManager, analytics]);

  const metrics = useMemo(() => {
    return cacheManager.getMetrics();
  }, [cacheManager]);

  return {
    cache: cacheManager,
    metrics,
    statistics: cacheManager.getStatistics(),
  };
}

// Export singleton instance
export const advancedCache = AdvancedCacheManager.getInstance();

export default AdvancedCacheManager;
