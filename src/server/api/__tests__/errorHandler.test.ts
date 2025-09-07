/**
 * PosalPro MVP2 - API Error Handler Tests
 * Comprehensive tests for error handling functionality
 * Component Traceability: US-6.1 (Performance Optimization), US-6.2 (Error Handling)
 * Hypotheses: H8 (Load Time Optimization), H12 (Error Handling Improvements)
 */

import { StandardError } from '@/lib/errors';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ApiErrorHandler,
  createSanitizedErrorResponse,
  createSuccessResponse,
  ErrorCodes,
  getErrorHandler,
  withErrorHandler,
} from '../errorHandler';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      data,
      status: options?.status || 200,
      headers: options?.headers || {},
    })),
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
}));

describe('ApiErrorHandler', () => {
  let errorHandler: ApiErrorHandler;
  const mockNextResponseJson = NextResponse.json as jest.MockedFunction<typeof NextResponse.json>;

  beforeEach(() => {
    jest.clearAllMocks();
    errorHandler = new ApiErrorHandler({
      component: 'TestComponent',
      operation: 'TestOperation',
    });
  });

  describe('createErrorResponse', () => {
    it('should create sanitized error response for StandardError', () => {
      const standardError = new StandardError({
        message: 'Test error message',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
      });

      const response = errorHandler.createErrorResponse(standardError);

      expect(response).toEqual({
        data: {
          ok: false,
          error: {
            code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
            message: 'An unexpected error occurred. Please try again later.', // User-friendly message
            timestamp: expect.any(String),
          },
        },
        status: 500,
        headers: {},
      });
    });

    it('should create sanitized error response for generic Error', () => {
      const error = new Error('Generic error');

      const response = errorHandler.createErrorResponse(error);

      expect(response).toEqual({
        data: {
          ok: false,
          error: {
            code: ErrorCodes.SYSTEM.UNKNOWN,
            message: 'An unexpected error occurred. Please try again later.', // User-friendly message
            timestamp: expect.any(String),
          },
        },
        status: 500,
        headers: {},
      });
    });

    it('should include details in development mode', () => {
      // Set NODE_ENV to development
      process.env.NODE_ENV = 'development';

      const errorHandlerDev = new ApiErrorHandler({
        includeDetails: true,
      });

      const error = new Error('Test error');
      const response = errorHandlerDev.createErrorResponse(error);

      // Details should be included since original message differs from user-friendly message
      expect(response.data.error.details).toBeDefined();

      // Reset NODE_ENV
      process.env.NODE_ENV = 'test';
    });

    it('should not include details in production mode', () => {
      const errorHandlerProd = new ApiErrorHandler({
        includeDetails: false,
      });

      const error = new Error('Test error');
      const response = errorHandlerProd.createErrorResponse(error);

      expect(response.data.error.details).toBeUndefined();
    });

    it('should apply custom message mapping', () => {
      const errorHandlerWithMapping = new ApiErrorHandler({
        customMessages: {
          [ErrorCodes.SYSTEM.INTERNAL_ERROR]: 'Custom error message',
        },
      });

      const standardError = new StandardError({
        message: 'Original error',
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
      });

      const response = errorHandlerWithMapping.createErrorResponse(standardError);

      expect(response.data.error.message).toBe('Custom error message');
    });

    it('should determine correct HTTP status codes', () => {
      const testCases = [
        { code: ErrorCodes.AUTH.UNAUTHORIZED, expectedStatus: 401 },
        { code: ErrorCodes.AUTH.FORBIDDEN, expectedStatus: 403 },
        { code: ErrorCodes.VALIDATION.INVALID_INPUT, expectedStatus: 400 },
        { code: ErrorCodes.DATA.NOT_FOUND, expectedStatus: 404 },
        { code: ErrorCodes.SYSTEM.INTERNAL_ERROR, expectedStatus: 500 },
      ];

      testCases.forEach(({ code, expectedStatus }) => {
        const error = new StandardError({
          message: 'Test error',
          code: code as any,
        });

        const response = errorHandler.createErrorResponse(error);

        expect(response.status).toBe(expectedStatus);
      });
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response with data and message', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Operation successful';

      const response = errorHandler.createSuccessResponse(data, message, 201);

      expect(response).toEqual({
        data: {
          ok: true,
          data,
          message,
        },
        status: 201,
        headers: {},
      });
    });

    it('should create success response without message', () => {
      const data = { id: 1, name: 'Test' };

      const response = errorHandler.createSuccessResponse(data);

      expect(response).toEqual({
        data: {
          ok: true,
          data,
        },
        status: 200,
        headers: {},
      });
    });
  });

  describe('wrapHandler', () => {
    it('should return successful response when handler succeeds', async () => {
      const mockHandler = jest.fn().mockResolvedValue({
        status: 200,
        data: 'success',
      });

      const wrappedHandler = errorHandler.wrapHandler(mockHandler);
      const result = await wrappedHandler('arg1', 'arg2');

      expect(mockHandler).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toEqual({
        status: 200,
        data: 'success',
      });
    });

    it('should handle errors thrown by handler', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      const wrappedHandler = errorHandler.wrapHandler(mockHandler);

      const result = await wrappedHandler();

      expect(result).toEqual({
        data: {
          ok: false,
          error: {
            code: ErrorCodes.SYSTEM.UNKNOWN,
            message: 'An unexpected error occurred. Please try again later.', // User-friendly message
            timestamp: expect.any(String),
          },
        },
        status: 500,
        headers: {},
      });
    });
  });

  describe('wrapAsync', () => {
    it('should return result when operation succeeds', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await errorHandler.wrapAsync(operation);

      expect(result).toBe('success');
    });

    it('should throw error when operation fails', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Async error'));

      await expect(errorHandler.wrapAsync(operation)).rejects.toThrow('Async error');
    });
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getErrorHandler', () => {
    it('should return singleton instance', () => {
      const handler1 = getErrorHandler();
      const handler2 = getErrorHandler();

      expect(handler1).toBe(handler2);
    });

    it('should create new instance with config', () => {
      const config = { component: 'TestComponent' };
      const handler = getErrorHandler(config);

      expect(handler).toBeInstanceOf(ApiErrorHandler);
    });
  });

  describe('createSanitizedErrorResponse', () => {
    it('should create sanitized error response', () => {
      const error = new Error('Test error');
      const response = createSanitizedErrorResponse(error, 'Default message', 400);

      expect(response.data.ok).toBe(false);
      expect(response.data.error.message).toBe(
        'An unexpected error occurred. Please try again later.'
      ); // User-friendly message
      expect(response.status).toBe(500); // Generic errors default to 500, status parameter is overridden by error type detection
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response', () => {
      const data = { id: 1 };
      const response = createSuccessResponse(data, 'Success', 201);

      expect(response.data.ok).toBe(true);
      expect(response.data.data).toBe(data);
      expect(response.data.message).toBe('Success');
      expect(response.status).toBe(201);
    });
  });

  describe('withErrorHandler', () => {
    it('should wrap handler with error handling', async () => {
      const handler = jest.fn().mockResolvedValue({ data: 'success' });
      const wrappedHandler = withErrorHandler(handler);

      const result = await wrappedHandler();

      expect(result).toEqual({ data: 'success' });
    });
  });
});

