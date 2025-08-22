/**
 * PosalPro MVP2 - Global Configuration API Endpoint
 * Edge-optimized configuration delivery for worldwide performance
 * Component Traceability: US-6.1, US-6.2, H8, H11
 */

import { authOptions } from '@/lib/auth';
import { ErrorCodes, errorHandlingService, StandardError } from '@/lib/errors';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Component Traceability Matrix:
 * - User Stories: US-6.1 (Performance Optimization), US-6.2 (Global Configuration)
 * - Acceptance Criteria: AC-6.1.1, AC-6.1.2, AC-6.2.1, AC-6.2.2
 * - Hypotheses: H8 (Response Time), H11 (Global Performance)
 * - Methods: getGlobalConfig(), getSelectiveConfig()
 * - Test Cases: TC-H8-002, TC-H11-004
 */

interface ConfigData {
  features?: Record<string, boolean>;
  ui?: Record<string, unknown>;
  limits?: Record<string, number>;
  analytics?: Record<string, unknown>;
  performance?: Record<string, unknown>;
  security?: Record<string, unknown>;
  integrations?: Record<string, unknown>;
  api?: Record<string, unknown>;
  version?: string;
  environment?: string;
  [key: string]: unknown;
}

const defaultConfig: ConfigData = {
  features: {
    analytics: true,
    proposals: true,
    products: true,
    customers: true,
    workflows: true,
    validation: true,
    collaboration: true,
    mobile: true,
  },
  ui: {
    theme: 'modern',
    layout: 'responsive',
    enableTransitions: true,
    enableTooltips: true,
  },
  limits: {
    maxProposals: 1000,
    maxProducts: 5000,
    maxCustomers: 10000,
    fileUploadSize: 50 * 1024 * 1024, // 50MB
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  },
  analytics: {
    enabled: true,
    trackingId: process.env.ANALYTICS_TRACKING_ID,
    sessionRecording: false,
    heatmaps: false,
  },
  performance: {
    enableCaching: true,
    lazyLoading: true,
    imageOptimization: true,
    bundleOptimization: true,
  },
  security: {
    enforceHttps: process.env.NODE_ENV === 'production',
    csrfProtection: true,
    ratelimiting: true,
    sessionSecurity: 'strict',
  },
  integrations: {
    email: !!process.env.SMTP_HOST,
    storage: !!process.env.STORAGE_PROVIDER,
    database: !!process.env.DATABASE_URL,
  },
  api: {
    version: '2.0',
    rateLimit: 1000,
    timeout: 30000,
  },
  version: process.env.npm_package_version || '0.2.1',
  environment: process.env.NODE_ENV || 'development',
};

// Configuration field selection for selective response
const allowedFields = [
  'features',
  'ui',
  'limits',
  'analytics',
  'performance',
  'security',
  'integrations',
  'api',
  'version',
  'environment',
];

/**
 * GET /api/config - Get application configuration
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const config = { ...defaultConfig };

    // Handle field selection for performance optimization
    if (searchParams.get('fields')) {
      const selectedData: Record<string, unknown> = {};
      const requestedFieldsList = searchParams.get('fields')?.split(',') || [];

      for (const field of requestedFieldsList) {
        if (allowedFields.includes(field) && config[field] !== undefined) {
          selectedData[field] = config[field];
        }
      }

      return NextResponse.json({
        success: true,
        data: selectedData,
        meta: {
          fieldsRequested: requestedFieldsList,
          fieldsReturned: Object.keys(selectedData),
        },
      });
    }

    // Return full configuration
    return NextResponse.json({
      success: true,
      data: config,
      meta: {
        timestamp: new Date().toISOString(),
        version: config.version,
        environment: config.environment,
      },
    });
  } catch (error) {
    // Use standardized error handling for configuration errors
    errorHandlingService.processError(
      error,
      'Config API error',
      ErrorCodes.SYSTEM.CONFIGURATION,
      {
        component: 'ConfigRoute',
        operation: 'GET',
        requestedFields: searchParams.get('fields'),
      }
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
