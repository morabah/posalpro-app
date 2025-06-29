
// API Performance Optimization
import { NextResponse } from 'next/server';

// Simple in-memory cache for API responses
const apiCache = new Map();

export function withCache(handler, cacheTimeSeconds = 300) {
  return async (req) => {
    const cacheKey = req.url + JSON.stringify(req.body || {});
    const cached = apiCache.get(cacheKey);

    // Return cached response if valid
    if (cached && Date.now() - cached.timestamp < cacheTimeSeconds * 1000) {
      return NextResponse.json(cached.data);
    }

    // Execute handler and cache result
    const result = await handler(req);
    const data = await result.json();

    // Cache successful responses only
    if (result.status < 400) {
      apiCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      // Cleanup old cache entries (simple LRU)
      if (apiCache.size > 100) {
        const firstKey = apiCache.keys().next().value;
        apiCache.delete(firstKey);
      }
    }

    return NextResponse.json(data);
  };
}

// Database query optimization helper
export async function optimizeQuery(query, params) {
  const startTime = Date.now();

  try {
    const result = await query(params);
    const duration = Date.now() - startTime;

    if (duration > 1000) {
      console.warn(`Slow query detected: ${duration}ms`);
    }

    return result;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}
