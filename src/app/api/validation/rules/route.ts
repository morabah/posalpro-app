/**
 * Validation Rules API Endpoint
 * Handles CRUD operations for validation rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ValidationRule } from '../../../../types/validation';

// Sample validation rules (in production, these would come from database)
const sampleRules: ValidationRule[] = [
  {
    id: 'rule_product_quantity',
    name: 'Product Quantity Validation',
    description: 'Ensures product quantities are positive and within limits',
    category: 'configuration',
    severity: 'critical',
    conditions: [
      {
        id: 'cond_quantity_positive',
        type: 'product',
        operator: 'greater',
        field: 'quantity',
        value: 0,
        negated: false,
      },
    ],
    actions: [
      {
        id: 'action_quantity_error',
        type: 'error',
        message: 'Product quantity must be greater than 0',
        automated: false,
      },
    ],
    enabled: true,
    userStoryMappings: ['US-3.1'],
    version: '1.0',
    lastModified: new Date(),
    executionOrder: 1,
  },
  {
    id: 'rule_duplicate_products',
    name: 'Duplicate Product Detection',
    description: 'Detects duplicate products in configuration',
    category: 'configuration',
    severity: 'medium',
    conditions: [
      {
        id: 'cond_duplicate_check',
        type: 'configuration',
        operator: 'exists',
        field: 'products',
        value: 'duplicate',
        negated: false,
      },
    ],
    actions: [
      {
        id: 'action_duplicate_warning',
        type: 'warning',
        message: 'Duplicate products detected in configuration',
        automated: false,
      },
      {
        id: 'action_duplicate_suggest',
        type: 'suggest',
        message: 'Remove duplicate products',
        automated: true,
      },
    ],
    enabled: true,
    userStoryMappings: ['US-3.1', 'US-3.2'],
    version: '1.0',
    lastModified: new Date(),
    executionOrder: 2,
  },
  {
    id: 'rule_license_check',
    name: 'License Requirement Validation',
    description: 'Validates that required licenses are configured',
    category: 'license',
    severity: 'high',
    conditions: [
      {
        id: 'cond_license_required',
        type: 'product',
        operator: 'exists',
        field: 'settings.requiresLicense',
        value: true,
        negated: false,
      },
    ],
    actions: [
      {
        id: 'action_license_error',
        type: 'error',
        message: 'Product requires license configuration',
        automated: false,
      },
      {
        id: 'action_license_fix',
        type: 'fix',
        message: 'Configure license for this product',
        automated: false,
      },
    ],
    enabled: true,
    userStoryMappings: ['US-3.3'],
    version: '1.0',
    lastModified: new Date(),
    executionOrder: 3,
  },
];

// Query parameters schema
const rulesQuerySchema = z.object({
  category: z.string().optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  enabled: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  page: z
    .string()
    .transform(val => parseInt(val) || 1)
    .optional(),
  limit: z
    .string()
    .transform(val => parseInt(val) || 10)
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/validation/rules - Fetching validation rules');

    const { searchParams } = new URL(request.url);
    const query = rulesQuerySchema.parse(Object.fromEntries(searchParams));

    // Filter rules based on query parameters
    let filteredRules = [...sampleRules];

    if (query.category) {
      filteredRules = filteredRules.filter(rule => rule.category === query.category);
    }

    if (query.severity) {
      filteredRules = filteredRules.filter(rule => rule.severity === query.severity);
    }

    if (query.enabled !== undefined) {
      filteredRules = filteredRules.filter(rule => rule.enabled === query.enabled);
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRules = filteredRules.slice(startIndex, endIndex);

    console.log('Validation rules fetched', {
      totalRules: sampleRules.length,
      filteredRules: filteredRules.length,
      returnedRules: paginatedRules.length,
      page,
      limit,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          rules: paginatedRules,
          pagination: {
            page,
            limit,
            total: filteredRules.length,
            totalPages: Math.ceil(filteredRules.length / limit),
            hasNext: endIndex < filteredRules.length,
            hasPrev: page > 1,
          },
          filters: {
            category: query.category,
            severity: query.severity,
            enabled: query.enabled,
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          endpoint: '/api/validation/rules',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Validation rules API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Rule creation schema
const createRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  conditions: z.array(
    z.object({
      type: z.enum(['product', 'relationship', 'configuration', 'license', 'custom']),
      operator: z.enum(['equals', 'contains', 'exists', 'greater', 'less', 'matches']),
      field: z.string(),
      value: z.unknown(),
      negated: z.boolean().optional().default(false),
    })
  ),
  actions: z.array(
    z.object({
      type: z.enum(['error', 'warning', 'fix', 'suggest', 'block']),
      message: z.string(),
      data: z.unknown().optional(),
      automated: z.boolean().optional().default(false),
    })
  ),
  enabled: z.boolean().optional().default(true),
  userStoryMappings: z.array(z.string()).optional().default([]),
  executionOrder: z.number().positive().optional().default(100),
});

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/validation/rules - Creating new validation rule');

    const body = await request.json();
    const validatedData = createRuleSchema.parse(body);

    // Create new rule
    const newRule: ValidationRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...validatedData,
      version: '1.0',
      lastModified: new Date(),
    };

    // In production, this would save to database
    console.log('New validation rule created', {
      ruleId: newRule.id,
      name: newRule.name,
      category: newRule.category,
      severity: newRule.severity,
    });

    return NextResponse.json(
      {
        success: true,
        data: newRule,
        message: 'Validation rule created successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Rule creation API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid rule data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
