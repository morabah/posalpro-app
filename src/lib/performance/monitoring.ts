// [PERFORMANCE_FIX] Global Performance Monitor
export class PerformanceMonitor {
  static measure(name: string, fn: Function) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    console.log(`[PERFORMANCE] ${name}: ${end - start}ms`);

    // Log slow operations
    if (end - start > 1000) {
      console.warn(`[PERFORMANCE] Slow operation detected: ${name} took ${end - start}ms`);
    }

    return result;
  }

  static async measureAsync(name: string, fn: Function) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    console.log(`[PERFORMANCE] ${name}: ${end - start}ms`);

    // Log slow operations
    if (end - start > 1000) {
      console.warn(`[PERFORMANCE] Slow async operation detected: ${name} took ${end - start}ms`);
    }

    return result;
  }
}

// Memory monitoring
export class MemoryMonitor {
  static logMemoryUsage(context: string) {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = performance.memory;
      console.log(`[MEMORY] ${context}:`, {
        used: Math.round((memory as any).usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round((memory as any).totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round((memory as any).jsHeapSizeLimit / 1024 / 1024) + 'MB'
      });
    }
  }

  static cleanup() {
    if (typeof window !== 'undefined' && window.gc) {
      window.gc();
      console.log('[MEMORY] Garbage collection triggered');
    }
  }
}