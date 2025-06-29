/**
 * API Mocking Infrastructure using MSW v2
 *
 * This module provides Mock Service Worker setup for API mocking in tests.
 * It follows our functional programming patterns and TypeScript strict mode.
 *
 * @stage Development
 * @quality-gate Development
 */

import { http, HttpResponse } from 'msw';
import { UserType } from '../../types';

// Define type for handlers to enforce consistent handler patterns
export type MockHandler = (info: {
  request: Request;
  params: Record<string, string>;
}) => Response | Promise<Response>;

// Create reusable response builder with proper types
export const createResponseBuilder = <T>(status: number = 200) => {
  return ({ request, params }: { request: Request; params: Record<string, string> }) => {
    return HttpResponse.json(null, { status });
  };
};

// Success response builder with data
export const successResponse = <T extends Record<string, any>>(data: T) => {
  return ({ request, params }: { request: Request; params: Record<string, string> }) => {
    return HttpResponse.json(data as any, { status: 200 });
  };
};

// Error response builder
export const errorResponse = (
  status: number = 400,
  message: string = 'Bad Request',
  type?: string
) => {
  const errorType = type || getErrorTypeFromStatus(status);
  return ({ request, params }: { request: Request; params: Record<string, string> }) => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          type: errorType,
          message,
          status,
        },
      },
      { status }
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
export const createGetHandler = <T extends Record<string, any>>(path: string, responseData: T) => {
  return http.get(path, ({ request, params }) => {
    return HttpResponse.json(responseData as any, { status: 200 });
  });
};

export const createPostHandler = <T extends Record<string, any>, B = any>(
  path: string,
  responseData: T,
  validator?: (body: B) => boolean
) => {
  return http.post(path, async ({ request, params }) => {
    const body = (await request.json()) as B;
    if (validator && !validator(body)) {
      return HttpResponse.json({ message: 'Validation Error' }, { status: 400 });
    }
    return HttpResponse.json(responseData as any, { status: 200 });
  });
};

// Define auth request body type for type safety
interface AuthRequestBody {
  email?: string;
  password?: string;
  [key: string]: any;
}

// Specific handler for authentication endpoints that can simulate both success and failure
export const createAuthHandler = <T extends Record<string, any>>(
  path: string,
  successData: T,
  failureMessage: string = 'Invalid credentials'
) => {
  return http.post(path, async ({ request, params }) => {
    // Type cast to AuthRequestBody to ensure type safety
    const body = (await request.json()) as AuthRequestBody;

    // Check for test credentials that should trigger auth failure
    if (
      (body.email === 'test@example.com' && body.password === 'wrong-password') ||
      body.password === 'invalid-password'
    ) {
      return HttpResponse.json({ message: failureMessage }, { status: 401 });
    }

    // Otherwise return success
    return HttpResponse.json(successData as any, { status: 200 });
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
  customers: {
    list: {
      success: true,
      data: [
        {
          id: 'customer-1',
          name: 'Acme Corp',
          email: 'contact@acme.com',
        },
      ],
    },
  },
  products: {
    list: {
      success: true,
      data: [
        {
          id: 'product-1',
          name: 'Product A',
          price: 100,
        },
      ],
    },
  },
};

// Mock HTTP client implementation
export const createMockHttpClient = (): MockHttpClient => ({
  get: (url: string, config?: Record<string, unknown>) => {
    // Simple URL-based mock responses
    if (url.includes('/auth/user')) {
      return createMockResponse(mockApiResponses.auth.login.data.user);
    }
    if (url.includes('/proposals')) {
      return createMockResponse(mockApiResponses.proposals.list.data);
    }
    if (url.includes('/customers')) {
      return createMockResponse(mockApiResponses.customers.list.data);
    }
    if (url.includes('/products')) {
      return createMockResponse(mockApiResponses.products.list.data);
    }
    return createMockResponse();
  },

  post: (url: string, data?: unknown, config?: Record<string, unknown>) => {
    if (url.includes('/auth/login')) {
      return createMockResponse(mockApiResponses.auth.login);
    }
    if (url.includes('/proposals')) {
      return createMockResponse(mockApiResponses.proposals.create);
    }
    return createMockResponse();
  },

  put: (url: string, data?: unknown, config?: Record<string, unknown>) => {
    return createMockResponse();
  },

  delete: (url: string, config?: Record<string, unknown>) => {
    return createMockResponse();
  },
});

// Setup function for API mocks in tests
export const setupApiMocks = () => {
  return [
    // Health check endpoint
    http.get('*', ({ request, params }) => {
      console.log(`Unhandled GET request to: ${request.url}`);
      return HttpResponse.json({ message: 'Not Found' }, { status: 404 });
    }),

    http.post('*', ({ request, params }) => {
      console.log(`Unhandled POST request to: ${request.url}`);
      return HttpResponse.json({ message: 'Not Found' }, { status: 404 });
    }),
  ];
};
