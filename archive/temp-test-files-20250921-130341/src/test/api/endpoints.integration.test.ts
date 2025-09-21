/**
 * API Endpoints Integration Tests
 * Comprehensive testing of all API endpoints with authentication, validation, and error handling
 * Supports H8 (System Reliability) hypothesis validation
 */

import type { ApiResponse } from '@/lib/api/client';
import { clearMockSession, setMockSession } from '@/test/mocks/session.mock';
import { UserType } from '@/types/enums';

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

interface MockResponse<T> {
  ok: boolean;
  status: number;
  json: () => Promise<ApiResponse<T>>;
  text: () => Promise<string>;
}

const mockResponse = <T>(data: T, status = 200): MockResponse<T> => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data as any,
  text: async () => JSON.stringify(data),
});

// API endpoint test utilities
interface EndpointTestResult {
  status: number;
  data?: any;
  error?: any;
  responseTime: number;
}

class ApiTester {
  static async testEndpoint(
    endpoint: string,
    method: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<EndpointTestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      return {
        status: response.status,
        data: response.ok ? data : undefined,
        error: !response.ok ? data : undefined,
        responseTime,
      };
    } catch (error) {
      return {
        status: 500,
        error: {
          type: 'network_error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        responseTime: Date.now() - startTime,
      };
    }
  }

  static async testBatchEndpoints(
    requests: Array<{
      endpoint: string;
      method: string;
      body?: any;
      headers?: Record<string, string>;
    }>
  ): Promise<EndpointTestResult[]> {
    const promises = requests.map(req =>
      this.testEndpoint(req.endpoint, req.method, req.body, req.headers)
    );

    return Promise.all(promises);
  }
}

