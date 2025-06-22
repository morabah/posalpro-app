/**
 * PosalPro MVP2 - API Response Optimizer
 * 🔧 PHASE 2: PERFORMANCE OPTIMIZATION & MONITORING
 *
 * Component Traceability Matrix Integration
 * User Stories: US-6.1 (Performance), US-6.3 (Data Efficiency)
 * Hypotheses: H8 (Load Time), H11 (Cache Hit Rate)
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-6.1', 'US-6.3', 'US-4.1'],
  acceptanceCriteria: [
    'AC-6.1.1', // API response time optimization
    'AC-6.1.3', // Cache performance
    'AC-6.3.1', // Data access efficiency
    'AC-4.1.6', // Performance tracking
  ],
  methods: [
    'optimizeResponse()',
    'cacheResponse()',
    'compressData()',
    'trackPerformance()',
    'validateCache()',
  ],
  hypotheses: ['H8', 'H11'],
  testCases: ['TC-H8-010', 'TC-H11-006'],
};

interface ApiOptimizationConfig {
  enableCompression: boolean;
  enableCaching: boolean;
  cacheMaxAge: number;
  compressionThreshold: number;
  performanceTracking: boolean;
  maxCacheSize: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
  originalSize: number;
}

interface ApiPerformanceMetrics {
  responseTime: number;
  cacheHitRate: number;
  compressionRatio: number;
  totalRequests: number;
  cachedRequests: number;
  averageResponseSize: number;
  optimizationScore: number;
  lastOptimized: number;
}

interface ResponseOptimizationResult {
  optimizedData: any;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  processingTime: number;
  cacheKey?: string;
  fromCache: boolean;
}

/**
 * Advanced API Response Optimizer with Performance Monitoring
 */
export class ApiResponseOptimizer {
  private static instance: ApiResponseOptimizer;
  private cache = new Map<string, CacheEntry>();
  private metrics: ApiPerformanceMetrics;
  private config: ApiOptimizationConfig;
  private errorHandlingService: ErrorHandlingService;

  private constructor(config: Partial<ApiOptimizationConfig> = {}) {
    this.config = {
      enableCompression: true,
      enableCaching: true,
      cacheMaxAge: 300000, // 5 minutes
      compressionThreshold: 1024, // 1KB
      performanceTracking: true,
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      ...config,
    };

    this.metrics = {
      responseTime: 0,
      cacheHitRate: 0,
      compressionRatio: 1,
      totalRequests: 0,
      cachedRequests: 0,
      averageResponseSize: 0,
      optimizationScore: 0,
      lastOptimized: Date.now(),
    };

    this.errorHandlingService = ErrorHandlingService.getInstance();
    this.initializeOptimizer();
  }

  public static getInstance(config?: Partial<ApiOptimizationConfig>): ApiResponseOptimizer {
    if (!ApiResponseOptimizer.instance) {
      ApiResponseOptimizer.instance = new ApiResponseOptimizer(config);
    }
    return ApiResponseOptimizer.instance;
  }

  /**
   * Initialize the optimizer with performance monitoring
   */
  private initializeOptimizer(): void {
    try {
      // Set up cache cleanup interval
      setInterval(() => {
        this.cleanupExpiredCache();
      }, 60000); // Every minute

      // Set up metrics calculation interval
      setInterval(() => {
        this.calculateOptimizationScore();
      }, 30000); // Every 30 seconds
    } catch (error) {
      this.errorHandlingService.processError(
        error as Error,
        'Failed to initialize API response optimizer',
        ErrorCodes.SYSTEM.INITIALIZATION,
        {
          component: 'ApiResponseOptimizer',
          operation: 'initializeOptimizer',
        }
      );
    }
  }

