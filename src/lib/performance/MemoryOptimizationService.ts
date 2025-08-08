/**
 * PosalPro MVP2 - Memory Optimization Service
 * Comprehensive memory management with database query optimization
 * Component Traceability: US-6.1, US-6.2, H8, H9
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import { logError } from '@/lib/logger';

interface MemoryMetrics {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
  timestamp: number;
}

interface QueryOptimizationMetrics {
  queryCount: number;
  averageQueryTime: number;
  slowQueries: Array<{
    query: string;
    duration: number;
    timestamp: number;
  }>;
  memoryImpact: number;
}

interface MemoryOptimizationConfig {
  maxMemoryUsage: number; // 100MB in bytes
  maxQueryTime: number; // 1000ms
  gcThreshold: number; // 80% of max memory
  optimizationInterval: number; // 30 seconds
}

/**
 * Component Traceability Matrix:
 * - User Stories: US-6.1 (Performance Monitoring), US-6.2 (Memory Optimization)
 * - Acceptance Criteria: AC-6.1.1, AC-6.1.2, AC-6.2.1, AC-6.2.2
 * - Hypotheses: H8 (Memory Efficiency), H9 (Query Optimization)
 * - Methods: optimizeMemory(), detectLeaks(), optimizeQueries()
 * - Test Cases: TC-H8-001, TC-H9-001
 */

class MemoryOptimizationService {
  private static instance: MemoryOptimizationService;
  private isInitialized = false;
  private optimizationInterval: NodeJS.Timeout | null = null;
  private memoryHistory: MemoryMetrics[] = [];
  private queryMetrics: QueryOptimizationMetrics = {
    queryCount: 0,
    averageQueryTime: 0,
    slowQueries: [],
    memoryImpact: 0,
  };

