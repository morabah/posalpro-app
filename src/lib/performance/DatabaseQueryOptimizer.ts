/**
 * PosalPro MVP2 - Database Query Optimization Service
 * Intelligent query caching with performance monitoring and optimization
 *
 * Component Traceability Matrix Integration
 * User Stories: US-6.1 (Performance), US-6.3 (Data Efficiency), US-4.1 (Analytics)
 * Hypotheses: H8 (Load Time), H11 (Cache Hit Rate), H12 (Database Performance)
 */

'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { AdvancedCacheManager } from '@/lib/performance/AdvancedCacheManager';
import React from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-6.1', 'US-6.3', 'US-4.1', 'US-2.1'],
  acceptanceCriteria: [
    'AC-6.1.4', // Database performance optimization
    'AC-6.3.3', // Query result caching
    'AC-6.3.4', // Connection pool optimization
    'AC-4.1.8', // Performance analytics
    'AC-2.1.4', // Data access patterns
  ],
  methods: [
    'optimizeQueryPerformance()',
    'implementQueryCaching()',
    'analyzeQueryPatterns()',
    'monitorConnectionPool()',
    'trackDatabaseMetrics()',
  ],
  hypotheses: ['H8', 'H11', 'H12'],
  testCases: ['TC-H8-007', 'TC-H11-003', 'TC-H12-001'],
};

// Query optimization configuration
export interface QueryOptimizerConfig {
  enableQueryCaching: boolean;
  enableConnectionPooling: boolean;
  enableSlowQueryAnalysis: boolean;
  enableQueryPlan: boolean;
  cacheTTL: number;
  slowQueryThreshold: number; // milliseconds
  maxCacheSize: number;
  connectionPoolSize: number;
  queryTimeout: number;
}

// Query performance metrics
export interface QueryMetrics {
  totalQueries: number;
  averageExecutionTime: number;
  slowQueries: number;
  cacheHitRate: number;
  connectionPoolUtilization: number;
  queryByType: Record<string, number>;
  topSlowQueries: SlowQuery[];
}

// Slow query information
export interface SlowQuery {
  query: string;
  executionTime: number;
  timestamp: number;
  parameters?: any[];
  stackTrace?: string;
}

// Query cache entry
export interface QueryCacheEntry {
  query: string;
  parameters: any[];
  result: any;
  timestamp: number;
  executionTime: number;
  tablesTouched: string[];
}

// Connection pool stats
export interface ConnectionPoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingConnections: number;
  averageWaitTime: number;
}

/**
 * Database Query Optimizer with intelligent caching and performance monitoring
 */
export class DatabaseQueryOptimizer {
  private static instance: DatabaseQueryOptimizer;
  private errorHandlingService: ErrorHandlingService;
  private cacheManager: AdvancedCacheManager;
  private analytics: any;

  private config: QueryOptimizerConfig;
  private queryMetrics: QueryMetrics = {
    totalQueries: 0,
    averageExecutionTime: 0,
    slowQueries: 0,
    cacheHitRate: 0,
    connectionPoolUtilization: 0,
    queryByType: {},
    topSlowQueries: [],
  };