  /**
   * Optimize API response with caching, compression, and performance tracking
   */
  public async optimizeResponse<T = any>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      compress?: boolean;
      skipCache?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<ResponseOptimizationResult> {
    const startTime = Date.now();

    try {
      // Check cache first
      if (!options.skipCache && this.config.enableCaching) {
        const cachedResult = this.getCachedResponse(key);
        if (cachedResult) {
          this.updateMetrics(startTime, true, cachedResult.size);
          return {
            optimizedData: cachedResult.data,
            originalSize: cachedResult.originalSize,
            optimizedSize: cachedResult.size,
            compressionRatio: cachedResult.originalSize / cachedResult.size,
            processingTime: Date.now() - startTime,
            cacheKey: key,
            fromCache: true,
          };
        }
      }

      // Optimize the response
      const originalSize = this.calculateDataSize(data);
      let optimizedData = data;
      let optimizedSize = originalSize;
      let compressionRatio = 1;

      // Apply compression if enabled and data size exceeds threshold
      if (
        (options.compress ?? this.config.enableCompression) &&
        originalSize > this.config.compressionThreshold
      ) {
        const compressionResult = await this.compressData(data);
        optimizedData = compressionResult.compressedData;
        optimizedSize = compressionResult.compressedSize;
        compressionRatio = originalSize / optimizedSize;
      }

      // Cache the optimized response
      if (!options.skipCache && this.config.enableCaching) {
        this.cacheResponse(key, optimizedData, {
          ttl: options.ttl || this.config.cacheMaxAge,
          originalSize,
        });
      }

      // Update performance metrics
      this.updateMetrics(startTime, false, optimizedSize);

      return {
        optimizedData,
        originalSize,
        optimizedSize,
        compressionRatio,
        processingTime: Date.now() - startTime,
        cacheKey: key,
        fromCache: false,
      };
    } catch (error) {
      this.errorHandlingService.processError(
        error as Error,
        'Failed to optimize API response',
        ErrorCodes.API.REQUEST_FAILED,
        {
          component: 'ApiResponseOptimizer',
          operation: 'optimizeResponse',
          cacheKey: key,
        }
      );

      // Return original data as fallback
      return {
        optimizedData: data,
        originalSize: this.calculateDataSize(data),
        optimizedSize: this.calculateDataSize(data),
        compressionRatio: 1,
        processingTime: Date.now() - startTime,
        fromCache: false,
      };
    }
  }

  /**
   * Get cached response if available and not expired
   */
  private getCachedResponse(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry;
  }

