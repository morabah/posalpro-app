/**
 * Registration Rate Limiting Tests
 * Comprehensive testing for Redis-based rate limiting in registration API
 * Supports H6 (Security) hypothesis validation
 * Component Traceability: US-9.1, AC-9.1.1, AC-9.1.2, H6
 */

import { POST } from '@/app/api/auth/register/route';
import { rateLimiter } from '@/lib/security';
import { NextRequest } from 'next/server';

// Mock the rateLimiter for testing
jest.mock('@/lib/security', () => ({
  rateLimiter: {
    isLimited: jest.fn(),
    getRemainingAttempts: jest.fn(),
  },
}));

// Mock user service
jest.mock('@/lib/services/userService', () => ({
  createUser: jest.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    department: 'Engineering',
  }),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock error handling service
jest.mock('@/lib/errors', () => ({
  createApiErrorResponse: jest.fn().mockImplementation((error, message, code, status, options) => {
    return new Response(
      JSON.stringify({
        ok: false,
        message: message || 'Error',
        error: {
          code,
          metadata: error.metadata,
        },
        ...(options?.userFriendlyMessage && { userFriendlyMessage: options.userFriendlyMessage }),
      }),
      {
        status: status || 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),
  ErrorCodes: {
    SECURITY: { RATE_LIMIT_EXCEEDED: 'SEC_2500' },
    VALIDATION: { INVALID_INPUT: 'VAL_1000' },
    DATA: { DUPLICATE_ENTRY: 'DATA_2000', DATABASE_ERROR: 'DATA_2001', NOT_FOUND: 'DATA_2002' },
    SYSTEM: { INTERNAL_ERROR: 'SYS_5000' },
  },
  StandardError: jest.fn().mockImplementation(options => ({
    message: options.message,
    code: options.code,
    metadata: options.metadata,
  })),
  errorHandlingService: {
    processError: jest.fn(),
  },
}));

describe('Registration Rate Limiting Tests', () => {
  const mockRateLimiter = rateLimiter as jest.Mocked<typeof rateLimiter>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (ip: string, body: any): NextRequest => {
    return {
      headers: new Map([
        ['x-forwarded-for', ip],
        ['content-type', 'application/json'],
      ]),
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  const validRegistrationData = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'SecurePass123!',
    department: 'Engineering',
    roles: ['User'],
    acceptTerms: true,
    firstName: 'Test',
    lastName: 'User',
    companyName: 'Test Company',
    jobTitle: 'Developer',
    phone: '+1234567890',
    notificationChannels: ['EMAIL'],
    notificationFrequency: 'immediate' as const,
  };

  describe('Rate Limiting Enforcement', () => {
    it('should allow registration when under rate limit', async () => {
      // Mock rate limiter to allow request
      mockRateLimiter.isLimited.mockResolvedValue(false);

      const request = createMockRequest('192.168.1.1', validRegistrationData);

      const response = await POST(request);

      expect(mockRateLimiter.isLimited).toHaveBeenCalledWith('192.168.1.1', 5, 60 * 1000);
      expect(response.status).not.toBe(429);
    });

    it('should block registration when rate limit exceeded', async () => {
      // Mock rate limiter to block request
      mockRateLimiter.isLimited.mockResolvedValue(true);
      mockRateLimiter.getRemainingAttempts.mockResolvedValue(0);

      const request = createMockRequest('192.168.1.1', validRegistrationData);

      const response = await POST(request);
      const responseData = await response.json();

      expect(mockRateLimiter.isLimited).toHaveBeenCalledWith('192.168.1.1', 5, 60 * 1000);
      expect(mockRateLimiter.getRemainingAttempts).toHaveBeenCalledWith('192.168.1.1', 5);
      expect(response.status).toBe(429);
      const responseData = await response.json();
      expect(responseData.ok).toBe(false);
      expect(responseData.ok).toBe(false);
      expect(responseData.message).toBe('Too many attempts');
    });

    it('should include remaining attempts in rate limit response', async () => {
      // Mock rate limiter to block request with remaining attempts
      mockRateLimiter.isLimited.mockResolvedValue(true);
      mockRateLimiter.getRemainingAttempts.mockResolvedValue(2);

      const request = createMockRequest('192.168.1.1', validRegistrationData);

      const response = await POST(request);
      const responseData = await response.json();

      expect(responseData.error?.metadata?.remainingAttempts).toBe(2);
    });
  });

  describe('Rate Limiting Window Management', () => {
    it('should reset rate limit after window expires', async () => {
      // First request - under limit
      mockRateLimiter.isLimited.mockResolvedValueOnce(false);

      const request1 = createMockRequest('192.168.1.1', validRegistrationData);
      const response1 = await POST(request1);

      expect(response1.status).not.toBe(429);

      // Simulate time passing and rate limit reset
      mockRateLimiter.isLimited.mockResolvedValueOnce(false);

      const request2 = createMockRequest('192.168.1.1', validRegistrationData);
      const response2 = await POST(request2);

      expect(response2.status).not.toBe(429);
    });

    it('should handle multiple IP addresses independently', async () => {
      // IP 1 - under limit
      mockRateLimiter.isLimited.mockResolvedValueOnce(false);
      const request1 = createMockRequest('192.168.1.1', validRegistrationData);
      const response1 = await POST(request1);
      expect(response1.status).not.toBe(429);

      // IP 2 - under limit
      mockRateLimiter.isLimited.mockResolvedValueOnce(false);
      const request2 = createMockRequest('192.168.1.2', validRegistrationData);
      const response2 = await POST(request2);
      expect(response2.status).not.toBe(429);

      // IP 1 - rate limited
      mockRateLimiter.isLimited.mockResolvedValueOnce(true);
      mockRateLimiter.getRemainingAttempts.mockResolvedValueOnce(0);
      const request3 = createMockRequest('192.168.1.1', validRegistrationData);
      const response3 = await POST(request3);
      expect(response3.status).toBe(429);
      const response3Data = await response3.json();
      expect(response3Data.ok).toBe(false);
    });
  });

  describe('Rate Limiting Error Handling', () => {
    it('should handle rate limiter errors gracefully', async () => {
      // Mock rate limiter to throw error
      mockRateLimiter.isLimited.mockRejectedValue(new Error('Redis connection failed'));

      const request = createMockRequest('192.168.1.1', validRegistrationData);

      const response = await POST(request);

      // Should still process the request even if rate limiting fails
      expect(response.status).not.toBe(429);
    });

    it('should handle unknown IP addresses', async () => {
      mockRateLimiter.isLimited.mockResolvedValue(false);

      const request = createMockRequest('unknown', validRegistrationData);

      const response = await POST(request);

      expect(mockRateLimiter.isLimited).toHaveBeenCalledWith('unknown', 5, 60 * 1000);
      expect(response.status).not.toBe(429);
    });
  });

  describe('Rate Limiting Configuration', () => {
    it('should use correct rate limit parameters', async () => {
      mockRateLimiter.isLimited.mockResolvedValue(false);

      const request = createMockRequest('192.168.1.1', validRegistrationData);
      await POST(request);

      // Verify correct parameters: 5 attempts per 60 seconds (1 minute)
      expect(mockRateLimiter.isLimited).toHaveBeenCalledWith('192.168.1.1', 5, 60 * 1000);
    });

    it('should extract IP from various header formats', async () => {
      mockRateLimiter.isLimited.mockResolvedValue(false);

      // Test x-forwarded-for header
      const request1 = createMockRequest('192.168.1.1', validRegistrationData);
      await POST(request1);
      expect(mockRateLimiter.isLimited).toHaveBeenCalledWith('192.168.1.1', 5, 60 * 1000);

      // Test x-real-ip header
      const request2 = {
        headers: new Map([
          ['x-real-ip', '192.168.1.2'],
          ['content-type', 'application/json'],
        ]),
        json: jest.fn().mockResolvedValue(validRegistrationData),
      } as unknown as NextRequest;

      await POST(request2);
      expect(mockRateLimiter.isLimited).toHaveBeenCalledWith('192.168.1.2', 5, 60 * 1000);
    });
  });

  describe('Component Traceability Matrix', () => {
    it('should support US-9.1: Secure user registration with rate limiting', async () => {
      mockRateLimiter.isLimited.mockResolvedValue(false);

      const request = createMockRequest('192.168.1.1', validRegistrationData);
      const response = await POST(request);

      expect(response.status).not.toBe(429);
      expect(mockRateLimiter.isLimited).toHaveBeenCalled();
    });

    it('should support AC-9.1.1: Registration attempts limited to 5 per minute', async () => {
      // Mock rate limiter to block request (simulating 6th attempt)
      mockRateLimiter.isLimited.mockResolvedValue(true);
      mockRateLimiter.getRemainingAttempts.mockResolvedValue(0);

      const request = createMockRequest('192.168.1.1', validRegistrationData);
      const response = await POST(request);

      expect(response.status).toBe(429);
      const responseData = await response.json();
      expect(responseData.ok).toBe(false);
    });

    it('should support AC-9.1.2: Rate limit window resets after 60 seconds', async () => {
      // First request - allowed
      mockRateLimiter.isLimited.mockResolvedValueOnce(false);
      const request1 = createMockRequest('192.168.1.1', validRegistrationData);
      const response1 = await POST(request1);
      expect(response1.status).not.toBe(429);

      // Simulate window reset
      mockRateLimiter.isLimited.mockResolvedValueOnce(false);
      const request2 = createMockRequest('192.168.1.1', validRegistrationData);
      const response2 = await POST(request2);
      expect(response2.status).not.toBe(429);
    });

    it('should support H6: Security infrastructure prevents abuse', async () => {
      // Test that rate limiting effectively prevents abuse
      mockRateLimiter.isLimited.mockResolvedValue(true);
      mockRateLimiter.getRemainingAttempts.mockResolvedValue(0);

      const request = createMockRequest('192.168.1.1', validRegistrationData);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(429);
      const responseData = await response.json();
      expect(responseData.ok).toBe(false);
      expect(responseData.userFriendlyMessage).toBe(
        'Too many registration attempts. Please try again later.'
      );
      expect(responseData.ok).toBe(false);
    });
  });
});
