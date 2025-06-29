/**
 * Cache Service - High-performance caching layer
 * Reduces database load and improves response times
 */

class CacheService {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  private static instance: CacheService;

  constructor() {
    this.cache = new Map();

    // Clean expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Cache wrapper for async functions
  async cached<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 300000
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      console.log(`📦 [CACHE] Hit for key: ${key}`);
      return cached;
    }

    console.log(`🔄 [CACHE] Miss for key: ${key}, fetching...`);
    const data = await fn();
    this.set(key, data, ttl);
    return data;
  }
}

export const cacheService = CacheService.getInstance();