  private config: MemoryOptimizationConfig = {
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    maxQueryTime: 1000, // 1 second
    gcThreshold: 0.8, // 80%
    optimizationInterval: 30000, // 30 seconds
  };

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): MemoryOptimizationService {
    if (!MemoryOptimizationService.instance) {
      MemoryOptimizationService.instance = new MemoryOptimizationService();
    }
    return MemoryOptimizationService.instance;
  }

  /**
   * Initialize memory optimization service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[MemoryOptimizationService] Initializing memory optimization...');

      // Start memory monitoring
      this.startMemoryMonitoring();

      // Start query optimization
      this.startQueryOptimization();

      this.isInitialized = true;
      console.log('[MemoryOptimizationService] Memory optimization initialized successfully');
    } catch (error) {
      console.error('[MemoryOptimizationService] Initialization failed:', error);
      throw new StandardError({
        message: 'Failed to initialize memory optimization service',
        code: ErrorCodes.SYSTEM.INITIALIZATION_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'MemoryOptimizationService',
          operation: 'initialize',
        },
      });
    }
  }

  /**
   * Get current memory metrics (browser-compatible)
   */
  public getMemoryMetrics(): MemoryMetrics {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Use browser Performance Memory API if available
      const memory = (performance as any).memory;
      if (memory) {
        return {
          rss: 0, // Not available in browser
          heapTotal: memory.totalJSHeapSize || 0,
          heapUsed: memory.usedJSHeapSize || 0,
          external: 0, // Not available in browser
          arrayBuffers: 0, // Not available in browser
          timestamp: Date.now(),
        };
      } else {
        // Fallback for browsers without memory API
        return {
          rss: 0,
          heapTotal: 0,
          heapUsed: 0,
          external: 0,
          arrayBuffers: 0,
          timestamp: Date.now(),
        };
      }
    } else {
      // Server-side Node.js environment
      const usage = process.memoryUsage();
      return {
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external,
        arrayBuffers: usage.arrayBuffers,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Check if memory usage is within acceptable limits
   */
  public isMemoryUsageAcceptable(): boolean {
    const metrics = this.getMemoryMetrics();
    return metrics.heapUsed < this.config.maxMemoryUsage;
  }

  /**
   * Optimize memory usage
   */
  public async optimizeMemory(): Promise<void> {
    try {
      const metrics = this.getMemoryMetrics();

      // Check if memory usage is high
      if (metrics.heapUsed > this.config.maxMemoryUsage * this.config.gcThreshold) {
        console.log(
          '[MemoryOptimizationService] High memory usage detected, triggering optimization...'
        );

        // Force garbage collection
        if (global.gc) {
          global.gc();
          console.log('[MemoryOptimizationService] Garbage collection completed');
        }

        // Clear memory history if too large
        if (this.memoryHistory.length > 100) {
          this.memoryHistory = this.memoryHistory.slice(-50);
        }

        // Log optimization metrics
        const newMetrics = this.getMemoryMetrics();
        const freedMemory = metrics.heapUsed - newMetrics.heapUsed;

        if (freedMemory > 0) {
          console.log(
            `[MemoryOptimizationService] Freed ${(freedMemory / 1024 / 1024).toFixed(2)}MB of memory`
          );
        }
      }
    } catch (error) {
      // ✅ ENHANCED: Use proper logger instead of console.error
      const errorHandlingService = ErrorHandlingService.getInstance();
      const standardError = errorHandlingService.processError(
        error,
        'Failed to optimize memory usage',
        ErrorCodes.PERFORMANCE.OPTIMIZATION_FAILED,
        {
          component: 'MemoryOptimizationService',
          operation: 'optimizeMemory',
          memoryUsage: this.getMemoryMetrics(),
        }
      );

      logError('Memory optimization error', error, {
        component: 'MemoryOptimizationService',
        operation: 'optimizeMemory',
        memoryUsage: this.getMemoryMetrics(),
        standardError: standardError.message,
        errorCode: standardError.code,
      });
    }
  }

  /**
   * Track database query performance
   */
  public trackQuery(query: string, duration: number, memoryImpact: number): void {
    try {
      this.queryMetrics.queryCount++;
      this.queryMetrics.averageQueryTime =
        (this.queryMetrics.averageQueryTime * (this.queryMetrics.queryCount - 1) + duration) /
        this.queryMetrics.queryCount;
      this.queryMetrics.memoryImpact += memoryImpact;

      // Track slow queries
      if (duration > this.config.maxQueryTime) {
        this.queryMetrics.slowQueries.push({
          query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
          duration,
          timestamp: Date.now(),
        });

        // Keep only last 50 slow queries
        if (this.queryMetrics.slowQueries.length > 50) {
          this.queryMetrics.slowQueries = this.queryMetrics.slowQueries.slice(-50);
        }
      }
    } catch (error) {
      console.error('[MemoryOptimizationService] Query tracking failed:', error);
    }
  }

  /**
   * Get query optimization metrics
   */
  public getQueryMetrics(): QueryOptimizationMetrics {
    return { ...this.queryMetrics };
  }

  /**
   * Detect potential memory leaks
   */
  public detectMemoryLeaks(): Array<{
    type: 'increasing' | 'stagnant' | 'high_usage';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }> {
    const leaks: Array<{
      type: 'increasing' | 'stagnant' | 'high_usage';
      description: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    try {
      if (this.memoryHistory.length < 10) return leaks;

      const recentMetrics = this.memoryHistory.slice(-10);
      const firstMetric = recentMetrics[0];
      const lastMetric = recentMetrics[recentMetrics.length - 1];

      // Check for increasing memory usage
      const memoryIncrease = lastMetric.heapUsed - firstMetric.heapUsed;
      const timeSpan = lastMetric.timestamp - firstMetric.timestamp;
      const increaseRate = memoryIncrease / timeSpan;

      if (increaseRate > 1024 * 1024) {
        // More than 1MB per second
        leaks.push({
          type: 'increasing',
          description: `Memory usage increasing at ${(increaseRate / 1024 / 1024).toFixed(2)}MB/s`,
          severity: 'high',
        });
      }

      // Check for high memory usage
      const currentUsage = this.getMemoryMetrics();
      if (currentUsage.heapUsed > this.config.maxMemoryUsage * 0.9) {
        leaks.push({
          type: 'high_usage',
          description: `High memory usage: ${(currentUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          severity: 'medium',
        });
      }

      // Check for stagnant memory (no garbage collection)
      const stagnantThreshold = 5 * 60 * 1000; // 5 minutes
      const stagnantMetrics = this.memoryHistory.filter(
        metric => Date.now() - metric.timestamp < stagnantThreshold
      );

      if (stagnantMetrics.length > 0) {
        const avgUsage =
          stagnantMetrics.reduce((sum, metric) => sum + metric.heapUsed, 0) /
          stagnantMetrics.length;
        if (avgUsage > this.config.maxMemoryUsage * 0.8) {
          leaks.push({
            type: 'stagnant',
            description: `Stagnant high memory usage: ${(avgUsage / 1024 / 1024).toFixed(2)}MB`,
            severity: 'medium',
          });
        }
      }
    } catch (error) {
      console.error('[MemoryOptimizationService] Memory leak detection failed:', error);
    }

    return leaks;
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    const monitorInterval = setInterval(() => {
      try {
        const metrics = this.getMemoryMetrics();
        this.memoryHistory.push(metrics);

        // Keep only last 100 metrics
        if (this.memoryHistory.length > 100) {
          this.memoryHistory = this.memoryHistory.slice(-100);
        }

        // Check for memory leaks
        const leaks = this.detectMemoryLeaks();
        if (leaks.length > 0) {
          console.warn('[MemoryOptimizationService] Potential memory leaks detected:', leaks);
        }

        // Optimize memory if needed
        this.optimizeMemory();
      } catch (error) {
        console.error('[MemoryOptimizationService] Memory monitoring failed:', error);
      }
    }, this.config.optimizationInterval);

    // Store interval reference for cleanup
    this.optimizationInterval = monitorInterval;
  }

  /**
   * Start query optimization monitoring
   */
  private startQueryOptimization(): void {
    // This will be called by database operations
    console.log('[MemoryOptimizationService] Query optimization monitoring started');
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    try {
      if (this.optimizationInterval) {
        clearInterval(this.optimizationInterval);
        this.optimizationInterval = null;
      }

      this.memoryHistory = [];
      this.queryMetrics = {
        queryCount: 0,
        averageQueryTime: 0,
        slowQueries: [],
        memoryImpact: 0,
      };

      console.log('[MemoryOptimizationService] Cleanup completed');
    } catch (error) {
      console.error('[MemoryOptimizationService] Cleanup failed:', error);
    }
  }

  /**
   * Get optimization recommendations
   */
  public getOptimizationRecommendations(): Array<{
    type: 'memory' | 'query' | 'cache';
    priority: 'low' | 'medium' | 'high';
    description: string;
    impact: string;
  }> {
    const recommendations: Array<{
      type: 'memory' | 'query' | 'cache';
      priority: 'low' | 'medium' | 'high';
      description: string;
      impact: string;
    }> = [];

    try {
      const metrics = this.getMemoryMetrics();
      const queryMetrics = this.getQueryMetrics();

      // Memory recommendations
      if (metrics.heapUsed > this.config.maxMemoryUsage * 0.8) {
        recommendations.push({
          type: 'memory',
          priority: 'high',
          description: 'Reduce memory usage through code optimization',
          impact: 'High - Prevents out-of-memory errors',
        });
      }

      // Query recommendations
      if (queryMetrics.averageQueryTime > this.config.maxQueryTime) {
        recommendations.push({
          type: 'query',
          priority: 'medium',
          description: 'Optimize slow database queries',
          impact: 'Medium - Improves response times',
        });
      }

      if (queryMetrics.slowQueries.length > 10) {
        recommendations.push({
          type: 'query',
          priority: 'high',
          description: 'Address multiple slow queries',
          impact: 'High - Significant performance impact',
        });
      }

      // Cache recommendations
      if (queryMetrics.queryCount > 100 && queryMetrics.averageQueryTime > 500) {
        recommendations.push({
          type: 'cache',
          priority: 'medium',
          description: 'Implement query result caching',
          impact: 'Medium - Reduces database load',
        });
      }
    } catch (error) {
      console.error('[MemoryOptimizationService] Failed to generate recommendations:', error);
    }

    return recommendations;
  }
}

export default MemoryOptimizationService;
