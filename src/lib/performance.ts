/**
 * Performance Monitoring Infrastructure
 * Provides comprehensive performance tracking and measurement utilities
 * for application optimization and debugging
 */

import { logError, logPerformance, logWarn } from './logger';

// Performance measurement interface
export interface PerformanceMeasurement {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  status: 'active' | 'completed' | 'failed';
  category?: string;
}

// Performance metrics interface
export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
  category: string;
  environment: string;
}

// Performance summary interface
export interface PerformanceSummary {
  totalMeasurements: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  slowOperations: PerformanceMetrics[];
  recentMeasurements: PerformanceMetrics[];
}

// Performance configuration interface
interface PerformanceConfig {
  enableTracking: boolean;
  slowOperationThreshold: number; // milliseconds
  maxHistorySize: number;
  enableAutoReporting: boolean;
  reportingInterval: number; // milliseconds
}

// Environment-aware performance configuration
const getPerformanceConfig = (): PerformanceConfig => {
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';

  return {
    enableTracking: true, // Always enabled
    slowOperationThreshold: isProduction ? 1000 : 500, // More lenient in dev
    maxHistorySize: isProduction ? 100 : 500,
    enableAutoReporting: isProduction,
    reportingInterval: 60000, // 1 minute
  };
};

// Performance manager class
class PerformanceManager {
  private activeMeasurements = new Map<string, PerformanceMeasurement>();
  private metricsHistory: PerformanceMetrics[] = [];
  private config: PerformanceConfig;
  private reportingTimer?: NodeJS.Timeout;

  constructor() {
    this.config = getPerformanceConfig();

    if (this.config.enableAutoReporting) {
      this.startAutoReporting();
    }
  }

  private generateMeasurementId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private startAutoReporting(): void {
    this.reportingTimer = setInterval(() => {
      this.generateReport();
    }, this.config.reportingInterval);
  }

  private cleanupHistory(): void {
    if (this.metricsHistory.length > this.config.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.config.maxHistorySize);
    }
  }

  // Start a performance measurement
  public startMeasurement(name: string, metadata?: Record<string, unknown>): string {
    if (!this.config.enableTracking) return '';

    const id = this.generateMeasurementId();
    const measurement: PerformanceMeasurement = {
      id,
      name,
      startTime: performance.now(),
      metadata,
      status: 'active',
      category: (metadata?.category as string) || 'general',
    };

    this.activeMeasurements.set(id, measurement);

    return id;
  }

  // End a performance measurement
  public endMeasurement(id: string): number {
    if (!this.config.enableTracking || !id) return 0;

    const measurement = this.activeMeasurements.get(id);
    if (!measurement) {
      logWarn('Performance measurement not found', { measurementId: id });
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - measurement.startTime;

    // Update measurement
    measurement.endTime = endTime;
    measurement.duration = duration;
    measurement.status = 'completed';

    // Create metrics record
    const metrics: PerformanceMetrics = {
      operation: measurement.name,
      duration,
      timestamp: new Date().toISOString(),
      metadata: measurement.metadata,
      category: measurement.category || 'general',
      environment: process.env.NODE_ENV || 'development',
    };

    // Add to history
    this.metricsHistory.push(metrics);
    this.cleanupHistory();

    // Remove from active measurements
    this.activeMeasurements.delete(id);

    // Log slow operations
    if (duration > this.config.slowOperationThreshold) {
      logPerformance(measurement.name, duration, {
        ...measurement.metadata,
        category: 'slow_operation',
        threshold: this.config.slowOperationThreshold,
      });
    }

    return duration;
  }

  // Track performance of a function execution
  public async trackPerformance<T>(
    label: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const measurementId = this.startMeasurement(label, metadata);

    try {
      const result = await fn();
      this.endMeasurement(measurementId);
      return result;
    } catch (error) {
      // Mark measurement as failed
      const measurement = this.activeMeasurements.get(measurementId);
      if (measurement) {
        measurement.status = 'failed';
        this.activeMeasurements.delete(measurementId);
      }

      logError('Performance tracked function failed', error, {
        operation: label,
        metadata,
      });

      throw error;
    }
  }

  // Synchronous version of trackPerformance
  public trackPerformanceSync<T>(
    label: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const measurementId = this.startMeasurement(label, metadata);

    try {
      const result = fn();
      this.endMeasurement(measurementId);
      return result;
    } catch (error) {
      // Mark measurement as failed
      const measurement = this.activeMeasurements.get(measurementId);
      if (measurement) {
        measurement.status = 'failed';
        this.activeMeasurements.delete(measurementId);
      }

      logError('Performance tracked function failed', error, {
        operation: label,
        metadata,
      });

      throw error;
    }
  }

  // Get performance summary
  public getSummary(): PerformanceSummary {
    const completedMeasurements = this.metricsHistory;

    if (completedMeasurements.length === 0) {
      return {
        totalMeasurements: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        slowOperations: [],
        recentMeasurements: [],
      };
    }

    const durations = completedMeasurements.map(m => m.duration);
    const slowOperations = completedMeasurements.filter(
      m => m.duration > this.config.slowOperationThreshold
    );

    return {
      totalMeasurements: completedMeasurements.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      slowOperations: slowOperations.slice(-10), // Last 10 slow operations
      recentMeasurements: completedMeasurements.slice(-10), // Last 10 measurements
    };
  }

  // Generate and log performance report
  public generateReport(): void {
    const summary = this.getSummary();

    if (summary.totalMeasurements === 0) return;

    logPerformance('Performance Report', 0, {
      category: 'report',
      summary,
      activeComponents: this.activeMeasurements.size,
      timestamp: new Date().toISOString(),
    });
  }

  // Get active measurements (for debugging)
  public getActiveMeasurements(): PerformanceMeasurement[] {
    return Array.from(this.activeMeasurements.values());
  }

  // Clear all metrics history
  public clearHistory(): void {
    this.metricsHistory = [];
  }

  // Update configuration
  public updateConfig(updates: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...updates };

    // Restart auto-reporting if interval changed
    if (updates.reportingInterval && this.reportingTimer) {
      clearInterval(this.reportingTimer);
      this.startAutoReporting();
    }
  }

  // Get current configuration
  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  // Cleanup resources
  public destroy(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
    }
    this.activeMeasurements.clear();
    this.metricsHistory = [];
  }
}

// Create singleton performance manager
const performanceManager = new PerformanceManager();

// Export convenience functions
export const startMeasurement = (name: string, metadata?: Record<string, unknown>): string =>
  performanceManager.startMeasurement(name, metadata);

export const endMeasurement = (id: string): number => performanceManager.endMeasurement(id);

export const trackPerformance = <T>(
  label: string,
  fn: () => T | Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> => performanceManager.trackPerformance(label, fn, metadata);

export const trackPerformanceSync = <T>(
  label: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T => performanceManager.trackPerformanceSync(label, fn, metadata);

export const getPerformanceSummary = (): PerformanceSummary => performanceManager.getSummary();

export const generatePerformanceReport = (): void => performanceManager.generateReport();

// Export performance manager for advanced usage
export { performanceManager };

// Export types
export type { PerformanceConfig };
