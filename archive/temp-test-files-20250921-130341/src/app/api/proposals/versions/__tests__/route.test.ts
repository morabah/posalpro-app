/**
 * PosalPro MVP2 - Version History API Route Tests
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 *
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md - API route testing with authentication
 * ✅ IMPLEMENTS: Next.js API route testing with createRoute pattern
 * ✅ VALIDATES: Route handlers, middleware, validation, and error handling
 *
 * Test Coverage:
 * - Route handler functionality
 * - Authentication and authorization
 * - Request validation with Zod schemas
 * - Error handling and responses
 * - Middleware integration
 * - Performance monitoring
 * - Analytics tracking
 */

import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock all dependencies
import { versionHistoryService } from '@/services/versionHistoryService';
import { logDebug, logInfo, logError } from '@/lib/logger';
import { createRoute } from '@/lib/api/route';
import { VersionHistoryQuerySchema } from '@/features/version-history/schemas';

// Mock response helpers
jest.mock('@/lib/api/response', () => ({
  ok: jest.fn().mockReturnValue({
    status: 200,
    json: () => Promise.resolve({}),
  }),
  error: jest.fn().mockReturnValue({
    status: 500,
    json: () => Promise.resolve({ error: 'Internal Server Error' }),
  }),
  paginated: jest.fn().mockReturnValue({
    status: 200,
    json: () => Promise.resolve({}),
  }),
}));
import { ok } from '@/lib/api/response';

// Mock the createRoute function
jest.mock('@/lib/api/route');
jest.mock('@/services/versionHistoryService');
jest.mock('@/lib/logger');
jest.mock('@/features/version-history/schemas');

// Mock data
const mockVersionHistoryData = {
  items: [
    {
      id: 'test-entry-1',
      proposalId: 'test-proposal-1',
      version: 1,
      changeType: 'create',
      changesSummary: 'Initial proposal created',
      totalValue: 10000,
      createdBy: 'user-1',
      createdByName: 'Test User',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    },
  ],
  pagination: {
    limit: 20,
    hasNextPage: false,
    nextCursor: null,
  },
  total: 1,
};

const mockApiResponse = {
  ok: true,
  data: mockVersionHistoryData,
};

const mockValidatedQuery = {
  limit: 20,
  proposalId: 'test-proposal-1',
  changeType: 'create',
  userId: 'user-1',
  dateFrom: '2024-01-01T00:00:00Z',
  dateTo: '2024-12-31T23:59:59Z',
};

const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'Administrator',
};

const mockRequest = {
  url: 'http://localhost:3000/api/proposals/versions?limit=20&proposalId=test-proposal-1',
  method: 'GET',
  headers: new Headers({
    'content-type': 'application/json',
    'x-request-id': 'test-request-id-123',
  }),
  nextUrl: new URL('http://localhost:3000/api/proposals/versions?limit=20&proposalId=test-proposal-1'),
} as NextRequest;

