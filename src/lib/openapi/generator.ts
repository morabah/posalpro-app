// Lightweight OpenAPI generator scaffolding - Manual schema generation
import { getApiConfig, getConfig } from '@/lib/env';

// Generate a minimal OpenAPI document with manual schema definitions
export async function generateOpenAPISpec() {
  const app = getConfig();
  const api = getApiConfig();

  const baseDoc = {
    openapi: '3.0.3',
    info: {
      title: `${app.appName} API`,
      version: app.appVersion || '1.0.0',
      description:
        'PosalPro MVP2 API - Auto-generated OpenAPI specification with manual schema definitions.',
    },
    servers: [{ url: api.baseUrl || '/api' }],
    paths: {} as Record<string, any>,
    components: {
      schemas: {
        // Manual schema definitions
        DashboardStats: {
          type: 'object',
          properties: {
            totalRevenue: { type: 'number', description: 'Total revenue amount' },
            monthlyRevenue: { type: 'number', description: 'Monthly revenue amount' },
            revenueGrowth: { type: 'number', description: 'Revenue growth percentage' },
            totalProposals: { type: 'number', description: 'Total number of proposals' },
            activeProposals: { type: 'number', description: 'Number of active proposals' },
            winRate: { type: 'number', description: 'Proposal win rate percentage' },
          },
        },
        EnhancedDashboardStats: {
          type: 'object',
          properties: {
            totalRevenue: { type: 'number' },
            monthlyRevenue: { type: 'number' },
            revenueGrowth: { type: 'number' },
            totalProposals: { type: 'number' },
            activeProposals: { type: 'number' },
            wonProposals: { type: 'number' },
            winRate: { type: 'number' },
            avgProposalValue: { type: 'number' },
            avgCycleTime: { type: 'number' },
            overdueCount: { type: 'number' },
            atRiskCount: { type: 'number' },
            totalCustomers: { type: 'number' },
            activeCustomers: { type: 'number' },
            customerGrowth: { type: 'number' },
            avgCustomerValue: { type: 'number' },
            revenueHistory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  month: { type: 'string' },
                  revenue: { type: 'number' },
                  proposals: { type: 'number' },
                  wins: { type: 'number' },
                  target: { type: 'number' },
                },
              },
            },
          },
        },
        DashboardStatsQuery: {
          type: 'object',
          properties: {
            fresh: { type: 'boolean', description: 'Force fresh data' },
            timeRange: { type: 'string', enum: ['week', 'month', 'quarter', 'year'] },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            company: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            sku: { type: 'string' },
            category: { type: 'string' },
            price: { type: 'number' },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Proposal: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            customerId: { type: 'string' },
            status: { type: 'string' },
            value: { type: 'number' },
            total: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' },
            avatar: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  };

  // Define API paths manually
  baseDoc.paths = {
    '/dashboard/stats': {
      get: {
        summary: 'Get basic dashboard statistics',
        tags: ['dashboard'],
        parameters: [
          {
            in: 'query',
            name: 'fresh',
            schema: { $ref: '#/components/schemas/DashboardStatsQuery' },
            required: false,
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/DashboardStats' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/dashboard/enhanced-stats': {
      get: {
        summary: 'Get enhanced dashboard statistics',
        tags: ['dashboard'],
        parameters: [
          {
            in: 'query',
            name: 'fresh',
            schema: { $ref: '#/components/schemas/DashboardStatsQuery' },
            required: false,
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/EnhancedDashboardStats' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/dashboard/executive': {
      get: {
        summary: 'Get executive dashboard data',
        tags: ['dashboard'],
        parameters: [
          {
            in: 'query',
            name: 'timeframe',
            schema: { type: 'string', enum: ['1M', '3M', '6M', '1Y'] },
            required: false,
          },
          {
            in: 'query',
            name: 'includeForecasts',
            schema: { type: 'boolean' },
            required: false,
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/customers': {
      get: {
        summary: 'List customers',
        tags: ['customers'],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Customer' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create customer',
        tags: ['customers'],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Customer' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Customer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/customers/{id}': {
      get: {
        summary: 'Get customer by ID',
        tags: ['customers'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Customer' },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update customer',
        tags: ['customers'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Customer' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Customer' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete customer',
        tags: ['customers'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '204': { description: 'No Content' },
        },
      },
    },
    '/products': {
      get: {
        summary: 'List products',
        tags: ['products'],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create product',
        tags: ['products'],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Product' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/products/{id}': {
      get: {
        summary: 'Get product by ID',
        tags: ['products'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update product',
        tags: ['products'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Product' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete product',
        tags: ['products'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '204': { description: 'No Content' },
        },
      },
    },
    '/proposals': {
      get: {
        summary: 'List proposals',
        tags: ['proposals'],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Proposal' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create proposal',
        tags: ['proposals'],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Proposal' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Proposal' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/proposals/{id}': {
      get: {
        summary: 'Get proposal by ID',
        tags: ['proposals'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Proposal' },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update proposal',
        tags: ['proposals'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Proposal' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Proposal' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete proposal',
        tags: ['proposals'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '204': { description: 'No Content' },
        },
      },
    },
  };

  return baseDoc;
}
