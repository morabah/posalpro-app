/**
 * API Mocking Infrastructure using MSW
 *
 * This module provides Mock Service Worker setup for API mocking in tests.
 * It follows our functional programming patterns and TypeScript strict mode.
 *
 * @stage Development
 * @quality-gate Development
 */

import type { DefaultBodyType, RestContext, RestRequest } from 'msw';
import { rest } from 'msw';
import { UserType } from '../../types';

// Define type for handlers to enforce consistent handler patterns
export type MockHandler = (req: RestRequest, res: any, ctx: RestContext) => any;

// Create reusable response builder with proper types
export const createResponseBuilder = <T extends DefaultBodyType>(status: number = 200) => {
  return (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.status(status), ctx.json(null));
  };
};

// Success response builder with data
export const successResponse = <T extends DefaultBodyType>(data: T) => {
  return (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.status(200), ctx.json(data));
  };
};

// Error response builder
export const errorResponse = (
  status: number = 400,
  message: string = 'Bad Request',
  type?: string
) => {
  const errorType = type || getErrorTypeFromStatus(status);
  return (req: RestRequest, res: any, ctx: RestContext) => {
    return res(
      ctx.status(status),
      ctx.json({
        success: false,
        error: {
          type: errorType,
          message,
          status,
        },
      })
    );
  };
};

// Helper function to determine error type from status code
const getErrorTypeFromStatus = (status: number): string => {
  switch (status) {
    case 400:
      return 'validation_error';
    case 401:
      return 'authentication_failed';
    case 403:
      return 'authorization_failed';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 429:
      return 'rate_limit_exceeded';
    case 500:
      return 'internal_server_error';
    default:
      return 'unknown_error';
  }
};

// Auth error (401) response
export const unauthorizedResponse = () => {
  return errorResponse(401, 'Unauthorized');
};

// Server error (500) response
export const serverErrorResponse = () => {
  return errorResponse(500, 'Internal Server Error');
};

// Create a generic handler creator for common endpoints
export const createGetHandler = <T extends DefaultBodyType>(path: string, responseData: T) => {
  return rest.get(path, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(responseData));
  });
};

export const createPostHandler = <
  T extends DefaultBodyType,
  B extends DefaultBodyType = DefaultBodyType,
>(
  path: string,
  responseData: T,
  validator?: (body: B) => boolean
) => {
  return rest.post(path, async (req, res, ctx) => {
    const body = (await req.json()) as B;
    if (validator && !validator(body)) {
      return res(ctx.status(400), ctx.json({ message: 'Validation Error' }));
    }
    return res(ctx.status(200), ctx.json(responseData));
  });
};

// Define auth request body type for type safety
interface AuthRequestBody {
  email?: string;
  password?: string;
  [key: string]: any;
}

// Specific handler for authentication endpoints that can simulate both success and failure
export const createAuthHandler = <T extends DefaultBodyType>(
  path: string,
  successData: T,
  failureMessage: string = 'Invalid credentials'
) => {
  return rest.post(path, async (req, res, ctx) => {
    // Type cast to AuthRequestBody to ensure type safety
    const body = (await req.json()) as AuthRequestBody;

    // Check for test credentials that should trigger auth failure
    if (
      (body.email === 'test@example.com' && body.password === 'wrong-password') ||
      body.password === 'invalid-password'
    ) {
      return res(ctx.status(401), ctx.json({ message: failureMessage }));
    }

    // Otherwise return success
    return res(ctx.status(200), ctx.json(successData));
  });
};

// Mock HTTP client interface
interface MockHttpClient {
  get: (url: string, config?: Record<string, unknown>) => Promise<unknown>;
  post: (url: string, data?: unknown, config?: Record<string, unknown>) => Promise<unknown>;
  put: (url: string, data?: unknown, config?: Record<string, unknown>) => Promise<unknown>;
  delete: (url: string, config?: Record<string, unknown>) => Promise<unknown>;
}

// Mock response factory
export function createMockResponse(data: unknown = null, status = 200) {
  return Promise.resolve({
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {},
  });
}

// Mock API responses
export const mockApiResponses = {
  auth: {
    login: {
      success: true,
      data: {
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: UserType.PROPOSAL_MANAGER,
        },
        token: 'mock-jwt-token',
      },
    },
    logout: {
      success: true,
    },
  },
  proposals: {
    create: {
      success: true,
      data: {
        id: 'proposal-123',
        title: 'Test Proposal',
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
    },
    list: {
      success: true,
      data: [
        {
          id: 'proposal-1',
          title: 'Proposal 1',
          status: 'draft',
        },
        {
          id: 'proposal-2',
          title: 'Proposal 2',
          status: 'review',
        },
      ],
    },
  },
};

// Setup API mocks for testing
export const setupApiMocks = () => {
  // This function can be used to configure MSW handlers for tests
  // Return the default mock handlers
  return [
    // Auth endpoints
    createAuthHandler('/api/auth/login', mockApiResponses.auth.login),
    createGetHandler('/api/auth/logout', mockApiResponses.auth.logout),

    // Proposal endpoints
    createPostHandler('/api/proposals', mockApiResponses.proposals.create),
    createGetHandler('/api/proposals', mockApiResponses.proposals.list),

    // Default handlers for any other endpoints
    rest.get('*', (req, res, ctx) => {
      console.warn(`Unhandled GET request to ${req.url}`);
      return res(ctx.status(404), ctx.json({ message: 'Not found' }));
    }),
    rest.post('*', (req, res, ctx) => {
      console.warn(`Unhandled POST request to ${req.url}`);
      return res(ctx.status(404), ctx.json({ message: 'Not found' }));
    }),
  ];
};
