/**
 * PosalPro MVP2 - Security Storage Interfaces
 * Abstract storage layer for CSRF and rate limiting state
 * Based on CORE_REQUIREMENTS.md patterns for maintainability
 *
 * Component Traceability Matrix:
 * - User Stories: US-9.1 (Security Infrastructure)
 * - Acceptance Criteria: AC-9.1.1, AC-9.1.2
 * - Hypotheses: H9 (Security Scalability)
 * - Test Cases: TC-H9-001, TC-H9-002
 */

import { deleteCache, getCache, setCache } from '@/lib/redis';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-9.1'],
  acceptanceCriteria: ['AC-9.1.1', 'AC-9.1.2'],
  methods: ['getSecurityState()', 'setSecurityState()', 'deleteSecurityState()'],
  hypotheses: ['H9'],
  testCases: ['TC-H9-001', 'TC-H9-002'],
};

// Abstract storage interface for security state
export interface SecurityStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getKeys(pattern: string): Promise<string[]>;
}

// CSRF Token storage interface
export interface CSRFStorage {
  getToken(sessionId: string): Promise<string | null>;
  setToken(sessionId: string, token: string, expires: number): Promise<void>;
  validateToken(sessionId: string, token: string): Promise<boolean>;
  cleanupExpired(): Promise<void>;
}

// Rate limiting storage interface
export interface RateLimitStorage {
  getAttempts(identifier: string): Promise<{ count: number; resetTime: number } | null>;
  setAttempts(identifier: string, count: number, resetTime: number): Promise<void>;
  incrementAttempts(identifier: string): Promise<number>;
  resetAttempts(identifier: string): Promise<void>;
  cleanup(): Promise<void>;
}

// Redis-based security storage implementation
export class RedisSecurityStorage implements SecurityStorage {
  private readonly prefix: string;
  private readonly defaultTTL: number;

  constructor(prefix: string = 'security', defaultTTL: number = 3600) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get(key: string): Promise<any> {
    try {
      const value = await getCache(this.getKey(key));
      return value;
    } catch (error) {
      console.warn('Security storage get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await setCache(this.getKey(key), value, ttl);
    } catch (error) {
      console.warn('Security storage set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await deleteCache(this.getKey(key));
    } catch (error) {
      console.warn('Security storage delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.get(key);
      return value !== null;
    } catch (error) {
      console.warn('Security storage exists error:', error);
      return false;
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
    // Note: Redis keys pattern matching would need to be implemented
    // For now, return empty array as this is not critical for current use cases
    return [];
  }
}

// Redis-based CSRF storage implementation
export class RedisCSRFStorage implements CSRFStorage {
  private storage: SecurityStorage;

  constructor(storage: SecurityStorage = new RedisSecurityStorage('csrf', 3600)) {
    this.storage = storage;
  }

  async getToken(sessionId: string): Promise<string | null> {
    const data = await this.storage.get(sessionId);
    if (!data) return null;

    // Check if token is expired
    if (Date.now() > data.expires) {
      await this.storage.delete(sessionId);
      return null;
    }

    return data.token;
  }

  async setToken(sessionId: string, token: string, expires: number): Promise<void> {
    const ttl = Math.ceil((expires - Date.now()) / 1000);
    if (ttl <= 0) return;

    await this.storage.set(sessionId, { token, expires }, ttl);
  }

  async validateToken(sessionId: string, token: string): Promise<boolean> {
    const storedToken = await this.getToken(sessionId);
    return storedToken === token;
  }

  async cleanupExpired(): Promise<void> {
    // Redis automatically handles TTL, so no manual cleanup needed
    // This method is kept for interface compatibility
  }
}

// Redis-based rate limiting storage implementation
export class RedisRateLimitStorage implements RateLimitStorage {
  private storage: SecurityStorage;

  constructor(storage: SecurityStorage = new RedisSecurityStorage('ratelimit', 3600)) {
    this.storage = storage;
  }

  async getAttempts(identifier: string): Promise<{ count: number; resetTime: number } | null> {
    const data = await this.storage.get(identifier);
    if (!data) return null;

    // Check if window has expired
    if (Date.now() > data.resetTime) {
      await this.storage.delete(identifier);
      return null;
    }

    return data;
  }

  async setAttempts(identifier: string, count: number, resetTime: number): Promise<void> {
    const ttl = Math.ceil((resetTime - Date.now()) / 1000);
    if (ttl <= 0) return;

    await this.storage.set(identifier, { count, resetTime }, ttl);
  }

  async incrementAttempts(identifier: string): Promise<number> {
    const data = await this.getAttempts(identifier);
    const newCount = (data?.count || 0) + 1;

    if (data) {
      await this.setAttempts(identifier, newCount, data.resetTime);
    }

    return newCount;
  }

  async resetAttempts(identifier: string): Promise<void> {
    await this.storage.delete(identifier);
  }

  async cleanup(): Promise<void> {
    // Redis automatically handles TTL, so no manual cleanup needed
    // This method is kept for interface compatibility
  }
}

// Factory for creating storage instances
export class SecurityStorageFactory {
  static createCSRFStorage(): CSRFStorage {
    return new RedisCSRFStorage();
  }

  static createRateLimitStorage(): RateLimitStorage {
    return new RedisRateLimitStorage();
  }

  static createSecurityStorage(prefix?: string, ttl?: number): SecurityStorage {
    return new RedisSecurityStorage(prefix, ttl);
  }
}
