import { logDebug, logWarn } from '@/lib/logger';

// [PERFORMANCE_FIX] Global Performance Monitor
export class PerformanceMonitor {
  static measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    logDebug(`[PERFORMANCE] ${name}: ${end - start}ms`);

    // Log slow operations
    if (end - start > 1000) {
      logWarn(`[PERFORMANCE] Slow operation detected: ${name} took ${end - start}ms`);
    }

    return result;
  }

  static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    logDebug(`[PERFORMANCE] ${name}: ${end - start}ms`);

    // Log slow operations
    if (end - start > 1000) {
      logWarn(`[PERFORMANCE] Slow async operation detected: ${name} took ${end - start}ms`);
    }

    return result;
  }
}

// Memory monitoring
export class MemoryMonitor {
  static logMemoryUsage(context: string) {
    if (typeof window !== 'undefined') {
      interface PerformanceMemory {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      }
      const perf = performance as unknown as { memory?: unknown };
      const isPerformanceMemory = (val: unknown): val is PerformanceMemory =>
        typeof val === 'object' && val !== null &&
        typeof (val as { usedJSHeapSize?: unknown }).usedJSHeapSize === 'number' &&
        typeof (val as { totalJSHeapSize?: unknown }).totalJSHeapSize === 'number' &&
        typeof (val as { jsHeapSizeLimit?: unknown }).jsHeapSizeLimit === 'number';

      if (isPerformanceMemory(perf.memory)) {
        const memory = perf.memory;
        logDebug(`[MEMORY] ${context}:`, {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB',
        });
      }
    }
  }

  static cleanup() {
    if (typeof window !== 'undefined' && window.gc) {
      window.gc();
      logDebug('[MEMORY] Garbage collection triggered');
    }
  }
}
