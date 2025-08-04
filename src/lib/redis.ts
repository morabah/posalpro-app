/**
 * PosalPro MVP2 - Redis Client Configuration
 * High-performance caching layer for session and providers data
 */

import { createClient } from 'redis';

// Redis client configuration
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000,
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

export async function initializeRedis() {
  if (isConnected) return redisClient;

  try {
    console.log('📡 Attempting to connect to Redis...');
    await redisClient.connect();
    isConnected = true;
    console.log('✅ Redis connected successfully');

    // Test the connection
    const pong = await redisClient.ping();
    console.log(`✅ Redis ping successful: ${pong}`);
  } catch (error) {
    console.warn(
      '⚠️  Redis connection failed, falling back to in-memory cache:',
      error instanceof Error ? error.message : String(error)
    );
    isConnected = false;
  }

  return redisClient;
}

// Ensure Redis is initialized when module is loaded
let initializationPromise: Promise<any> | null = null;

export async function ensureRedisConnection() {
  if (!initializationPromise) {
    initializationPromise = initializeRedis();
  }
  return initializationPromise;
}

// Cache operations
export async function getCache(key: string): Promise<any> {
  try {
    await ensureRedisConnection();

    if (!isConnected) return null;

    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn('⚠️  Redis get error:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function setCache(
  key: string,
  value: any,
  ttl: number = CACHE_CONFIG.SESSION_TTL
): Promise<void> {
  try {
    await ensureRedisConnection();

    if (!isConnected) return;

    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.warn('⚠️  Redis set error:', error instanceof Error ? error.message : String(error));
  }
}

export async function deleteCache(key: string): Promise<void> {
  if (!isConnected) return;

  try {
    await redisClient.del(key);
  } catch (error) {
    console.warn('⚠️  Redis delete error:', error instanceof Error ? error.message : String(error));
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
    console.warn('⚠️  Redis clear error:', error instanceof Error ? error.message : String(error));
  }
}

// Session cache operations
export async function getSessionCache(userId: string): Promise<any> {
  return getCache(`session:${userId}`);
}

export async function setSessionCache(userId: string, session: any): Promise<void> {
  await setCache(`session:${userId}`, session, CACHE_CONFIG.SESSION_TTL);
}

export async function deleteSessionCache(userId: string): Promise<void> {
  await deleteCache(`session:${userId}`);
}

// Providers cache operations
export async function getProvidersCache(): Promise<any> {
  return getCache('providers');
}

export async function setProvidersCache(providers: any): Promise<void> {
  await setCache('providers', providers, CACHE_CONFIG.PROVIDERS_TTL);
}

// User cache operations
export async function getUserCache(email: string): Promise<any> {
  return getCache(`user:${email}`);
}

export async function setUserCache(email: string, user: any): Promise<void> {
  await setCache(`user:${email}`, user, CACHE_CONFIG.USER_TTL);
}

export async function deleteUserCache(email: string): Promise<void> {
  await deleteCache(`user:${email}`);
}

// Auth cache operations
export async function getAuthCache(key: string): Promise<any> {
  return getCache(`auth:${key}`);
}

export async function setAuthCache(key: string, data: any): Promise<void> {
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
    console.warn(
      '⚠️  Redis health check failed:',
      error instanceof Error ? error.message : String(error)
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
ensureRedisConnection().catch(console.error);

export { CACHE_CONFIG, redisClient };
