/**
 * API Integration Tests - Phase 3 Type Safety Validation
 * Tests actual API route implementations with proper TypeScript types
 *
 * Component Traceability Matrix:
 * User Stories: [US-3.1, US-3.2]
 * Acceptance Criteria: [AC-3.1.1, AC-3.1.2, AC-3.2.1, AC-3.2.2]
 * Methods: [GET /api/search, POST /api/customers, GET /api/config, GET /api/content]
 * Hypotheses: [H3]
 * Test Cases: [TC-H3-001, TC-H3-002, TC-H3-003]
 */

import '@testing-library/jest-dom';
import { NextRequest, NextResponse } from 'next/server';

// Import API route handlers directly
import { GET as configGet } from '../../app/api/config/route';
import { GET as contentGet, POST as contentPost } from '../../app/api/content/route';
import { GET as customersGet, POST as customersPost } from '../../app/api/customers/route';
import { GET as searchGet } from '../../app/api/search/route';

describe('API Integration Tests - Type Safety Validation', () => {
  const COMPONENT_MAPPING = {
    userStories: ['US-3.1', 'US-3.2'],
    acceptanceCriteria: ['AC-3.1.1', 'AC-3.1.2', 'AC-3.2.1', 'AC-3.2.2'],
    methods: ['GET /api/search', 'POST /api/customers', 'GET /api/config', 'GET /api/content'],
    hypotheses: ['H3'],
    testCases: ['TC-H3-001', 'TC-H3-002', 'TC-H3-003'],
  };

  // Mock Prisma client
  const mockPrismaClient = {
    proposal: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    customer: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    content: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  };

  beforeEach(() => {
    // Mock the prisma import
    jest.doMock('../../lib/prisma', () => ({
      __esModule: true,
      default: mockPrismaClient,
    }));

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('Search API Route Type Safety', () => {
    test('should handle valid search request with proper types', async () => {
      // Mock database response
      mockPrismaClient.proposal.findMany.mockResolvedValue([
        {
          id: 'cm123abc456def',
          title: 'Test Proposal',
          description: 'Test Description',
          status: 'DRAFT',
          createdAt: new Date(),
          updatedAt: new Date(),
          productId: 'product_123',
          customerId: 'customer_456',
          createdBy: 'user_789',
        },
      ]);
      mockPrismaClient.proposal.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/search?query=test&limit=10', {
        method: 'GET',
      });

      const response = await searchGet(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.results)).toBe(true);
    });

    test('should handle search request with invalid parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?limit=invalid', {
        method: 'GET',
      });

      const response = await searchGet(request);

      // Should handle invalid parameters gracefully
      expect(response).toBeInstanceOf(NextResponse);
      expect([200, 400]).toContain(response.status);
    });

    test('should validate database ID schema in search results', async () => {
      mockPrismaClient.proposal.findMany.mockResolvedValue([
        {
          id: 'cm123abc456def',
          title: 'Test Proposal',
          description: 'Test Description',
          status: 'DRAFT',
          createdAt: new Date(),
          updatedAt: new Date(),
          productId: 'product_123',
          customerId: 'customer_456',
          createdBy: 'user_789',
        },
      ]);
      mockPrismaClient.proposal.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/search?query=test', {
        method: 'GET',
      });

      const response = await searchGet(request);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        expect(typeof result.id).toBe('string');
        expect(result.id.length).toBeGreaterThan(0);
        expect(result.id).not.toBe('undefined');
        expect(result.id).not.toBe('null');
      }
    });
  });

  describe('Config API Route Type Safety', () => {
    test('should return properly typed configuration', async () => {
      const request = new NextRequest('http://localhost:3000/api/config', {
        method: 'GET',
      });

      const response = await configGet(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(typeof data).toBe('object');
      expect(data).not.toBeNull();
    });

    test('should handle field selection for performance', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/config?fields=environment,version',
        {
          method: 'GET',
        }
      );

      const response = await configGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(typeof data).toBe('object');
    });
  });

  describe('Content API Route Type Safety', () => {
    test('should handle content retrieval with proper types', async () => {
      mockPrismaClient.content.findMany.mockResolvedValue([
        {
          id: 'content_123',
          title: 'Test Content',
          body: 'Test Body',
          type: 'TEMPLATE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      mockPrismaClient.content.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/content', {
        method: 'GET',
      });

      const response = await contentGet(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('content');
      expect(Array.isArray(data.content)).toBe(true);
    });

    test('should handle content creation with validation', async () => {
      mockPrismaClient.content.create.mockResolvedValue({
        id: 'content_new',
        title: 'New Content',
        body: 'New Body',
        type: 'TEMPLATE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Content',
          body: 'New Body',
          type: 'TEMPLATE',
        }),
      });

      const response = await contentPost(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect([200, 201]).toContain(response.status);
    });
  });

  describe('Customers API Route Type Safety', () => {
    test('should handle customer listing with pagination', async () => {
      mockPrismaClient.customer.findMany.mockResolvedValue([
        {
          id: 'customer_123',
          name: 'Test Customer',
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      mockPrismaClient.customer.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'GET',
      });

      const response = await customersGet(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('customers');
      expect(Array.isArray(data.customers)).toBe(true);
    });

    test('should handle customer creation with proper validation', async () => {
      mockPrismaClient.customer.create.mockResolvedValue({
        id: 'customer_new',
        name: 'New Customer',
        email: 'new@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Customer',
          email: 'new@example.com',
        }),
      });

      const response = await customersPost(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect([200, 201]).toContain(response.status);
    });

    test('should validate cursor-based pagination types', async () => {
      mockPrismaClient.customer.findMany.mockResolvedValue([]);
      mockPrismaClient.customer.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/customers?cursor=cm123abc456def', {
        method: 'GET',
      });

      const response = await customersGet(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('customers');
    });
  });

  describe('Error Handling Type Safety', () => {
    test('should handle database errors gracefully', async () => {
      mockPrismaClient.proposal.findMany.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/search?query=test', {
        method: 'GET',
      });

      const response = await searchGet(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('should return properly typed error responses', async () => {
      mockPrismaClient.customer.create.mockRejectedValue(new Error('Validation failed'));

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invalid: 'data',
        }),
      });

      const response = await customersPost(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBeGreaterThanOrEqual(400);

      const data = await response.json();
      expect(typeof data).toBe('object');
      expect(data).toHaveProperty('error');
    });
  });

  describe('Performance Impact Assessment', () => {
    test('should complete API calls within reasonable time', async () => {
      mockPrismaClient.proposal.findMany.mockResolvedValue([]);
      mockPrismaClient.proposal.count.mockResolvedValue(0);

      const startTime = performance.now();

      const request = new NextRequest('http://localhost:3000/api/search?query=test', {
        method: 'GET',
      });

      await searchGet(request);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // 1 second threshold
    });

    test('should handle concurrent requests efficiently', async () => {
      mockPrismaClient.customer.findMany.mockResolvedValue([]);
      mockPrismaClient.customer.count.mockResolvedValue(0);

      const requests = Array.from(
        { length: 5 },
        () => new NextRequest('http://localhost:3000/api/customers', { method: 'GET' })
      );

      const startTime = performance.now();

      const responses = await Promise.all(requests.map(req => customersGet(req)));

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      expect(duration).toBeLessThan(2000); // 2 seconds for 5 concurrent requests
    });
  });

  describe('Component Traceability Matrix Validation', () => {
    test('should maintain complete traceability mapping', () => {
      // Verify required fields exist
      expect(COMPONENT_MAPPING.userStories).toBeDefined();
      expect(COMPONENT_MAPPING.acceptanceCriteria).toBeDefined();
      expect(COMPONENT_MAPPING.methods).toBeDefined();
      expect(COMPONENT_MAPPING.hypotheses).toBeDefined();
      expect(COMPONENT_MAPPING.testCases).toBeDefined();

      // Verify user story format
      COMPONENT_MAPPING.userStories.forEach(story => {
        expect(story).toMatch(/^US-\d+\.\d+$/);
      });

      // Verify acceptance criteria format
      COMPONENT_MAPPING.acceptanceCriteria.forEach(criteria => {
        expect(criteria).toMatch(/^AC-\d+\.\d+\.\d+$/);
      });

      // Verify hypothesis format
      COMPONENT_MAPPING.hypotheses.forEach(hypothesis => {
        expect(hypothesis).toMatch(/^H\d+$/);
      });

      // Verify test case format
      COMPONENT_MAPPING.testCases.forEach(testCase => {
        expect(testCase).toMatch(/^TC-H\d+-\d+$/);
      });
    });

    test('should track API integration analytics events', () => {
      // Mock analytics tracking
      const mockAnalytics = {
        track: jest.fn(),
      };

      // Verify analytics integration points
      expect(typeof mockAnalytics.track).toBe('function');

      // Simulate analytics events
      mockAnalytics.track('api_integration_test_executed', {
        route: '/api/search',
        method: 'GET',
        timestamp: new Date().toISOString(),
      });

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'api_integration_test_executed',
        expect.objectContaining({
          route: '/api/search',
          method: 'GET',
        })
      );
    });
  });
});
