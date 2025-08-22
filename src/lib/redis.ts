/**
 * PosalPro MVP2 - Redis Client Configuration
 * High-performance caching layer for session and providers data
 */

import { recordCacheHit, recordCacheMiss, recordLatency } from '@/lib/observability/metricsStore';
import { createClient } from 'redis';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { logDebug, logWarn } from '@/lib/logger';
import type { RedisClientType } from 'redis';

// Enable Redis only in production unless explicitly overridden
const USE_REDIS = process.env.NODE_ENV === 'production' && process.env.USE_REDIS !== 'false';

// Redis client configuration
const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 3000,
  },
});

// Cache configuration
const CACHE_CONFIG = {
  SESSION_TTL: 60, // 1 minute
  PROVIDERS_TTL: 300, // 5 minutes
  USER_TTL: 600, // 10 minutes
  AUTH_TTL: 120, // 2 minutes
};

// Initialize Redis connection
let isConnected = false;
// In-memory cache fallback when Redis is disabled/unavailable
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

export async function initializeRedis(): Promise<RedisClientType> {
  if (!USE_REDIS) {
    // Skip connecting in development for faster startup
    isConnected = false;
    return redisClient;
  }
  if (isConnected) return redisClient;

  try {
    logDebug('📡 Attempting to connect to Redis...');
    await redisClient.connect();
    isConnected = true;
    logDebug('✅ Redis connected successfully');

    // Test the connection
    const pong = await redisClient.ping();
    logDebug('✅ Redis ping successful:', { pong });
  } catch (error) {
    logWarn(
      '⚠️  Redis connection failed, falling back to in-memory cache:',
      { error: error instanceof Error ? error.message : String(error) }
    );
    isConnected = false;
  }

  return redisClient;
}

// Ensure Redis is initialized when module is loaded
let initializationPromise: Promise<RedisClientType> | null = null;

export async function ensureRedisConnection(): Promise<RedisClientType> {
  if (!initializationPromise) {
    initializationPromise = initializeRedis();
  }
  return initializationPromise;
}

// Cache operations
export async function getCache<T = unknown>(key: string): Promise<T | null> {
  try {
    await ensureRedisConnection();
    const start = Date.now();

    if (!isConnected) {
      const entry = memoryCache.get(key);
      if (!entry) {
        recordCacheMiss();
        return null;
      }
      if (Date.now() > entry.expiresAt) {
        memoryCache.delete(key);
        recordCacheMiss();
        return null;
      }
      recordCacheHit();
      recordLatency(Date.now() - start);
      return entry.value as T;
    }

    const value = await redisClient.get(key);
    const hit = Boolean(value);
    if (hit) recordCacheHit();
    else recordCacheMiss();
    recordLatency(Date.now() - start);
    return hit ? (JSON.parse(value as string) as T) : null;
  } catch (error) {
    logWarn('⚠️  Cache get error:', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

export async function setCache(
  key: string,
  value: unknown,
  ttl: number = CACHE_CONFIG.SESSION_TTL
): Promise<void> {
  try {
    await ensureRedisConnection();
    const start = Date.now();

    if (!isConnected) {
      memoryCache.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
      recordLatency(Date.now() - start);
      return;
    }

    await redisClient.setEx(key, ttl, JSON.stringify(value));
    recordLatency(Date.now() - start);
  } catch (error) {
    logWarn('⚠️  Cache set error:', { error: error instanceof Error ? error.message : String(error) });
  }
}

export async function deleteCache(key: string): Promise<void> {
  if (!isConnected) {
    memoryCache.delete(key);
    return;
  }

  try {
    await redisClient.del(key);
  } catch (error) {
    logWarn('⚠️  Redis delete error:', { error: error instanceof Error ? error.message : String(error) });
  }
}

export async function clearCache(pattern: string): Promise<void> {
  if (!isConnected) return;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    logWarn('⚠️  Redis clear error:', { error: error instanceof Error ? error.message : String(error) });
  }
}

// Session cache operations
export async function getSessionCache<T = unknown>(userId: string): Promise<T | null> {
  return getCache<T>(`session:${userId}`);
}

export async function setSessionCache(userId: string, session: unknown): Promise<void> {
  await setCache(`session:${userId}`, session, CACHE_CONFIG.SESSION_TTL);
}

export async function deleteSessionCache(userId: string): Promise<void> {
  await deleteCache(`session:${userId}`);
}

// Providers cache operations
export async function getProvidersCache<T = unknown>(): Promise<T | null> {
  return getCache<T>('providers');
}

export async function setProvidersCache(providers: unknown): Promise<void> {
  await setCache('providers', providers, CACHE_CONFIG.PROVIDERS_TTL);
}

// User cache operations
export async function getUserCache<T = unknown>(email: string): Promise<T | null> {
  return getCache<T>(`user:${email}`);
}

export async function setUserCache(email: string, user: unknown): Promise<void> {
  await setCache(`user:${email}`, user, CACHE_CONFIG.USER_TTL);
}

export async function deleteUserCache(email: string): Promise<void> {
  await deleteCache(`user:${email}`);
}

// Auth cache operations
export async function getAuthCache<T = unknown>(key: string): Promise<T | null> {
  return getCache<T>(`auth:${key}`);
}

export async function setAuthCache(key: string, data: unknown): Promise<void> {
  await setCache(`auth:${key}`, data, CACHE_CONFIG.AUTH_TTL);
}

export async function deleteAuthCache(key: string): Promise<void> {
  await deleteCache(`auth:${key}`);
}

// Health check
export async function checkRedisHealth(): Promise<boolean> {
  try {
    // Ensure Redis is initialized
    await ensureRedisConnection();

    if (!isConnected) return false;

    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch (error) {
    logWarn(
      '⚠️  Redis health check failed:',
      { error: error instanceof Error ? error.message : String(error) }
    );
    return false;
  }
}

// Graceful shutdown
export async function closeRedis(): Promise<void> {
  if (isConnected) {
    await redisClient.quit();
    isConnected = false;
  }
}

// Initialize Redis on module load
ensureRedisConnection().catch((error) => {
  ErrorHandlingService.getInstance().processError(
    error,
    'Failed to initialize Redis connection',
    ErrorCodes.SYSTEM.INITIALIZATION_FAILED,
    {
      component: 'Redis',
      operation: 'ensureRedisConnection',
    }
  );
});

export { CACHE_CONFIG, redisClient };
