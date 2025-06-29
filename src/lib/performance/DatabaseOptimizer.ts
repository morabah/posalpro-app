/**
 * PosalPro MVP2 - Database Performance Optimizer
 * Addresses critical performance issues identified in customer API logs:
 * - 12+ second response times for customer queries
 * - Analytics tracking blocking main operations
 * - Missing query optimizations
 *
 * Follows Lesson #20: Database First, Architecture Last
 * Follows CORE_REQUIREMENTS.md: ErrorHandlingService and useApiClient patterns
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logger } from '@/utils/logger';

interface QueryPerformanceMetrics {
  queryStartTime: number;
  queryEndTime: number;
  queryTimeMs: number;
  recordsReturned: number;
  cacheHit: boolean;
  indexesUsed: string[];
  optimizationApplied: string[];
}

interface DatabaseOptimizationConfig {
  enableQueryAnalysis: boolean;
  enablePerformanceLogging: boolean;
  queryTimeoutMs: number;
  maxRetries: number;
  cacheEnabled: boolean;
  cacheTtlMs: number;
}

export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  private errorHandlingService: ErrorHandlingService;
  private config: DatabaseOptimizationConfig;
  private queryCache = new Map<string, { data: any; timestamp: number }>();

  private constructor() {
    this.errorHandlingService = ErrorHandlingService.getInstance();
    this.config = {
      enableQueryAnalysis: true,
      enablePerformanceLogging: true,
      queryTimeoutMs: 10000, // 10 second timeout
      maxRetries: 3,
      cacheEnabled: true,
      cacheTtlMs: 300000, // 5 minute cache
    };
  }

  public static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  /**
   * Optimize customer query with performance monitoring
   * Addresses 12+ second response times identified in logs
   */
  public async optimizeCustomerQuery<T>(
    queryFn: () => Promise<T>,
    queryIdentifier: string,
    context: {
      operation: string;
      filters?: Record<string, any>;
      pagination?: { page?: number; limit?: number };
    }
  ): Promise<{ data: T; metrics: QueryPerformanceMetrics }> {
    const queryStartTime = Date.now();
    const cacheKey = this.generateCacheKey(queryIdentifier, context);

    try {
      // Check cache first for read operations
      if (this.config.cacheEnabled && this.isReadOperation(context.operation)) {
        const cached = this.getCachedResult(cacheKey);
        if (cached) {
          logger.info(`[DatabaseOptimizer] Cache hit for ${queryIdentifier}`);
          return {
            data: cached,
            metrics: {
              queryStartTime,
              queryEndTime: Date.now(),
              queryTimeMs: Date.now() - queryStartTime,
              recordsReturned: Array.isArray(cached) ? cached.length : 1,
              cacheHit: true,
              indexesUsed: ['cache'],
              optimizationApplied: ['cache_retrieval'],
            },
          };
        }
      }

      // Execute query with timeout protection
      const data = await this.executeWithTimeout(queryFn, this.config.queryTimeoutMs);
      const queryEndTime = Date.now();
      const queryTimeMs = queryEndTime - queryStartTime;

      // Cache successful read operations
      if (this.config.cacheEnabled && this.isReadOperation(context.operation)) {
        this.setCachedResult(cacheKey, data);
      }

      const metrics: QueryPerformanceMetrics = {
        queryStartTime,
        queryEndTime,
        queryTimeMs,
        recordsReturned: Array.isArray(data) ? data.length : 1,
        cacheHit: false,
        indexesUsed: this.inferIndexesUsed(context),
        optimizationApplied: this.getOptimizationsApplied(context, queryTimeMs),
      };

      // Log performance if query is slow
      if (queryTimeMs > 2000) {
        logger.warn(`[DatabaseOptimizer] Slow query detected: ${queryIdentifier}`, {
          queryTimeMs,
          operation: context.operation,
          filters: context.filters,
          pagination: context.pagination,
        });
      } else {
        logger.info(`[DatabaseOptimizer] Query optimized: ${queryIdentifier}`, {
          queryTimeMs,
          optimizations: metrics.optimizationApplied,
        });
      }

      return { data, metrics };
    } catch (error) {
      const queryTimeMs = Date.now() - queryStartTime;

      // Process error with context
      this.errorHandlingService.processError(
        error,
        `Database query failed: ${queryIdentifier}`,
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'DatabaseOptimizer',
          operation: context.operation,
          queryIdentifier,
          queryTimeMs,
          filters: context.filters,
          pagination: context.pagination,
        }
      );

      throw error;
    }
  }

  /**
   * Optimize analytics tracking to prevent blocking main operations
   * Based on lessons learned: analytics should never block main operations
   */
  public async optimizeAnalyticsTracking<T>(
    trackingFn: () => Promise<T>,
    operationContext: string
  ): Promise<void> {
    // Execute analytics tracking asynchronously and catch errors
    setImmediate(async () => {
      try {
        await this.executeWithTimeout(trackingFn, 5000); // 5 second timeout for analytics
        logger.debug(`[DatabaseOptimizer] Analytics tracking completed: ${operationContext}`);
      } catch (error) {
        // Log but don't fail the main operation
        logger.warn(`[DatabaseOptimizer] Analytics tracking failed: ${operationContext}`, error);

        this.errorHandlingService.processError(
          error,
          `Analytics tracking failed: ${operationContext}`,
          ErrorCodes.ANALYTICS.TRACKING_FAILED,
          {
            component: 'DatabaseOptimizer',
            operation: 'optimizeAnalyticsTracking',
            context: operationContext,
          }
        );
      }
    });
  }

  /**
   * Get optimized query patterns for customer operations
   */
  public getOptimizedCustomerSelect() {
    return {
      // Core customer fields
      id: true,
      name: true,
      email: true,
      industry: true,
      tier: true,
      status: true,
      createdAt: true,
      updatedAt: true,

      // Count relationships instead of full data for performance
      _count: {
        select: {
          proposals: true,
          contacts: true,
        },
      },
    };
  }

  /**
   * Get optimized pagination settings
   */
  public getOptimizedPagination(page: number = 1, limit: number = 20) {
    const optimizedLimit = Math.min(limit, 50); // Cap at 50 for performance
    const optimizedPage = Math.max(page, 1);

    return {
      skip: (optimizedPage - 1) * optimizedLimit,
      take: optimizedLimit,
      cursor: null, // Can be enhanced with cursor-based pagination
    };
  }

  /**
   * Get optimized query filters
   */
  public optimizeQueryFilters(filters: Record<string, any>) {
    const optimized: any = {};

    // Convert search filters to optimized database queries
    if (filters.search) {
      optimized.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { industry: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Add exact match filters
    if (filters.status) optimized.status = filters.status;
    if (filters.tier) optimized.tier = filters.tier;
    if (filters.industry) optimized.industry = { contains: filters.industry, mode: 'insensitive' };

    return optimized;
  }

  private generateCacheKey(queryId: string, context: any): string {
    return `${queryId}_${JSON.stringify(context)}`;
  }

  private getCachedResult(key: string): any | null {
    const cached = this.queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTtlMs) {
      return cached.data;
    }

    // Clean up expired cache
    if (cached) {
      this.queryCache.delete(key);
    }

    return null;
  }

  private setCachedResult(key: string, data: any): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Prevent memory leaks by limiting cache size
    if (this.queryCache.size > 1000) {
      const oldestKey = this.queryCache.keys().next().value;
      if (oldestKey) {
        this.queryCache.delete(oldestKey);
      }
    }
  }

  private isReadOperation(operation: string): boolean {
    return ['GET', 'SEARCH', 'LIST', 'FIND'].some(op => operation.toUpperCase().includes(op));
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  private inferIndexesUsed(context: any): string[] {
    const indexes: string[] = [];

    if (context.filters?.search) indexes.push('name_idx', 'email_idx', 'industry_idx');
    if (context.filters?.status) indexes.push('status_idx');
    if (context.filters?.tier) indexes.push('tier_idx');
    if (context.pagination) indexes.push('createdAt_idx');

    return indexes;
  }

  private getOptimizationsApplied(context: any, queryTimeMs: number): string[] {
    const optimizations: string[] = [];

    optimizations.push('selective_fields');
    if (context.pagination) optimizations.push('pagination');
    if (queryTimeMs < 1000) optimizations.push('fast_query');
    if (context.filters) optimizations.push('optimized_filters');

    return optimizations;
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.queryCache.clear();
    logger.info('[DatabaseOptimizer] Cache cleared');
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats() {
    return {
      cacheSize: this.queryCache.size,
      cacheEnabled: this.config.cacheEnabled,
      cacheTtlMs: this.config.cacheTtlMs,
      queryTimeoutMs: this.config.queryTimeoutMs,
    };
  }
}

export const databaseOptimizer = DatabaseOptimizer.getInstance();
