/**
 * Request Deduplication Utility
 * Prevents duplicate API calls by caching pending requests
 */

interface PendingRequest<T = unknown> {
  promise: Promise<T>;
  timestamp: number;
  timeout?: NodeJS.Timeout;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<unknown>>();
  private readonly DEFAULT_TTL = 5000; // 5 seconds

  /**
   * Deduplicate a request by URL and method
   */
  deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    // Check if request is already pending
    const existing = this.pendingRequests.get(key);
    
    if (existing) {
      console.log(`🔄 [RequestDeduplication] Reusing pending request: ${key}`);
      return existing.promise as Promise<T>;
    }

    // Create new request
    console.log(`🚀 [RequestDeduplication] Creating new request: ${key}`);
    const promise = requestFn();
    
    // Set up cleanup
    const timeout = setTimeout(() => {
      this.pendingRequests.delete(key);
    }, ttl);

    // Store pending request
    this.pendingRequests.set(key, {
      promise: promise as Promise<unknown>,
      timestamp: Date.now(),
      timeout,
    });

    // Clean up on completion (success or failure)
    promise
      .finally(() => {
        const pending = this.pendingRequests.get(key);
        if (pending?.timeout) {
          clearTimeout(pending.timeout);
        }
        this.pendingRequests.delete(key);
      });

    return promise;
  }

  /**
   * Generate a cache key for API requests
   */
  generateKey(method: string, url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramString}`;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.forEach((request) => {
      if (request.timeout) {
        clearTimeout(request.timeout);
      }
    });
    this.pendingRequests.clear();
  }

  /**
   * Get statistics about pending requests
   */
  getStats(): { pendingCount: number; oldestRequest: number; keys: string[] } {
    return {
      pendingCount: this.pendingRequests.size,
      oldestRequest: this.getOldestRequestAge(),
      keys: Array.from(this.pendingRequests.keys()),
    };
  }

  private getOldestRequestAge(): number {
    let oldest = 0;
    const now = Date.now();
    
    this.pendingRequests.forEach((request) => {
      const age = now - request.timestamp;
      if (age > oldest) {
        oldest = age;
      }
    });
    
    return oldest;
  }
}

// Singleton instance
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Hook for using request deduplication in React components
 */
export function useRequestDeduplication() {
  return {
    deduplicate: requestDeduplicator.deduplicate.bind(requestDeduplicator),
    generateKey: requestDeduplicator.generateKey.bind(requestDeduplicator),
    getStats: requestDeduplicator.getStats.bind(requestDeduplicator),
  };
}

/**
 * Decorator for API client methods to automatically deduplicate requests
 */
export function withDeduplication<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    return requestDeduplicator.deduplicate(key, () => fn(...args));
  }) as T;
}
