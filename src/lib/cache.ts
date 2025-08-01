/**
 * Cache Service - DEPRECATED
 * 
 * This custom caching system has been removed to comply with CORE_REQUIREMENTS.md
 * All caching is now handled automatically by apiClient.
 * 
 * This file is kept for backward compatibility but exports no-op stubs.
 * Use useApiClient pattern for all data fetching with built-in caching.
 */

// Deprecated cache service - kept for backward compatibility
class CacheService {
  private static instance: CacheService;

  constructor() {
    console.warn('CacheService is deprecated. Use apiClient built-in caching instead.');
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  set(_key: string, _data: unknown, _ttl: number = 300000): void {
    console.warn('CacheService.set is deprecated. Use apiClient built-in caching instead.');
  }

  get(_key: string): null {
    console.warn('CacheService.get is deprecated. Use apiClient built-in caching instead.');
    return null;
  }

  delete(_key: string): void {
    console.warn('CacheService.delete is deprecated. Use apiClient built-in caching instead.');
  }

  clear(): void {
    console.warn('CacheService.clear is deprecated. Use apiClient built-in caching instead.');
  }

  async cached<T>(
    _key: string,
    fn: () => Promise<T>,
    _ttl: number = 300000
  ): Promise<T> {
    console.warn('CacheService.cached is deprecated. Use apiClient built-in caching instead.');
    // Just execute the function without caching
    return await fn();
  }
}

export const cacheService = CacheService.getInstance();