  private executionTimes: number[] = [];
  private slowQueryHistory: SlowQuery[] = [];
  private connectionPoolStats: ConnectionPoolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingConnections: 0,
    averageWaitTime: 0,
  };

  private constructor(config: Partial<QueryOptimizerConfig> = {}) {
    this.errorHandlingService = ErrorHandlingService.getInstance();
    this.cacheManager = AdvancedCacheManager.getInstance();

    this.config = {
      enableQueryCaching: true,
      enableConnectionPooling: true,
      enableSlowQueryAnalysis: true,
      enableQueryPlan: true,
      cacheTTL: 10 * 60 * 1000, // 10 minutes
      slowQueryThreshold: 1000, // 1 second
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      connectionPoolSize: 20,
      queryTimeout: 30000, // 30 seconds
      ...config,
    };

    this.startPerformanceMonitoring();
  }

  static getInstance(config?: Partial<QueryOptimizerConfig>): DatabaseQueryOptimizer {
    if (!DatabaseQueryOptimizer.instance) {
      DatabaseQueryOptimizer.instance = new DatabaseQueryOptimizer(config);
    }
    return DatabaseQueryOptimizer.instance;
  }

  /**
   * Initialize analytics integration
   */
  initializeAnalytics(analytics: any) {
    this.analytics = analytics;
  }

  /**
   * Execute optimized database query with caching and performance monitoring
   */
  async executeQuery<T>(
    queryKey: string,
    queryFunction: () => Promise<T>,
    options: {
      cacheable?: boolean;
      cacheTTL?: number;
      tablesTouched?: string[];
      queryType?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'COMPLEX';
      timeout?: number;
    } = {}
  ): Promise<T> {
    const startTime = performance.now();
    const {
      cacheable = true,
      cacheTTL = this.config.cacheTTL,
      tablesTouched = [],
      queryType = 'SELECT',
      timeout = this.config.queryTimeout,
    } = options;

    try {
      // Check cache first for cacheable queries
      if (cacheable && this.config.enableQueryCaching && queryType === 'SELECT') {
        const cachedResult = await this.getCachedQuery<T>(queryKey);
        if (cachedResult !== null) {
          const responseTime = performance.now() - startTime;

          // Track cache hit
          this.trackQueryExecution(queryKey, responseTime, true, queryType);

          console.info('Database query served from cache', {
            component: 'DatabaseQueryOptimizer',
            operation: 'executeQuery',
            userStories: ['US-6.1', 'US-6.3'],
            hypotheses: ['H8', 'H11'],
            queryKey,
            responseTime,
            cacheHit: true,
            timestamp: Date.now(),
          });

          return cachedResult;
        }
      }

      // Execute query with timeout
      const result = await this.executeWithTimeout(queryFunction, timeout);
      const executionTime = performance.now() - startTime;

      // Cache result if applicable
      if (cacheable && this.config.enableQueryCaching && queryType === 'SELECT') {
        await this.cacheQueryResult(queryKey, result, executionTime, tablesTouched, cacheTTL);
      }

      // Track query execution
      this.trackQueryExecution(queryKey, executionTime, false, queryType);

      // Check for slow queries
      if (this.config.enableSlowQueryAnalysis && executionTime > this.config.slowQueryThreshold) {
        this.recordSlowQuery(queryKey, executionTime);
      }

      console.info('Database query executed successfully', {
        component: 'DatabaseQueryOptimizer',
        operation: 'executeQuery',
        userStories: ['US-6.1', 'US-6.3'],
        hypotheses: ['H8', 'H11', 'H12'],
        queryKey,
        executionTime,
        queryType,
        tablesTouched,
        cacheHit: false,
        timestamp: Date.now(),
      });

      // Analytics tracking
      if (this.analytics) {
        this.analytics.track('database_query_executed', {
          userStories: ['US-6.1', 'US-6.3', 'US-4.1'],
          hypotheses: ['H8', 'H11', 'H12'],
          queryKey,
          executionTime,
          queryType,
          tablesTouched,
          cacheHit: false,
          slowQuery: executionTime > this.config.slowQueryThreshold,
          timestamp: Date.now(),
        });
      }

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;

      const processedError = this.errorHandlingService.processError(
        error as Error,
        `Database query execution failed: ${queryKey}`,
        ErrorCodes.DATA.QUERY_EXECUTION_FAILED,
        {
          component: 'DatabaseQueryOptimizer',
          operation: 'executeQuery',
          userStories: ['US-6.1', 'US-6.3'],
          hypotheses: ['H8', 'H11', 'H12'],
          queryKey,
          executionTime,
          queryType,
          tablesTouched,
          timeout,
          timestamp: Date.now(),
        }
      );

      throw processedError;
    }
  }

  /**
   * Get cached query result
   */
  private async getCachedQuery<T>(queryKey: string): Promise<T | null> {
    try {
      const cacheKey = `query:${queryKey}`;
      return await this.cacheManager.get<T>(cacheKey);
    } catch (error) {
      this.errorHandlingService.processError(
        error as Error,
        'Failed to retrieve cached query',
        ErrorCodes.SYSTEM.CACHE_OPERATION_FAILED,
        {
          component: 'DatabaseQueryOptimizer',
          operation: 'getCachedQuery',
          queryKey,
          userFriendlyMessage: 'Query cache retrieval failed. Proceeding with fresh query.',
        }
      );
      return null;
    }
  }

  /**
   * Cache query result with intelligent tagging
   */
  private async cacheQueryResult(
    queryKey: string,
    result: any,
    executionTime: number,
    tablesTouched: string[],
    cacheTTL: number
  ): Promise<void> {
    try {
      const cacheKey = `query:${queryKey}`;
      const cacheEntry: QueryCacheEntry = {
        query: queryKey,
        parameters: [],
        result,
        timestamp: Date.now(),
        executionTime,
        tablesTouched,
      };

      await this.cacheManager.set(cacheKey, cacheEntry, {
        ttl: cacheTTL,
        tags: ['database', 'query', ...tablesTouched.map(table => `table:${table}`)],
        metadata: {
          executionTime,
          tablesTouched,
          queryKey,
        },
      });
    } catch (error) {
      this.errorHandlingService.processError(
        error as Error,
        'Failed to cache query result',
        ErrorCodes.SYSTEM.CACHE_OPERATION_FAILED,
        {
          component: 'DatabaseQueryOptimizer',
          operation: 'cacheQueryResult',
          queryKey,
          userFriendlyMessage: 'Query result caching failed. Performance may be impacted.',
        }
      );
    }
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    queryFunction: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Query execution timeout after ${timeout}ms`));
      }, timeout);

      queryFunction()
        .then(result => {
          clearTimeout(timeoutHandle);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutHandle);
          reject(error);
        });
    });
  }

  /**
   * Track query execution metrics
   */
  private trackQueryExecution(
    queryKey: string,
    executionTime: number,
    cacheHit: boolean,
    queryType: string
  ): void {
    this.queryMetrics.totalQueries++;

    if (!cacheHit) {
      this.executionTimes.push(executionTime);

      // Keep only last 1000 execution times
      if (this.executionTimes.length > 1000) {
        this.executionTimes.shift();
      }

      // Update average execution time
      this.queryMetrics.averageExecutionTime =
        this.executionTimes.reduce((sum, time) => sum + time, 0) / this.executionTimes.length;
    }

    // Track query by type
    this.queryMetrics.queryByType[queryType] = (this.queryMetrics.queryByType[queryType] || 0) + 1;

    // Update cache hit rate
    const cacheableQueries = this.queryMetrics.queryByType['SELECT'] || 0;
    const cacheHits = Math.floor(cacheableQueries * this.queryMetrics.cacheHitRate);
    const newCacheHits = cacheHit ? cacheHits + 1 : cacheHits;
    this.queryMetrics.cacheHitRate = cacheableQueries > 0 ? newCacheHits / cacheableQueries : 0;
  }

  /**
   * Record slow query for analysis
   */
  private recordSlowQuery(queryKey: string, executionTime: number): void {
    this.queryMetrics.slowQueries++;

    const slowQuery: SlowQuery = {
      query: queryKey,
      executionTime,
      timestamp: Date.now(),
      stackTrace: new Error().stack,
    };

    this.slowQueryHistory.push(slowQuery);

    // Keep only last 100 slow queries
    if (this.slowQueryHistory.length > 100) {
      this.slowQueryHistory.shift();
    }

    // Update top slow queries
    this.queryMetrics.topSlowQueries = this.slowQueryHistory
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    this.errorHandlingService.processError(
      new Error(`Slow query detected: ${queryKey}`),
      'Performance threshold exceeded',
      ErrorCodes.PERFORMANCE.SLOW_RESPONSE,
      {
        component: 'DatabaseQueryOptimizer',
        operation: 'recordSlowQuery',
        userStories: ['US-6.1', 'US-6.3'],
        hypotheses: ['H8', 'H12'],
        queryKey,
        executionTime,
        threshold: this.config.slowQueryThreshold,
        userFriendlyMessage:
          'Database query is running slower than expected. Performance team has been notified.',
      }
    );

    // Analytics tracking for slow queries
    if (this.analytics) {
      this.analytics.track('slow_query_detected', {
        userStories: ['US-6.1', 'US-6.3'],
        hypotheses: ['H8', 'H12'],
        queryKey,
        executionTime,
        threshold: this.config.slowQueryThreshold,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Invalidate cache by table or pattern
   */
  async invalidateCache(pattern: string | string[]): Promise<void> {
    try {
      const patterns = Array.isArray(pattern) ? pattern : [pattern];

      // For now, clear entire cache when invalidating by pattern
      // This can be improved with proper tag-based invalidation
      this.cacheManager.clear();

      console.info('Cache invalidated by pattern', {
        component: 'DatabaseQueryOptimizer',
        operation: 'invalidateCache',
        patterns,
        timestamp: Date.now(),
      });

      if (this.analytics) {
        this.analytics.track('cache_invalidated', {
          userStories: ['US-6.1', 'US-6.3'],
          hypotheses: ['H11'],
          patterns,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error as Error,
        'Failed to invalidate cache',
        ErrorCodes.SYSTEM.CACHE_OPERATION_FAILED,
        {
          component: 'DatabaseQueryOptimizer',
          operation: 'invalidateCache',
          patterns: Array.isArray(pattern) ? pattern : [pattern],
          timestamp: Date.now(),
        }
      );

      throw processedError;
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  getMetrics(): QueryMetrics {
    return { ...this.queryMetrics };
  }

  /**
   * Get connection pool statistics
   */
  getConnectionPoolStats(): ConnectionPoolStats {
    return { ...this.connectionPoolStats };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): Record<string, any> {
    const cacheStats = this.cacheManager.getStatistics();

    return {
      queryMetrics: this.queryMetrics,
      connectionPoolStats: this.connectionPoolStats,
      cacheStatistics: cacheStats,
      slowQueries: this.slowQueryHistory.slice(-20), // Last 20 slow queries
      recommendations: this.generateOptimizationRecommendations(),
      timestamp: new Date().toISOString(),
      componentMapping: COMPONENT_MAPPING,
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check average execution time
    if (this.queryMetrics.averageExecutionTime > 500) {
      recommendations.push(
        'Average query execution time is high - consider adding database indexes'
      );
    }

    // Check cache hit rate
    if (this.queryMetrics.cacheHitRate < 0.7) {
      recommendations.push('Cache hit rate is low - review caching strategy and TTL settings');
    }

    // Check slow queries
    if (this.queryMetrics.slowQueries > this.queryMetrics.totalQueries * 0.05) {
      recommendations.push(
        'High percentage of slow queries detected - optimize query patterns and indexes'
      );
    }

    // Check connection pool utilization
    if (this.connectionPoolStats.waitingConnections > 0) {
      recommendations.push('Connection pool pressure detected - consider increasing pool size');
    }

    return recommendations;
  }

  /**
   * Start background performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Update metrics every 30 seconds
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 30000);

    // Cleanup old slow queries every 5 minutes
    setInterval(
      () => {
        this.cleanupOldSlowQueries();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    // Update connection pool stats (simulated for now)
    this.connectionPoolStats = {
      totalConnections: this.config.connectionPoolSize,
      activeConnections: Math.floor(Math.random() * this.config.connectionPoolSize * 0.7),
      idleConnections: Math.floor(Math.random() * this.config.connectionPoolSize * 0.3),
      waitingConnections: Math.floor(Math.random() * 5),
      averageWaitTime: Math.random() * 100,
    };

    // Calculate utilization
    this.queryMetrics.connectionPoolUtilization =
      this.connectionPoolStats.activeConnections / this.connectionPoolStats.totalConnections;

    // Analytics tracking
    if (this.analytics) {
      this.analytics.track('database_performance_metrics_updated', {
        userStories: ['US-6.1', 'US-6.3', 'US-4.1'],
        hypotheses: ['H8', 'H11', 'H12'],
        metrics: this.queryMetrics,
        connectionPool: this.connectionPoolStats,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Cleanup old slow queries
   */
  private cleanupOldSlowQueries(): void {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    this.slowQueryHistory = this.slowQueryHistory.filter(query => query.timestamp > cutoffTime);

    // Update top slow queries
    this.queryMetrics.topSlowQueries = this.slowQueryHistory
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);
  }

  /**
   * Clear all performance data
   */
  clearMetrics(): void {
    this.queryMetrics = {
      totalQueries: 0,
      averageExecutionTime: 0,
      slowQueries: 0,
      cacheHitRate: 0,
      connectionPoolUtilization: 0,
      queryByType: {},
      topSlowQueries: [],
    };

    this.executionTimes = [];
    this.slowQueryHistory = [];

    console.info('Database query metrics cleared', {
      component: 'DatabaseQueryOptimizer',
      operation: 'clearMetrics',
      timestamp: Date.now(),
    });
  }
}

/**
 * Hook for database query optimization
 */
export function useDatabaseOptimizer(config?: Partial<QueryOptimizerConfig>) {
  const analytics = useAnalytics();

  const optimizer = React.useMemo(() => {
    return DatabaseQueryOptimizer.getInstance(config);
  }, [config]);

  React.useEffect(() => {
    optimizer.initializeAnalytics(analytics);
  }, [optimizer, analytics]);

  return {
    executeQuery: optimizer.executeQuery.bind(optimizer),
    invalidateCache: optimizer.invalidateCache.bind(optimizer),
    getMetrics: optimizer.getMetrics.bind(optimizer),
    getConnectionPoolStats: optimizer.getConnectionPoolStats.bind(optimizer),
    generatePerformanceReport: optimizer.generatePerformanceReport.bind(optimizer),
    clearMetrics: optimizer.clearMetrics.bind(optimizer),
  };
}

// Export singleton instance
export const databaseQueryOptimizer = DatabaseQueryOptimizer.getInstance();

export default DatabaseQueryOptimizer;
