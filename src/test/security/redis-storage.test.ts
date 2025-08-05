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

describe('Redis Security Storage', () => {
  let csrfStorage: CSRFStorage;
  let rateLimitStorage: RateLimitStorage;

  beforeEach(() => {
    csrfStorage = SecurityStorageFactory.createCSRFStorage();
    rateLimitStorage = SecurityStorageFactory.createRateLimitStorage();
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
});