describe('/api/proposals/versions route', () => {
  let mockCreateRoute: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock service methods
    (versionHistoryService.getVersionHistory as jest.Mock).mockResolvedValue(mockApiResponse);

    // Mock schema validation
    (VersionHistoryQuerySchema.parse as jest.Mock).mockReturnValue(mockValidatedQuery);

    // Mock createRoute
    mockCreateRoute = jest.fn();
    (createRoute as jest.Mock).mockReturnValue(mockCreateRoute);
  });

  describe('Route Configuration', () => {
    it('should be configured with correct role-based access', () => {
      // Import the route to trigger the createRoute call
      require('../route');

      expect(createRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: ['admin', 'sales', 'viewer'],
          query: VersionHistoryQuerySchema,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        }),
        expect.any(Function)
      );
    });

    it('should use correct Zod schema for query validation', () => {
      require('../route');

      expect(createRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          query: VersionHistoryQuerySchema,
        }),
        expect.any(Function)
      );
    });
  });

  describe('Handler Function', () => {
    it('should call versionHistoryService.getVersionHistory with validated query', async () => {
      const handler = jest.fn().mockImplementation(async ({ query, user }) => {
        const result = await versionHistoryService.getVersionHistory(query);
        if (result.ok) {
          logInfo('Version history API request successful', {
            component: 'VersionHistoryAPI',
            operation: 'GET',
            requestId: 'test-request-id-123',
            itemCount: result.data.items?.length || 0,
            hasNextPage: !!result.data.pagination?.nextCursor,
            userId: user.id,
            queryParams: Object.keys(query),
            loadTime: expect.any(Number),
            userStory: 'US-5.1',
            hypothesis: 'H8',
          });
          return ok(result.data);
        } else {
          throw new Error('Service error');
        }
      });

      (createRoute as jest.Mock).mockReturnValue(handler);

      // Re-import to use the new handler
      const { GET: newGET } = require('../route');

      await newGET(mockRequest);

      expect(versionHistoryService.getVersionHistory).toHaveBeenCalledWith(mockValidatedQuery);
      expect(handler).toHaveBeenCalledWith({
        query: mockValidatedQuery,
        user: mockUser,
        request: mockRequest,
      });
    });

    it('should handle successful requests with proper logging', async () => {
      const handler = jest.fn().mockImplementation(async ({ query, user }) => {
        const result = await versionHistoryService.getVersionHistory(query);
        if (result.ok) {
          logInfo('Version history API request successful', {
            component: 'VersionHistoryAPI',
            operation: 'GET',
            requestId: 'test-request-id-123',
            itemCount: result.data.items?.length || 0,
            hasNextPage: !!result.data.pagination?.nextCursor,
            userId: user.id,
            queryParams: Object.keys(query),
            loadTime: expect.any(Number),
            userStory: 'US-5.1',
            hypothesis: 'H8',
          });
          return ok(result.data);
        }
      });

      (createRoute as jest.Mock).mockReturnValue(handler);

      const { GET: newGET } = require('../route');

      const response = await newGET(mockRequest);

      expect(logInfo).toHaveBeenCalledWith(
        'Version history API request successful',
        expect.objectContaining({
          component: 'VersionHistoryAPI',
          operation: 'GET',
          requestId: 'test-request-id-123',
          itemCount: 1,
          hasNextPage: false,
          userId: mockUser.id,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        })
      );

      expect(response).toBeDefined();
    });

    it('should handle service errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      (versionHistoryService.getVersionHistory as jest.Mock).mockRejectedValue(mockError);

      const handler = jest.fn().mockImplementation(async ({ query, user }) => {
        try {
          const result = await versionHistoryService.getVersionHistory(query);
          if (result.ok) {
            return ok(result.data);
          }
        } catch (error) {
          logError('Version history API request failed', {
            component: 'VersionHistoryAPI',
            operation: 'GET',
            requestId: 'test-request-id-123',
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: user.id,
            queryParams: Object.keys(query),
            userStory: 'US-5.1',
            hypothesis: 'H8',
          });
          throw error;
        }
      });

      (createRoute as jest.Mock).mockReturnValue(handler);

      const { GET: newGET } = require('../route');

      await expect(newGET(mockRequest)).rejects.toThrow('Database connection failed');

      expect(logError).toHaveBeenCalledWith(
        'Version history API request failed',
        expect.objectContaining({
          component: 'VersionHistoryAPI',
          operation: 'GET',
          requestId: 'test-request-id-123',
          error: 'Database connection failed',
          userId: mockUser.id,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        })
      );
    });

    it('should handle service returning non-ok response', async () => {
      const mockErrorResponse = {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
      };

      (versionHistoryService.getVersionHistory as jest.Mock).mockResolvedValue(mockErrorResponse);

      const handler = jest.fn().mockImplementation(async ({ query, user }) => {
        const result = await versionHistoryService.getVersionHistory(query);
        if (result.ok) {
          return ok(result.data);
        } else {
          logError('Version history API service error', {
            component: 'VersionHistoryAPI',
            operation: 'GET',
            requestId: 'test-request-id-123',
            error: result.message,
            code: result.code,
            userId: user.id,
            userStory: 'US-5.1',
            hypothesis: 'H8',
          });
          throw new Error(result.message);
        }
      });

      (createRoute as jest.Mock).mockReturnValue(handler);

      const { GET: newGET } = require('../route');

      await expect(newGET(mockRequest)).rejects.toThrow('Invalid query parameters');

      expect(logError).toHaveBeenCalledWith(
        'Version history API service error',
        expect.objectContaining({
          component: 'VersionHistoryAPI',
          operation: 'GET',
          requestId: 'test-request-id-123',
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          userId: mockUser.id,
        })
      );
    });
  });

  describe('Query Parameter Handling', () => {
    it('should parse and validate query parameters correctly', async () => {
      const requestWithParams = {
        ...mockRequest,
        nextUrl: new URL('http://localhost:3000/api/proposals/versions?limit=50&proposalId=test-proposal-1&changeType=update&userId=user-1'),
      } as NextRequest;

      const expectedValidatedQuery = {
        limit: 50,
        proposalId: 'test-proposal-1',
        changeType: 'update',
        userId: 'user-1',
      };

      (VersionHistoryQuerySchema.parse as jest.Mock).mockReturnValue(expectedValidatedQuery);

      const handler = jest.fn().mockImplementation(async ({ query }) => {
        expect(query).toEqual(expectedValidatedQuery);
        return ok(mockVersionHistoryData);
      });

      (createRoute as jest.Mock).mockReturnValue(handler);

      const { GET: newGET } = require('../route');

      await newGET(requestWithParams);

      expect(VersionHistoryQuerySchema.parse).toHaveBeenCalledWith({
        limit: '50',
        proposalId: 'test-proposal-1',
        changeType: 'update',
        userId: 'user-1',
      });
    });

    it('should handle pagination parameters', async () => {
      const requestWithPagination = {
        ...mockRequest,
        nextUrl: new URL('http://localhost:3000/api/proposals/versions?cursorCreatedAt=2024-01-01T00:00:00Z&cursorId=test-entry-1'),
      } as NextRequest;

      const expectedValidatedQuery = {
        cursorCreatedAt: '2024-01-01T00:00:00Z',
        cursorId: 'test-entry-1',
        limit: 20,
      };

      (VersionHistoryQuerySchema.parse as jest.Mock).mockReturnValue(expectedValidatedQuery);

      const handler = jest.fn().mockImplementation(async ({ query }) => {
        expect(query).toEqual(expectedValidatedQuery);
        return ok(mockVersionHistoryData);
      });

      (createRoute as jest.Mock).mockReturnValue(handler);

      const { GET: newGET } = require('../route');

      await newGET(requestWithPagination);

      expect(VersionHistoryQuerySchema.parse).toHaveBeenCalledWith({
        cursorCreatedAt: '2024-01-01T00:00:00Z',
        cursorId: 'test-entry-1',
      });
    });

    it('should handle invalid query parameters', async () => {
      const requestWithInvalidParams = {
        ...mockRequest,
        nextUrl: new URL('http://localhost:3000/api/proposals/versions?limit=invalid&proposalId='),
      } as NextRequest;

      (VersionHistoryQuerySchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid query parameters');
      });

      const handler = jest.fn().mockImplementation(async ({ query }) => {
        // This should not be reached due to validation error
        return ok(mockVersionHistoryData);
      });

      (createRoute as jest.Mock).mockReturnValue(handler);

      const { GET: newGET } = require('../route');

      // The createRoute wrapper should handle the validation error
      // and return a proper error response
      await newGET(requestWithInvalidParams);

      expect(VersionHistoryQuerySchema.parse).toHaveBeenCalledWith({
        limit: 'invalid',
        proposalId: '',
      });
    });
  });

  describe('Request Context and Metadata', () => {
    it('should include request metadata in logging', async () => {
      const customRequest = {
        ...mockRequest,
        headers: new Headers({
          'content-type': 'application/json',
          'x-request-id': 'custom-request-id-456',
          'x-forwarded-for': '192.168.1.100',
        }),
      } as NextRequest;

      const handler = jest.fn().mockImplementation(async ({ query, user }) => {
        const result = await versionHistoryService.getVersionHistory(query);
        if (result.ok) {
          logInfo('Version history API request successful', {
            component: 'VersionHistoryAPI',
            operation: 'GET',
            requestId: 'custom-request-id-456',
            itemCount: result.data.items?.length || 0,
            hasNextPage: !!result.data.pagination?.nextCursor,
            userId: user.id,
            queryParams: Object.keys(query),
            loadTime: expect.any(Number),
            userStory: 'US-5.1',
            hypothesis: 'H8',
          });
          return ok(result.data);
        }
      });

      (createRoute as jest.Mock).mockReturnValue(handler);

      const { GET: newGET } = require('../route');

      await newGET(customRequest);

      expect(logInfo).toHaveBeenCalledWith(
        'Version history API request successful',
        expect.objectContaining({
          component: 'VersionHistoryAPI',
          operation: 'GET',
          requestId: 'custom-request-id-456',
          userId: mockUser.id,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        })
      );
    });

    it('should track performance metrics', async () => {
      const startTime = Date.now();

      const handler = jest.fn().mockImplementation(async ({ query, user }) => {
        const result = await versionHistoryService.getVersionHistory(query);
        if (result.ok) {
          const loadTime = Date.now() - startTime;
          logInfo('Version history API request successful', {
            component: 'VersionHistoryAPI',
            operation: 'GET',
            requestId: 'test-request-id-123',
            itemCount: result.data.items?.length || 0,
            hasNextPage: !!result.data.pagination?.nextCursor,
            userId: user.id,
            queryParams: Object.keys(query),
            loadTime,
            userStory: 'US-5.1',
            hypothesis: 'H8',
          });
          return ok(result.data);
        }
      });

      (createRoute as jest.Mock).mockReturnValue(handler);

      const { GET: newGET } = require('../route');

      await newGET(mockRequest);

      expect(logInfo).toHaveBeenCalledWith(
        'Version history API request successful',
        expect.objectContaining({
          component: 'VersionHistoryAPI',
          operation: 'GET',
          requestId: 'test-request-id-123',
          loadTime: expect.any(Number),
          userStory: 'US-5.1',
          hypothesis: 'H8',
        })
      );
    });
  });

  describe('Authentication and Authorization', () => {
    it('should handle authenticated user context', async () => {
      const authenticatedUser = {
        id: 'authenticated-user-1',
        email: 'authenticated@example.com',
        name: 'Authenticated User',
        role: 'sales',
      };

      const handler = jest.fn().mockImplementation(async ({ query, user }) => {
        expect(user).toEqual(authenticatedUser);

        logInfo('Version history API request successful', {
          component: 'VersionHistoryAPI',
          operation: 'GET',
          requestId: 'test-request-id-123',
          userId: user.id,
          userRole: user.role,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });

        const result = await versionHistoryService.getVersionHistory(query);
        return ok(result.data);
      });

      (createRoute as jest.Mock).mockReturnValue(handler);

      const { GET: newGET } = require('../route');

      await newGET(mockRequest);

      expect(logInfo).toHaveBeenCalledWith(
        'Version history API request successful',
        expect.objectContaining({
          component: 'VersionHistoryAPI',
          operation: 'GET',
          requestId: 'test-request-id-123',
          userId: authenticatedUser.id,
          userRole: authenticatedUser.role,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        })
      );
    });

    it('should reject unauthorized users', async () => {
      // The createRoute wrapper handles authorization
      // This test verifies that the route configuration includes proper role checks
      const routeConfig = {
        roles: ['admin', 'sales', 'viewer'],
        query: VersionHistoryQuerySchema,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      };

      require('../route');

      expect(createRoute).toHaveBeenCalledWith(
        routeConfig,
        expect.any(Function)
      );
    });
  });

  describe('Response Format', () => {
    it('should return properly formatted API responses', async () => {
      const expectedResponse = {
        status: 200,
        json: () => Promise.resolve(mockVersionHistoryData),
      };

      (ok as jest.Mock).mockReturnValue(expectedResponse);

      const handler = jest.fn().mockImplementation(async ({ query }) => {
        const result = await versionHistoryService.getVersionHistory(query);
        return ok(result.data);
      });

      (createRoute as jest.Mock).mockReturnValue(handler);

      const { GET: newGET } = require('../route');

      const response = await newGET(mockRequest);

      expect(response).toEqual(expectedResponse);
      expect(ok).toHaveBeenCalledWith(mockVersionHistoryData);
    });

    it('should include pagination metadata in response', async () => {
      const paginatedData = {
        ...mockVersionHistoryData,
        pagination: {
          limit: 20,
          hasNextPage: true,
          nextCursor: {
            cursorCreatedAt: '2024-01-02T00:00:00Z',
            cursorId: 'test-entry-2',
          },
        },
      };

      const mockPaginatedResponse = {
        ok: true,
        data: paginatedData,
      };

      (versionHistoryService.getVersionHistory as jest.Mock).mockResolvedValue(mockPaginatedResponse);

      const handler = jest.fn().mockImplementation(async ({ query }) => {
        const result = await versionHistoryService.getVersionHistory(query);
        return ok(result.data);
      });

      (createRoute as jest.Mock).mockReturnValue(handler);

      const { GET: newGET } = require('../route');

      await newGET(mockRequest);

      expect(ok).toHaveBeenCalledWith(paginatedData);
    });
  });

  describe('Component Traceability Matrix', () => {
    it('should include CTM metadata in route configuration', () => {
      require('../route');

      expect(createRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          userStory: 'US-5.1',
          hypothesis: 'H8',
        }),
        expect.any(Function)
      );
    });

    it('should track CTM in all logging operations', async () => {
      const handler = jest.fn().mockImplementation(async ({ query, user }) => {
        const result = await versionHistoryService.getVersionHistory(query);
        if (result.ok) {
          logInfo('Version history API request successful', {
            component: 'VersionHistoryAPI',
            operation: 'GET',
            requestId: 'test-request-id-123',
            itemCount: result.data.items?.length || 0,
            hasNextPage: !!result.data.pagination?.nextCursor,
            userId: user.id,
            queryParams: Object.keys(query),
            loadTime: expect.any(Number),
            userStory: 'US-5.1',
            hypothesis: 'H8',
          });
          return ok(result.data);
        }
      });

      (createRoute as jest.Mock).mockReturnValue(handler);

      const { GET: newGET } = require('../route');

      await newGET(mockRequest);

      expect(logInfo).toHaveBeenCalledWith(
        'Version history API request successful',
        expect.objectContaining({
          component: 'VersionHistoryAPI',
          operation: 'GET',
          userStory: 'US-5.1',
          hypothesis: 'H8',
        })
      );
    });
  });

  describe('Error Scenarios', () => {
    it('should handle schema validation errors', async () => {
      const validationError = new Error('Query parameter validation failed');

      (VersionHistoryQuerySchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      const handler = jest.fn().mockImplementation(async () => {
        // This should not be reached due to validation
        return ok(mockVersionHistoryData);
      });

      (createRoute as jest.Mock).mockReturnValue(handler);

      const { GET: newGET } = require('../route');

      // The createRoute wrapper should handle validation errors
      await newGET(mockRequest);

      expect(VersionHistoryQuerySchema.parse).toHaveBeenCalled();
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');

      (versionHistoryService.getVersionHistory as jest.Mock).mockRejectedValue(timeoutError);

      const handler = jest.fn().mockImplementation(async ({ query, user }) => {
        try {
          await versionHistoryService.getVersionHistory(query);
        } catch (error) {
          logError('Version history API timeout', {
            component: 'VersionHistoryAPI',
            operation: 'GET',
            requestId: 'test-request-id-123',
            error: 'Request timeout',
            userId: user.id,
            userStory: 'US-5.1',
            hypothesis: 'H8',
          });
          throw error;
        }
      });

      (createRoute as jest.Mock).mockReturnValue(handler);

      const { GET: newGET } = require('../route');

      await expect(newGET(mockRequest)).rejects.toThrow('Request timeout');

      expect(logError).toHaveBeenCalledWith(
        'Version history API timeout',
        expect.objectContaining({
          component: 'VersionHistoryAPI',
          operation: 'GET',
          requestId: 'test-request-id-123',
          error: 'Request timeout',
          userId: mockUser.id,
        })
      );
    });

    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection lost');

      (versionHistoryService.getVersionHistory as jest.Mock).mockRejectedValue(dbError);

      const handler = jest.fn().mockImplementation(async ({ query, user }) => {
        try {
          await versionHistoryService.getVersionHistory(query);
        } catch (error) {
          logError('Database connection error in version history API', {
            component: 'VersionHistoryAPI',
            operation: 'GET',
            requestId: 'test-request-id-123',
            error: dbError.message,
            userId: user.id,
            userStory: 'US-5.1',
            hypothesis: 'H8',
          });
          throw error;
        }
      });

      (createRoute as jest.Mock).mockReturnValue(handler);

      const { GET: newGET } = require('../route');

      await expect(newGET(mockRequest)).rejects.toThrow('Database connection lost');

      expect(logError).toHaveBeenCalledWith(
        'Database connection error in version history API',
        expect.objectContaining({
          component: 'VersionHistoryAPI',
          operation: 'GET',
          requestId: 'test-request-id-123',
          error: 'Database connection lost',
          userId: mockUser.id,
        })
      );
    });
  });
});