describe('Error Handler Integration', () => {
  describe('with real error types', () => {
    it('should handle ZodError correctly', () => {
      const zodError = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: 'Expected string, received number',
        },
      ]);

      const response = createSanitizedErrorResponse(zodError);

      expect(response.data.error.code).toBe(ErrorCodes.VALIDATION.INVALID_INPUT);
      expect(response.data.error.message).toBe('Please check your input and try again.'); // User-friendly message
      expect(response.status).toBe(400); // Validation errors should return 400 status
    });

    it('should handle Prisma errors correctly', () => {
      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';
      (prismaError as any).meta = { target: ['email'] };

      const response = createSanitizedErrorResponse(prismaError);

      expect(response.data.error.code).toBe(ErrorCodes.SYSTEM.UNKNOWN); // Generic error code for unrecognized error types
      expect(response.data.error.message).toBe(
        'An unexpected error occurred. Please try again later.'
      );
    });

    it('should handle network errors', () => {
      const networkError = new Error('Network request failed');
      (networkError as any).code = ErrorCodes.API.NETWORK_ERROR;

      const response = createSanitizedErrorResponse(networkError);

      expect(response.data.error.code).toBe(ErrorCodes.SYSTEM.UNKNOWN); // Generic error code for unrecognized error types
      expect(response.data.error.message).toBe(
        'An unexpected error occurred. Please try again later.'
      );
    });
  });

  describe('with different environments', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should include details in development', () => {
      process.env.NODE_ENV = 'development';

      // Create a new instance directly to avoid singleton caching
      const handler = new ApiErrorHandler({ includeDetails: true });
      const error = new Error('Development error');

      const response = handler.createErrorResponse(error);

      // Details should be included since the handler is configured with includeDetails: true
      expect(response.data.error.details).toBeDefined();
    });

    it('should not include stack traces in production', () => {
      process.env.NODE_ENV = 'production';

      const handler = getErrorHandler({ includeDetails: false });
      const error = new Error('Production error');

      const response = handler.createErrorResponse(error);

      expect(response.data.error.details).toBeUndefined();
    });
  });

  describe('with custom error codes', () => {
    it('should handle business logic errors', () => {
      const businessError = new StandardError({
        message: 'Business rule violation',
        code: ErrorCodes.BUSINESS.INVALID_OPERATION,
      });

      const response = createSanitizedErrorResponse(businessError);

      expect(response.data.error.code).toBe(ErrorCodes.BUSINESS.INVALID_OPERATION);
      expect(response.data.error.message).toBe('Unable to complete the requested operation.'); // User-friendly message
    });

    it('should handle user-friendly messages', () => {
      const error = new StandardError({
        message: 'Database connection failed',
        code: ErrorCodes.DATA.TIMEOUT,
      });

      const response = createSanitizedErrorResponse(error);

      expect(response.data.error.message).toBe('There was a problem accessing your data.');
    });
  });
});

describe('Error Handler Performance', () => {
  it('should handle large error objects efficiently', () => {
    const largeError = new Error('Large error');
    (largeError as any).metadata = {
      largeData: Array.from({ length: 1000 }, (_, i) => ({ id: i, data: 'x'.repeat(100) })),
    };

    const startTime = Date.now();
    const response = createSanitizedErrorResponse(largeError);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    expect(response.data.ok).toBe(false);
  });

  it('should handle recursive error structures', () => {
    const recursiveError: any = new Error('Recursive error');
    recursiveError.self = recursiveError;

    const response = createSanitizedErrorResponse(recursiveError);

    expect(response.data.ok).toBe(false);
    expect(response.data.error.message).toBe(
      'An unexpected error occurred. Please try again later.'
    ); // User-friendly message
  });
});
