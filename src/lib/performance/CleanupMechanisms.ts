/**
 * 🚀 Phase 2: Enhanced Cleanup Mechanisms Service
 *
 * Provides comprehensive cleanup functionality for performance optimization
 * including memory management, event listener cleanup, and resource disposal.
 *
 * Component Traceability Matrix:
 * - User Stories: US-6.4, US-6.5, US-6.6
 * - Acceptance Criteria: AC-6.4.1, AC-6.5.1, AC-6.6.1
 * - Methods: cleanupEventListeners(), cleanupMemoryLeaks(), cleanupAsyncOperations()
 * - Hypotheses: H12, H13, H14
 * - Test Cases: TC-H12-002, TC-H13-001, TC-H14-001
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';

export interface CleanupConfig {
  enableMemoryCleanup: boolean;
  enableEventListenerCleanup: boolean;
  enableAsyncCleanup: boolean;
  cleanupInterval: number; // ms between cleanup operations
  memoryThreshold: number; // % memory usage threshold for forced cleanup
  maxRetentionTime: number; // ms max time to retain resources
}

export interface CleanupMetrics {
  eventListenersRemoved: number;
  memoryFreedKB: number;
  asyncOperationsCancelled: number;
  timeoutsCleaned: number;
  intervalsCleaned: number;
  cleanupOperations: number;
  lastCleanupTime: number;
  averageCleanupTime: number;
  errorsEncountered: number;
}

export interface CleanupEntry {
  id: string;
  type: 'event' | 'timeout' | 'interval' | 'promise' | 'memory';
  resource: any;
  timestamp: number;
  component?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class CleanupMechanisms {
  private static instance: CleanupMechanisms;
  private errorHandlingService: ErrorHandlingService;
  private config: CleanupConfig;
  private cleanupRegistry: Map<string, CleanupEntry> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private metrics: CleanupMetrics;

  private constructor(config: Partial<CleanupConfig> = {}) {
    this.errorHandlingService = ErrorHandlingService.getInstance();
    this.config = {
      enableMemoryCleanup: true,
      enableEventListenerCleanup: true,
      enableAsyncCleanup: true,
      cleanupInterval: 60000, // 60 seconds
      memoryThreshold: 80, // 80% memory usage
      maxRetentionTime: 300000, // 5 minutes
      ...config,
    };

    this.metrics = {
      eventListenersRemoved: 0,
      memoryFreedKB: 0,
      asyncOperationsCancelled: 0,
      timeoutsCleaned: 0,
      intervalsCleaned: 0,
      cleanupOperations: 0,
      lastCleanupTime: 0,
      averageCleanupTime: 0,
      errorsEncountered: 0,
    };

    this.startCleanupScheduler();
  }

  /**
   * 🕒 Private: Start periodic cleanup scheduler
   */
  private startCleanupScheduler(): void {
    const existingInterval = this.cleanupInterval;
    if (existingInterval !== null) {
      clearInterval(existingInterval);
      this.cleanupInterval = null;
    }

    this.cleanupInterval = setInterval(() => {
      try {
        // Periodically run key cleanup routines
        if (this.config.enableMemoryCleanup) {
          this.cleanupMemoryLeaks();
        }
        if (this.config.enableAsyncCleanup) {
          this.cleanupAsyncOperations();
        }
      } catch (error) {
        this.errorHandlingService.processError(
          error,
          'Cleanup scheduler tick failed',
          ErrorCodes.SYSTEM.CLEANUP_FAILED,
          {
            component: 'CleanupMechanisms',
            operation: 'startCleanupScheduler.tick',
            timestamp: Date.now(),
          }
        );
      }
    }, this.config.cleanupInterval);
  }

  /**
   * 🧽 Private: Perform cleanup for a single entry
   */
  private performCleanup(entry: CleanupEntry): boolean {
    try {
      switch (entry.type) {
        case 'timeout':
          if (entry.resource) {
            clearTimeout(entry.resource);
          }
          return true;
        case 'interval':
          if (entry.resource) {
            clearInterval(entry.resource);
          }
          return true;
        case 'promise':
          // Best-effort cancellation if supported
          if (entry.resource && typeof entry.resource.cancel === 'function') {
            entry.resource.cancel();
          }
          return true;
        case 'event':
          // Resource should be an unsubscribe/remove function
          if (typeof entry.resource === 'function') {
            try {
              entry.resource();
            } catch {
              // ignore errors from user-provided cleanup fns
            }
          }
          return true;
        case 'memory':
          // Help GC without assigning to `any`
          (entry as { resource?: unknown }).resource = undefined;
          return true;
        default:
          return false;
      }
    } catch (error) {
      this.metrics.errorsEncountered++;
      this.errorHandlingService.processError(
        error,
        'Failed to perform cleanup',
        ErrorCodes.SYSTEM.CLEANUP_FAILED,
        {
          component: 'CleanupMechanisms',
          operation: 'performCleanup',
          entryId: entry.id,
          entryType: entry.type,
          timestamp: Date.now(),
        }
      );
      return false;
    }
  }

  public static getInstance(config?: Partial<CleanupConfig>): CleanupMechanisms {
    if (!CleanupMechanisms.instance) {
      CleanupMechanisms.instance = new CleanupMechanisms(config);
    }
    return CleanupMechanisms.instance;
  }

  /**
   * 🔥 Register a resource for cleanup tracking
   */
  public registerCleanupResource(
    id: string,
    type: CleanupEntry['type'],
    resource: any,
    component?: string,
    priority: CleanupEntry['priority'] = 'medium'
  ): void {
    try {
      const entry: CleanupEntry = {
        id,
        type,
        resource,
        timestamp: Date.now(),
        component,
        priority,
      };

      this.cleanupRegistry.set(id, entry);

      console.log(`[CleanupMechanisms] Registered ${type} resource: ${id} (priority: ${priority})`);
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        `Failed to register cleanup resource: ${id}`,
        ErrorCodes.SYSTEM.CLEANUP_FAILED,
        {
          component: 'CleanupMechanisms',
          operation: 'registerCleanupResource',
          resourceId: id,
          resourceType: type,
          userStories: ['US-6.4', 'US-6.5'],
          hypotheses: ['H12', 'H13'],
          timestamp: Date.now(),
        }
      );
    }
  }

  /**
   * 🧹 Clean up specific resource by ID
   */
  public cleanupResource(id: string): boolean {
    try {
      const entry = this.cleanupRegistry.get(id);
      if (!entry) {
        return false;
      }

      const success = this.performCleanup(entry);
      if (success) {
        this.cleanupRegistry.delete(id);
        console.log(`[CleanupMechanisms] Cleaned up resource: ${id}`);
      }

      return success;
    } catch (error) {
      this.metrics.errorsEncountered++;
      this.errorHandlingService.processError(
        error,
        `Failed to cleanup resource: ${id}`,
        ErrorCodes.SYSTEM.CLEANUP_FAILED,
        {
          component: 'CleanupMechanisms',
          operation: 'cleanupResource',
          resourceId: id,
          userStories: ['US-6.4', 'US-6.5'],
          hypotheses: ['H12', 'H13'],
          timestamp: Date.now(),
        }
      );
      return false;
    }
  }

  /**
   * 🚀 Clean up event listeners for a specific component
   */
  public cleanupEventListeners(componentId: string): void {
    if (!this.config.enableEventListenerCleanup) {
      return;
    }

    try {
      const cleanupStartTime = performance.now();
      let cleanedCount = 0;

      for (const [id, entry] of this.cleanupRegistry) {
        if (entry.type === 'event' && entry.component === componentId) {
          if (this.performCleanup(entry)) {
            this.cleanupRegistry.delete(id);
            cleanedCount++;
          }
        }
      }

      const cleanupTime = performance.now() - cleanupStartTime;
      this.metrics.eventListenersRemoved += cleanedCount;
      this.updateCleanupMetrics(cleanupTime);

      if (cleanedCount > 0) {
        console.log(
          `[CleanupMechanisms] Cleaned up ${cleanedCount} event listeners for ${componentId} in ${cleanupTime.toFixed(2)}ms`
        );
      }
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        `Failed to cleanup event listeners for component: ${componentId}`,
        ErrorCodes.SYSTEM.CLEANUP_FAILED,
        {
          component: 'CleanupMechanisms',
          operation: 'cleanupEventListeners',
          componentId,
          userStories: ['US-6.4', 'US-6.5'],
          hypotheses: ['H12', 'H13'],
          timestamp: Date.now(),
        }
      );
    }
  }

  /**
   * 🧠 Force memory cleanup when threshold is reached
   */
  public cleanupMemoryLeaks(): void {
    if (!this.config.enableMemoryCleanup) {
      return;
    }

    try {
      const cleanupStartTime = performance.now();
      let memoryFreed = 0;

      // Get current memory usage
      const memoryInfo = this.getMemoryInfo();
      const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;

      if (memoryUsagePercent < this.config.memoryThreshold) {
        return; // No cleanup needed
      }

      // Clean up old resources first (FIFO approach)
      const now = Date.now();
      for (const [id, entry] of this.cleanupRegistry) {
        if (now - entry.timestamp > this.config.maxRetentionTime) {
          if (this.performCleanup(entry)) {
            this.cleanupRegistry.delete(id);
            memoryFreed += this.estimateMemoryUsage(entry);
          }
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        memoryFreed += 1024; // Estimate 1KB saved from GC
      }

      const cleanupTime = performance.now() - cleanupStartTime;
      this.metrics.memoryFreedKB += memoryFreed / 1024;
      this.updateCleanupMetrics(cleanupTime);

      console.log(
        `[CleanupMechanisms] Memory cleanup completed: ${(memoryFreed / 1024).toFixed(2)}KB freed in ${cleanupTime.toFixed(2)}ms`
      );
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        'Failed to cleanup memory leaks',
        ErrorCodes.SYSTEM.CLEANUP_FAILED,
        {
          component: 'CleanupMechanisms',
          operation: 'cleanupMemoryLeaks',
          userStories: ['US-6.4', 'US-6.6'],
          hypotheses: ['H12', 'H14'],
          timestamp: Date.now(),
        }
      );
    }
  }

  /**
   * ⏱️ Cancel async operations and timeouts
   */
  public cleanupAsyncOperations(componentId?: string): void {
    if (!this.config.enableAsyncCleanup) {
      return;
    }

    try {
      const cleanupStartTime = performance.now();
      let operationsCancelled = 0;
      let timeoutsCleaned = 0;
      let intervalsCleaned = 0;

      for (const [id, entry] of this.cleanupRegistry) {
        // Filter by component if specified
        if (componentId && entry.component !== componentId) {
          continue;
        }

        if (entry.type === 'timeout' || entry.type === 'interval' || entry.type === 'promise') {
          if (this.performCleanup(entry)) {
            this.cleanupRegistry.delete(id);
            operationsCancelled++;

            if (entry.type === 'timeout') timeoutsCleaned++;
            else if (entry.type === 'interval') intervalsCleaned++;
          }
        }
      }

      const cleanupTime = performance.now() - cleanupStartTime;
      this.metrics.asyncOperationsCancelled += operationsCancelled;
      this.metrics.timeoutsCleaned += timeoutsCleaned;
      this.metrics.intervalsCleaned += intervalsCleaned;
      this.updateCleanupMetrics(cleanupTime);

      if (operationsCancelled > 0) {
        console.log(
          `[Cleanup] Cancelled ${operationsCancelled} async operations (timeouts: ${timeoutsCleaned}, intervals: ${intervalsCleaned}) in ${cleanupTime.toFixed(2)}ms`
        );
      }
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        'Failed to cleanup async operations',
        ErrorCodes.SYSTEM.CLEANUP_FAILED,
        {
          component: 'CleanupMechanisms',
          operation: 'cleanupAsyncOperations',
          timestamp: Date.now(),
        }
      );
    }
  }

  /**
   * 🔧 Private: Update cleanup metrics
   */
  private updateCleanupMetrics(cleanupTime: number): void {
    this.metrics.cleanupOperations++;
    this.metrics.lastCleanupTime = Date.now();

    // Update average cleanup time
    if (this.metrics.cleanupOperations === 1) {
      this.metrics.averageCleanupTime = cleanupTime;
    } else {
      this.metrics.averageCleanupTime =
        (this.metrics.averageCleanupTime * (this.metrics.cleanupOperations - 1) + cleanupTime) /
        this.metrics.cleanupOperations;
    }
  }

  /**
   * 🔧 Private: Get memory information
   */
  private getMemoryInfo(): MemoryInfo {
    if ('memory' in performance) {
      return (performance as any).memory;
    }

    // Fallback for environments without memory API
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 1024 * 1024 * 1024, // 1GB default
    };
  }

  /**
   * 🔧 Private: Estimate memory usage of entry
   */
  private estimateMemoryUsage(entry: CleanupEntry): number {
    // Simplified estimation - real implementation would be more sophisticated
    const baseSizes: Record<string, number> = {
      event: 500, // 500 bytes per event listener
      timeout: 100, // 100 bytes per timeout
      interval: 150, // 150 bytes per interval
      promise: 200, // 200 bytes per promise
      memory: 1000, // 1KB per memory reference
    };

    return baseSizes[entry.type] || 100;
  }

  /**
   * 🧪 Shutdown cleanup scheduler
   */
  public shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Cleanup all remaining resources
    for (const [id] of this.cleanupRegistry) {
      this.cleanupResource(id);
    }

    console.log('[CleanupMechanisms] Shutdown completed');
  }
}

// Memory info interface for TypeScript
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}