  /**
   * Cache response with optimization metadata
   */
  private cacheResponse(
    key: string,
    data: any,
    options: {
      ttl: number;
      originalSize: number;
    }
  ): void {
    try {
      const size = this.calculateDataSize(data);

      // Check cache size limits
      if (this.getCurrentCacheSize() + size > this.config.maxCacheSize) {
        this.evictLeastRecentlyUsed();
      }

      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        ttl: options.ttl,
        size,
        accessCount: 1,
        lastAccessed: Date.now(),
        originalSize: options.originalSize,
      };

      this.cache.set(key, entry);
    } catch (error) {
      // Simplified error handling to avoid TypeScript issues
      console.error('Failed to cache response:', error);
    }
  }

  /**
   * Compress data using various algorithms
   */
  private async compressData(data: any): Promise<{
    compressedData: any;
    compressedSize: number;
    algorithm: string;
  }> {
    try {
      // For JSON data, we can apply various optimizations
      if (typeof data === 'object') {
        // Remove null/undefined values
        const cleaned = this.removeEmptyValues(data);

        // Optimize arrays and objects
        const optimized = this.optimizeDataStructure(cleaned);

        return {
          compressedData: optimized,
          compressedSize: this.calculateDataSize(optimized),
          algorithm: 'json-optimization',
        };
      }

      // For string data, apply text compression techniques
      if (typeof data === 'string') {
        const compressed = this.compressString(data);
        return {
          compressedData: compressed,
          compressedSize: this.calculateDataSize(compressed),
          algorithm: 'string-compression',
        };
      }

      // Return original data if no compression applied
      return {
        compressedData: data,
        compressedSize: this.calculateDataSize(data),
        algorithm: 'none',
      };
    } catch (error) {
      // Simplified error handling
      console.error('Failed to compress data:', error);
      return {
        compressedData: data,
        compressedSize: this.calculateDataSize(data),
        algorithm: 'fallback',
      };
    }
  }

  /**
   * Remove empty values from objects to reduce size
   */
  private removeEmptyValues(obj: any): any {
    if (Array.isArray(obj)) {
      return obj
        .map(item => this.removeEmptyValues(item))
        .filter(item => item !== null && item !== undefined && item !== '');
    }

    if (obj && typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined && value !== '') {
          cleaned[key] = this.removeEmptyValues(value);
        }
      }
      return cleaned;
    }

    return obj;
  }

  /**
   * Optimize data structure for better compression
   */
  private optimizeDataStructure(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.optimizeDataStructure(item));
    }

    if (data && typeof data === 'object') {
      const optimized: any = {};
      const sortedKeys = Object.keys(data).sort();

      for (const key of sortedKeys) {
        optimized[key] = this.optimizeDataStructure(data[key]);
      }

      return optimized;
    }

    return data;
  }

  /**
   * Simple string compression using repetition detection
   */
  private compressString(str: string): string {
    return str.replace(/(.)\1{2,}/g, (match, char) => {
      return `${char}${match.length}`;
    });
  }

  /**
   * Calculate the size of data in bytes
   */
  private calculateDataSize(data: any): number {
    try {
      if (typeof data === 'string') {
        return new Blob([data]).size;
      }

      const jsonString = JSON.stringify(data);
      return new Blob([jsonString]).size;
    } catch {
      return JSON.stringify(data || '').length;
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(startTime: number, fromCache: boolean, responseSize: number): void {
    const responseTime = Date.now() - startTime;

    this.metrics.totalRequests++;
    if (fromCache) {
      this.metrics.cachedRequests++;
    }

    // Calculate running averages
    this.metrics.responseTime = (this.metrics.responseTime + responseTime) / 2;
    this.metrics.averageResponseSize = (this.metrics.averageResponseSize + responseSize) / 2;
    this.metrics.cacheHitRate = this.metrics.cachedRequests / this.metrics.totalRequests;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  /**
   * Evict least recently used entries when cache is full
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get current cache size in bytes
   */
  private getCurrentCacheSize(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  /**
   * Calculate optimization score based on performance metrics
   */
  private calculateOptimizationScore(): void {
    const cacheScore = this.metrics.cacheHitRate * 40; // 40% weight
    const responseTimeScore = Math.max(0, 30 - this.metrics.responseTime / 10); // 30% weight
    const compressionScore = Math.min(30, this.metrics.compressionRatio * 10); // 30% weight

    this.metrics.optimizationScore = Math.round(cacheScore + responseTimeScore + compressionScore);
    this.metrics.lastOptimized = Date.now();
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): ApiPerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cache.clear();
    this.metrics.cachedRequests = 0;
    this.metrics.cacheHitRate = 0;
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    entries: number;
    hitRate: number;
    totalSize: number;
  } {
    return {
      size: this.cache.size,
      entries: this.cache.size,
      hitRate: this.metrics.cacheHitRate,
      totalSize: this.getCurrentCacheSize(),
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ApiOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Generate performance report
   */
  public generatePerformanceReport(): {
    metrics: ApiPerformanceMetrics;
    cacheStats: {
      size: number;
      entries: number;
      hitRate: number;
      totalSize: number;
    };
    recommendations: string[];
    componentMapping: typeof COMPONENT_MAPPING;
  } {
    const recommendations: string[] = [];

    if (this.metrics.cacheHitRate < 0.6) {
      recommendations.push('Consider increasing cache TTL or improving cache key strategies');
    }

    if (this.metrics.responseTime > 200) {
      recommendations.push(
        'API response times are high - consider optimizing queries or adding compression'
      );
    }

    if (this.metrics.compressionRatio < 1.2) {
      recommendations.push(
        'Low compression ratio - review data structures for optimization opportunities'
      );
    }

    return {
      metrics: this.getMetrics(),
      cacheStats: this.getCacheStats(),
      recommendations,
      componentMapping: COMPONENT_MAPPING,
    };
  }
}
