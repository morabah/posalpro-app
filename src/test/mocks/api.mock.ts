/**
 * API Mocking Infrastructure using MSW
 *
 * This module provides Mock Service Worker setup for API mocking in tests.
 * It follows our functional programming patterns and TypeScript strict mode.
 *
 * @stage Development
 * @quality-gate Development
 */

import { UserType } from '@/types';
import type { DefaultBodyType } from 'msw';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Define type for handlers to enforce consistent handler patterns
export type MockHandler =
  | Parameters<typeof http.get>[1]
  | Parameters<typeof http.post>[1]
  | Parameters<typeof http.put>[1]
  | Parameters<typeof http.delete>[1];

// Create reusable response builder with proper types
export const createResponseBuilder = <T extends DefaultBodyType>(status: number = 200) => {
  return () => {
    return HttpResponse.json(null, { status, statusText: 'OK' });
  };
};

// Success response builder with data
export const successResponse = <T extends DefaultBodyType>(data: T) => {
  return () => {
    return HttpResponse.json(data, { status: 200, statusText: 'OK' });
  };
};

// Error response builder
export const errorResponse = (status: number = 400, message: string = 'Bad Request') => {
  return () => {
    return HttpResponse.json({ error: message }, { status, statusText: message });
  };
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
  return http.get(path, () => {
    return successResponse(responseData)();
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
  return http.post(path, async ({ request }) => {
    const body = (await request.json()) as B;
    if (validator && !validator(body)) {
      return errorResponse(400, 'Validation Error')();
    }
    return successResponse(responseData)();
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
  return http.post(path, async ({ request }) => {
    // Type cast to AuthRequestBody to ensure type safety
    const body = (await request.json()) as AuthRequestBody;

    // Check for test credentials that should trigger auth failure
    if (
      (body.email === 'test@example.com' && body.password === 'wrong-password') ||
      body.password === 'invalid-password'
    ) {
      return errorResponse(401, failureMessage)();
    }

    // Otherwise return success
    return successResponse(successData)();
  });
};

// Default handlers that can be extended in tests
export const defaultHandlers = [
  // API health endpoint
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'healthy' }, { status: 200 });
  }),

  // Authentication endpoints
  createAuthHandler<{ token: string; user: { id: string; email: string; role: string } }>(
    '/api/auth/login',
    {
      token: 'mock-jwt-token',
      user: {
        id: '123',
        email: 'test@example.com',
        role: 'Technical SME',
      },
    },
    'Invalid email or password. Please try again.'
  ),
];

// Create and export the server instance
export const server = setupServer(...defaultHandlers);

// Setup functions to start/stop the server in tests
export const setupApiMocks = () => {
  // Start the server before all tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

  // Reset handlers after each test
  afterEach(() => server.resetHandlers());

  // Close the server after all tests
  afterAll(() => server.close());
};

// Helper to add temporary handlers for specific tests
export const addTemporaryHandlers = (...handlers: ReturnType<typeof http.get>[]) => {
  beforeEach(() => {
    server.use(...handlers);
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
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
      },
    },
  },
  dashboard: {
    data: {
      success: true,
      data: {
        widgets: [
          {
            id: 'proposal-overview',
            data: {
              totalProposals: 5,
              activeProposals: 3,
              completedProposals: 2,
            },
          },
        ],
      },
    },
  },
};

// Setup global API mocks
export const setupApiMocksGlobal = () => {
  global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
    // Parse URL to determine endpoint
    const urlPath = typeof url === 'string' ? url : url.toString();

    // Auth endpoints
    if (urlPath.includes('/api/auth/login')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponses.auth.login),
      });
    }

    if (urlPath.includes('/api/auth/logout')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponses.auth.logout),
      });
    }

    // Proposal endpoints
    if (urlPath.includes('/api/proposals') && options?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockApiResponses.proposals.create),
      });
    }

    if (urlPath.includes('/api/proposals') && (!options?.method || options.method === 'GET')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponses.proposals.list),
      });
    }

    // Dashboard endpoints
    if (urlPath.includes('/api/dashboard')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponses.dashboard.data),
      });
    }

    // Default successful response
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: {} }),
    });
  });
};

// Cleanup mocks
export const cleanupApiMocks = () => {
  jest.restoreAllMocks();
};

// Mock specific API failures
export const mockApiFailure = (endpoint: string, error: string) => {
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url.includes(endpoint)) {
      return Promise.reject(new Error(error));
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });
  });
};
