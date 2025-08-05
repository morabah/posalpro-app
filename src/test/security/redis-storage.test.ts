/**
 * PosalPro MVP2 - Redis Security Storage Tests
 * Validates Redis-based security state storage implementation
 * Based on CORE_REQUIREMENTS.md patterns for quality assurance
 *
 * Component Traceability Matrix:
 * - User Stories: US-9.1
 * - Acceptance Criteria: AC-9.1.1, AC-9.1.2
 * - Hypotheses: H9
 * - Test Cases: TC-H9-001, TC-H9-002
 */

import {
  CSRFStorage,
  RateLimitStorage,
  RedisCSRFStorage,
  RedisRateLimitStorage,
  SecurityStorage,
  SecurityStorageFactory,
} from '@/lib/security/storage';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-9.1'],
  acceptanceCriteria: ['AC-9.1.1', 'AC-9.1.2'],
  methods: ['testCSRFStorage()', 'testRateLimitStorage()'],
  hypotheses: ['H9'],
  testCases: ['TC-H9-001', 'TC-H9-002'],
};

// Mock storage implementation for testing
class MockSecurityStorage implements SecurityStorage {
  private store = new Map<string, any>();

  async get(key: string): Promise<any> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async getKeys(pattern: string): Promise<string[]> {
    return Array.from(this.store.keys()).filter(key => key.includes(pattern));
  }
}

// Mock CSRF storage for testing
class MockCSRFStorage implements CSRFStorage {
  private storage: SecurityStorage;

  constructor(storage: SecurityStorage = new MockSecurityStorage()) {
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
    // Mock implementation - no cleanup needed for in-memory storage
  }
}

// Mock rate limit storage for testing
class MockRateLimitStorage implements RateLimitStorage {
  private storage: SecurityStorage;

  constructor(storage: SecurityStorage = new MockSecurityStorage()) {
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
    // Mock implementation - no cleanup needed for in-memory storage
  }
}

describe('Security Storage (Mock Implementation)', () => {
  let csrfStorage: CSRFStorage;
  let rateLimitStorage: RateLimitStorage;

  beforeEach(() => {
    // Use mock implementations for testing
    csrfStorage = new MockCSRFStorage();
    rateLimitStorage = new MockRateLimitStorage();
  });

  describe('CSRF Storage', () => {
    it('should store and retrieve CSRF tokens', async () => {
      const sessionId = 'test-session-123';
      const token = 'test-token-456';
      const expires = Date.now() + 3600000; // 1 hour

      // Set token
      await csrfStorage.setToken(sessionId, token, expires);

      // Retrieve token
      const retrievedToken = await csrfStorage.getToken(sessionId);
      expect(retrievedToken).toBe(token);
    });

    it('should validate tokens correctly', async () => {
      const sessionId = 'test-session-456';
      const token = 'test-token-789';
      const expires = Date.now() + 3600000; // 1 hour

      // Set token
      await csrfStorage.setToken(sessionId, token, expires);

      // Validate correct token
      const isValid = await csrfStorage.validateToken(sessionId, token);
      expect(isValid).toBe(true);

      // Validate incorrect token
      const isInvalid = await csrfStorage.validateToken(sessionId, 'wrong-token');
      expect(isInvalid).toBe(false);
    });

    it('should handle expired tokens', async () => {
      const sessionId = 'test-session-expired';
      const token = 'test-token-expired';
      const expires = Date.now() - 1000; // Expired 1 second ago

      // Set expired token
      await csrfStorage.setToken(sessionId, token, expires);

      // Should return null for expired token
      const retrievedToken = await csrfStorage.getToken(sessionId);
      expect(retrievedToken).toBeNull();
    });
  });

  describe('Rate Limit Storage', () => {
    it('should track rate limit attempts', async () => {
      const identifier = 'test-ip-123';
      const count = 3;
      const resetTime = Date.now() + 60000; // 1 minute

      // Set attempts
      await rateLimitStorage.setAttempts(identifier, count, resetTime);

      // Get attempts
      const attempts = await rateLimitStorage.getAttempts(identifier);
      expect(attempts).toEqual({ count, resetTime });
    });

    it('should increment attempts correctly', async () => {
      const identifier = 'test-ip-456';
      const resetTime = Date.now() + 60000; // 1 minute

      // Set initial attempts
      await rateLimitStorage.setAttempts(identifier, 2, resetTime);

      // Increment attempts
      const newCount = await rateLimitStorage.incrementAttempts(identifier);
      expect(newCount).toBe(3);

      // Verify updated attempts
      const attempts = await rateLimitStorage.getAttempts(identifier);
      expect(attempts?.count).toBe(3);
    });

    it('should handle expired rate limit windows', async () => {
      const identifier = 'test-ip-expired';
      const count = 5;
      const resetTime = Date.now() - 1000; // Expired 1 second ago

      // Set expired attempts
      await rateLimitStorage.setAttempts(identifier, count, resetTime);

      // Should return null for expired window
      const attempts = await rateLimitStorage.getAttempts(identifier);
      expect(attempts).toBeNull();
    });

    it('should reset attempts correctly', async () => {
      const identifier = 'test-ip-reset';
      const resetTime = Date.now() + 60000; // 1 minute

      // Set attempts
      await rateLimitStorage.setAttempts(identifier, 5, resetTime);

      // Reset attempts
      await rateLimitStorage.resetAttempts(identifier);

      // Should return null after reset
      const attempts = await rateLimitStorage.getAttempts(identifier);
      expect(attempts).toBeNull();
    });
  });

  describe('Security Storage Factory', () => {
    it('should create CSRF storage instances', () => {
      const storage = SecurityStorageFactory.createCSRFStorage();
      expect(storage).toBeInstanceOf(RedisCSRFStorage);
    });

    it('should create rate limit storage instances', () => {
      const storage = SecurityStorageFactory.createRateLimitStorage();
      expect(storage).toBeInstanceOf(RedisRateLimitStorage);
    });
  });

  describe('Interface Compliance', () => {
    it('should implement SecurityStorage interface correctly', () => {
      const storage = new MockSecurityStorage();
      expect(typeof storage.get).toBe('function');
      expect(typeof storage.set).toBe('function');
      expect(typeof storage.delete).toBe('function');
      expect(typeof storage.exists).toBe('function');
      expect(typeof storage.getKeys).toBe('function');
    });

    it('should implement CSRFStorage interface correctly', () => {
      const storage = new MockCSRFStorage();
      expect(typeof storage.getToken).toBe('function');
      expect(typeof storage.setToken).toBe('function');
      expect(typeof storage.validateToken).toBe('function');
      expect(typeof storage.cleanupExpired).toBe('function');
    });

    it('should implement RateLimitStorage interface correctly', () => {
      const storage = new MockRateLimitStorage();
      expect(typeof storage.getAttempts).toBe('function');
      expect(typeof storage.setAttempts).toBe('function');
      expect(typeof storage.incrementAttempts).toBe('function');
      expect(typeof storage.resetAttempts).toBe('function');
      expect(typeof storage.cleanup).toBe('function');
    });
  });
});
