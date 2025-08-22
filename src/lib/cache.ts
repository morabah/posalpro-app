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
/* eslint-disable @typescript-eslint/no-unused-vars */
class CacheService {
  private static instance: CacheService | null = null;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    import('@/lib/logger').then(({ logWarn }) =>
      logWarn('CacheService is deprecated. Use apiClient built-in caching instead.')
    );
  }

  static getInstance(): CacheService {
    if (CacheService.instance === null) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  set(_key: string, _data: unknown, _ttl: number): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    import('@/lib/logger').then(({ logWarn }) =>
      logWarn('CacheService.set is deprecated. Use apiClient built-in caching instead.')
    );
  }

  get(_key: string): null {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    import('@/lib/logger').then(({ logWarn }) =>
      logWarn('CacheService.get is deprecated. Use apiClient built-in caching instead.')
    );
    return null;
  }

  delete(_key: string): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    import('@/lib/logger').then(({ logWarn }) =>
      logWarn('CacheService.delete is deprecated. Use apiClient built-in caching instead.')
    );
  }

  clear(): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    import('@/lib/logger').then(({ logWarn }) =>
      logWarn('CacheService.clear is deprecated. Use apiClient built-in caching instead.')
    );
  }

  async cached<T>(_key: string, fn: () => Promise<T>, _ttl: number): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    import('@/lib/logger').then(({ logWarn }) =>
      logWarn('CacheService.cached is deprecated. Use apiClient built-in caching instead.')
    );
    // Just execute the function without caching
    return await fn();
  }
}

export const cacheService = CacheService.getInstance();
