/**
 * PosalPro MVP2 - Global Configuration API Endpoint
 * Edge-optimized configuration delivery for worldwide performance
 * Component Traceability: US-6.1, US-6.2, H8, H11
 */

import { ErrorCodes, errorHandlingService } from '@/lib/errors';
import { parseFieldsParam } from '@/lib/utils/selectiveHydration';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Component Traceability Matrix:
 * - User Stories: US-6.1 (Performance Optimization), US-6.2 (Global Configuration)
 * - Acceptance Criteria: AC-6.1.1, AC-6.1.2, AC-6.2.1, AC-6.2.2
 * - Hypotheses: H8 (Response Time), H11 (Global Performance)
 * - Methods: getGlobalConfig(), getSelectiveConfig()
 * - Test Cases: TC-H8-002, TC-H11-004
 */

// Available configuration fields for selective hydration
const configFields = [
  'features',
  'ui',
  'analytics',
  'performance',
  'security',
  'integrations',
  'limits',
  'api',
  'version',
  'environment',
];

/**
 * GET /api/config - Global configuration with selective hydration
 * Edge-optimized for worldwide performance
 */
export async function GET(request: NextRequest) {
  const queryStartTime = Date.now();

  try {
    // ✅ PERFORMANCE: Public configuration endpoint (no auth required)
    // This endpoint provides public configuration data

    const { searchParams } = new URL(request.url);

    // ✅ SELECTIVE HYDRATION: Parse requested configuration fields
    const { select, optimizationMetrics } = parseFieldsParam(
      searchParams.get('fields') || undefined,
      'config'
    );

    // 🚀 EDGE-OPTIMIZED: Lightweight configuration data
    const fullConfig = {
      features: {
        proposalWizard: true,
        analytics: true,
        collaboration: true,
        mobileSupport: true,
        edgeRuntime: true,
        selectiveHydration: true,
        cursorPagination: true,
      },
      ui: {
        theme: 'modern',
        colorScheme: 'blue',
        layout: 'responsive',
        animations: true,
        darkMode: true,
      },
      analytics: {
        enabled: true,
        tracking: ['performance', 'user_interactions', 'errors'],
        retention: '90d',
        realtime: true,
      },
      performance: {
        caching: true,
        compression: true,
        lazyLoading: true,
        prefetching: true,
        edgeRuntime: true,
      },
      security: {
        rateLimiting: true,
        csrfProtection: true,
        headerSecurity: true,
        inputValidation: true,
      },
      integrations: {
        auth: 'nextauth',
        database: 'prisma',
        deployment: 'netlify',
        analytics: 'custom',
      },
      limits: {
        apiCalls: 1000,
        fileUpload: '10MB',
        proposalsPerUser: 100,
        searchResults: 100,
      },
      api: {
        version: 'v1',
        baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        rateLimit: '100/hour',
        timeout: 30000,
      },
      version: '0.2.0-alpha.10',
      environment: process.env.NODE_ENV || 'development',
    };

    // Apply selective hydration if fields specified
    let responseData = fullConfig;
    let hydrationMetrics = null;

    if (searchParams.get('fields')) {
      const selectedData: any = {};
      const requestedFieldsList = Object.keys(select);

      requestedFieldsList.forEach((field: string) => {
        if (fullConfig.hasOwnProperty(field)) {
          selectedData[field] = fullConfig[field as keyof typeof fullConfig];
        }
      });

      responseData = selectedData;

      // Calculate performance metrics
      const queryEndTime = Date.now();
      hydrationMetrics = {
        fieldsRequested: requestedFieldsList.length,
        fieldsAvailable: configFields.length,
        fieldsReturned: Object.keys(selectedData).length,
        queryTimeMs: queryEndTime - queryStartTime,
        bytesReduced: JSON.stringify(fullConfig).length - JSON.stringify(selectedData).length,
        performanceGain: `${(((JSON.stringify(fullConfig).length - JSON.stringify(selectedData).length) / JSON.stringify(fullConfig).length) * 100).toFixed(1)}% reduction`,
      };
    }

    const response = {
      success: true,
      data: responseData,
      meta: {
        timestamp: new Date().toISOString(),
        responseTimeMs: Date.now() - queryStartTime,
        runtime: 'edge',
        region: process.env.VERCEL_REGION || 'global',
        ...(hydrationMetrics && { selectiveHydration: hydrationMetrics }),
        optimizationMetrics,
      },
    };

    // ✅ EDGE RUNTIME: Set edge-optimized headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minute cache
      'X-Edge-Runtime': 'true',
      'X-Response-Time': `${Date.now() - queryStartTime}ms`,
    });

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers,
    });
  } catch (error) {
    // ✅ REQUIRED: Use ErrorHandlingService (CORE_REQUIREMENTS.md)
    const standardError = errorHandlingService.processError(
      error,
      'Failed to fetch global configuration',
      ErrorCodes.API.REQUEST_FAILED,
      {
        component: 'ConfigRoute',
        operation: 'getGlobalConfig',
        runtime: 'edge',
        userStories: ['US-6.1', 'US-6.2'],
        hypotheses: ['H8', 'H11'],
      }
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Configuration fetch failed',
        message: errorHandlingService.getUserFriendlyMessage(standardError),
      },
      { status: 500 }
    );
  }
}