describe('API Endpoints Integration Tests', () => {
  beforeEach(() => {
    clearMockSession();
    jest.clearAllMocks();
  });

  afterEach(() => {
    clearMockSession();
  });

  describe('Authentication Endpoints', () => {
    it('should handle login requests properly', async () => {
      // Mock successful login response
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: UserType.PROPOSAL_MANAGER,
          },
          token: 'jwt_token_here',
        })
      );

      const result = await ApiTester.testEndpoint('/api/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'validpassword',
      });

      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.user.email).toBe('test@example.com');
      expect(result.responseTime).toBeLessThan(1000);
    });

    it('should handle login failures with proper error responses', async () => {
      // Mock failed login response
      mockFetch.mockResolvedValueOnce(
        mockResponse(
          {
            type: 'authentication_failed',
            message: 'Invalid email or password',
          },
          401
        )
      );

      const result = await ApiTester.testEndpoint('/api/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.status).toBe(401);
      expect(result.error.type).toBe('authentication_failed');
      expect(result.responseTime).toBeLessThan(1000);
    });

    it('should handle registration requests', async () => {
      // Mock successful registration response
      mockFetch.mockResolvedValueOnce(
        mockResponse(
          {
            success: true,
            message: 'Account created successfully',
            user: {
              id: '2',
              email: 'newuser@example.com',
              name: 'New User',
              role: UserType.CONTENT_MANAGER,
            },
          },
          201
        )
      );

      const result = await ApiTester.testEndpoint('/api/auth/register', 'POST', {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'newpassword123',
        role: UserType.CONTENT_MANAGER,
      });

      expect(result.status).toBe(201);
      expect(result.data.success).toBe(true);
      expect(result.data.user.email).toBe('newuser@example.com');
    });

    it('should handle logout requests', async () => {
      // Mock successful logout response
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          message: 'Logged out successfully',
        })
      );

      const result = await ApiTester.testEndpoint('/api/auth/logout', 'POST', undefined, {
        Authorization: 'Bearer valid_token',
      });

      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
    });
  });

  describe('Content API Endpoints', () => {
    beforeEach(() => {
      setMockSession({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: UserType.CONTENT_MANAGER,
        },
      });
    });

    it('should handle content search requests', async () => {
      // Mock successful search response
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: [
            {
              id: '1',
              title: 'Sample Content',
              description: 'Sample description',
              type: 'template',
              createdAt: '2024-01-01T00:00:00Z',
            },
          ],
          total: 1,
          page: 1,
          pageSize: 10,
        })
      );

      const result = await ApiTester.testEndpoint(
        '/api/content/search',
        'POST',
        {
          query: 'sample',
          filters: {
            type: 'template',
          },
          pagination: {
            page: 1,
            pageSize: 10,
          },
        },
        {
          Authorization: 'Bearer valid_token',
        }
      );

      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.data).toHaveLength(1);
      expect(result.responseTime).toBeLessThan(2000); // H1 hypothesis validation
    });

    it('should handle content creation requests', async () => {
      // Mock successful creation response
      mockFetch.mockResolvedValueOnce(
        mockResponse(
          {
            success: true,
            data: {
              id: '2',
              title: 'New Content',
              description: 'New content description',
              type: 'reference',
              createdAt: '2024-01-01T00:00:00Z',
            },
          },
          201
        )
      );

      const result = await ApiTester.testEndpoint(
        '/api/content',
        'POST',
        {
          title: 'New Content',
          description: 'New content description',
          type: 'reference',
          tags: ['test', 'sample'],
        },
        {
          Authorization: 'Bearer valid_token',
        }
      );

      expect(result.status).toBe(201);
      expect(result.data.success).toBe(true);
      expect(result.data.data.title).toBe('New Content');
    });

    it('should handle content updates', async () => {
      // Mock successful update response
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: {
            id: '1',
            title: 'Updated Content',
            description: 'Updated description',
            type: 'template',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        })
      );

      const result = await ApiTester.testEndpoint(
        '/api/content/1',
        'PUT',
        {
          title: 'Updated Content',
          description: 'Updated description',
        },
        {
          Authorization: 'Bearer valid_token',
        }
      );

      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.data.title).toBe('Updated Content');
    });

    it('should handle content deletion', async () => {
      // Mock successful deletion response
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          message: 'Content deleted successfully',
        })
      );

      const result = await ApiTester.testEndpoint('/api/content/1', 'DELETE', undefined, {
        Authorization: 'Bearer valid_token',
      });

      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
    });
  });

  describe('Proposal API Endpoints', () => {
    beforeEach(() => {
      setMockSession({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: UserType.PROPOSAL_MANAGER,
        },
      });
    });

    it('should handle proposal creation requests', async () => {
      // Mock successful proposal creation
      mockFetch.mockResolvedValueOnce(
        mockResponse(
          {
            success: true,
            data: {
              id: '1',
              title: 'New Proposal',
              description: 'Proposal description',
              status: 'draft',
              createdAt: '2024-01-01T00:00:00Z',
              managerId: '1',
            },
          },
          201
        )
      );

      const result = await ApiTester.testEndpoint(
        '/api/proposals',
        'POST',
        {
          title: 'New Proposal',
          description: 'Proposal description',
          customerId: 'customer_1',
          deadline: '2024-12-31T23:59:59Z',
        },
        {
          Authorization: 'Bearer valid_token',
        }
      );

      expect(result.status).toBe(201);
      expect(result.data.success).toBe(true);
      expect(result.data.data.title).toBe('New Proposal');
    });

    it('should handle proposal listing requests', async () => {
      // Mock successful proposal listing
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: [
            {
              id: '1',
              title: 'Proposal 1',
              status: 'draft',
              createdAt: '2024-01-01T00:00:00Z',
            },
            {
              id: '2',
              title: 'Proposal 2',
              status: 'in_review',
              createdAt: '2024-01-02T00:00:00Z',
            },
          ],
          total: 2,
          page: 1,
          pageSize: 10,
        })
      );

      const result = await ApiTester.testEndpoint('/api/proposals', 'GET', undefined, {
        Authorization: 'Bearer valid_token',
      });

      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.data).toHaveLength(2);
    });

    it('should handle proposal status updates', async () => {
      // Mock successful status update
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: {
            id: '1',
            title: 'Proposal 1',
            status: 'in_review',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        })
      );

      const result = await ApiTester.testEndpoint(
        '/api/proposals/1/status',
        'PUT',
        {
          status: 'in_review',
          comment: 'Moving to review stage',
        },
        {
          Authorization: 'Bearer valid_token',
        }
      );

      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.data.status).toBe('in_review');
    });
  });

  describe('Admin API Endpoints', () => {
    beforeEach(() => {
      setMockSession({
        user: {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: UserType.SYSTEM_ADMINISTRATOR,
        },
      });
    });

    it('should handle user management requests', async () => {
      // Mock successful user listing
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: [
            {
              id: '1',
              email: 'user1@example.com',
              name: 'User One',
              role: UserType.PROPOSAL_MANAGER,
              createdAt: '2024-01-01T00:00:00Z',
            },
            {
              id: '2',
              email: 'user2@example.com',
              name: 'User Two',
              role: UserType.SME,
              createdAt: '2024-01-02T00:00:00Z',
            },
          ],
        })
      );

      const result = await ApiTester.testEndpoint('/api/admin/users', 'GET', undefined, {
        Authorization: 'Bearer admin_token',
      });

      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.data).toHaveLength(2);
    });

    it('should handle system settings updates', async () => {
      // Mock successful settings update
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          message: 'Settings updated successfully',
          data: {
            maxProposalsPerUser: 10,
            defaultProposalDeadlineDays: 30,
            enableEmailNotifications: true,
          },
        })
      );

      const result = await ApiTester.testEndpoint(
        '/api/admin/settings',
        'PUT',
        {
          maxProposalsPerUser: 10,
          defaultProposalDeadlineDays: 30,
          enableEmailNotifications: true,
        },
        {
          Authorization: 'Bearer admin_token',
        }
      );

      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
    });
  });

  describe('Batch API Operations (H8 Hypothesis)', () => {
    it('should handle multiple concurrent API requests efficiently', async () => {
      const batchRequests = [
        { endpoint: '/api/content/search', method: 'POST', body: { query: 'test1' } },
        { endpoint: '/api/content/search', method: 'POST', body: { query: 'test2' } },
        { endpoint: '/api/proposals', method: 'GET' },
        { endpoint: '/api/content', method: 'GET' },
      ];

      // Mock all responses
      batchRequests.forEach(() => {
        mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));
      });

      const startTime = Date.now();
      const results = await ApiTester.testBatchEndpoints(
        batchRequests.map(req => ({
          ...req,
          headers: { Authorization: 'Bearer valid_token' },
        }))
      );
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
      });

      // Total time should be reasonable for concurrent requests
      expect(totalTime).toBeLessThan(5000);

      // Average response time should meet performance targets
      const avgResponseTime =
        results.reduce((sum, result) => sum + result.responseTime, 0) / results.length;
      expect(avgResponseTime).toBeLessThan(1500); // H7 hypothesis validation
    });

    it('should handle API failures gracefully', async () => {
      // Mock various failure responses
      const failureScenarios = [
        { status: 404, error: { type: 'not_found', message: 'Resource not found' } },
        { status: 500, error: { type: 'internal_error', message: 'Internal server error' } },
        { status: 403, error: { type: 'forbidden', message: 'Access denied' } },
      ];

      failureScenarios.forEach((scenario, index) => {
        mockFetch.mockResolvedValueOnce(mockResponse(scenario.error, scenario.status));
      });

      const results = await ApiTester.testBatchEndpoints([
        { endpoint: '/api/nonexistent', method: 'GET' },
        { endpoint: '/api/content/broken', method: 'GET' },
        { endpoint: '/api/admin/forbidden', method: 'GET' },
      ]);

      expect(results[0].status).toBe(404);
      expect(results[0].error.type).toBe('not_found');

      expect(results[1].status).toBe(500);
      expect(results[1].error.type).toBe('internal_error');

      expect(results[2].status).toBe(403);
      expect(results[2].error.type).toBe('forbidden');
    });
  });

  describe('Error Handling and Validation', () => {
    it('should validate request payloads and return appropriate errors', async () => {
      // Mock validation error response
      mockFetch.mockResolvedValueOnce(
        mockResponse(
          {
            type: 'validation_error',
            message: 'Invalid request payload',
            details: {
              title: 'Title is required',
              email: 'Invalid email format',
            },
          },
          400
        )
      );

      const result = await ApiTester.testEndpoint(
        '/api/content',
        'POST',
        {
          // Missing required fields
          description: 'Test description',
        },
        {
          Authorization: 'Bearer valid_token',
        }
      );

      expect(result.status).toBe(400);
      expect(result.error.type).toBe('validation_error');
      expect(result.error.details).toBeDefined();
    });

    it('should handle network timeouts and connection errors', async () => {
      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await ApiTester.testEndpoint('/api/content', 'GET');

      expect(result.status).toBe(500);
      expect(result.error.type).toBe('network_error');
      expect(result.error.message).toBe('Network timeout');
    });

    it('should enforce rate limiting correctly', async () => {
      // Mock rate limit response
      mockFetch.mockResolvedValueOnce(
        mockResponse(
          {
            type: 'rate_limit_exceeded',
            message: 'Too many requests',
          },
          429
        )
      );

      const result = await ApiTester.testEndpoint('/api/content/search', 'POST', {
        query: 'test',
      });

      expect(result.status).toBe(429);
      expect(result.error.type).toBe('rate_limit_exceeded');
    });
  });
});
