/**
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
 * PosalPro MVP2 - Validation Metrics API
 * Phase 9/10: Validation Dashboard & Mobile Performance Integration
 * Component Traceability Matrix: US-3.1, H8
 */

import { ErrorHandlingService, ErrorCodes } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';

import { logDebug, logInfo, logError } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.1'],
  acceptanceCriteria: ['AC-3.1.1'],
  methods: ['getValidationMetrics()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001'],
};

interface ValidationMetrics {
  totalIssues: number;
  criticalIssues: number;
  resolvedIssues: number;
  errorReductionRate: number;
  avgValidationTime: number;
  fixAcceptanceRate: number;
  licenseComplianceScore: number;
  lastUpdated: Date;
}

/**
 * GET /api/validation/metrics
 * Returns validation performance metrics for the dashboard
 */
export async function GET(request: NextRequest) {
  const errorHandlingService = ErrorHandlingService.getInstance();
  const start = Date.now();

  try {
    await validateApiPermission(request, { resource: 'validation', action: 'read' });
    await logDebug('[ValidationMetricsAPI] GET start', {
      component: 'ValidationMetricsAPI',
      operation: 'GET',
    });
    // Simulate comprehensive validation metrics
    // In production, this would query actual validation data from the database
    const validationMetrics: ValidationMetrics = {
      totalIssues: 127,
      criticalIssues: 8,
      resolvedIssues: 95,
      errorReductionRate: 42.3, // 42.3% reduction achieved (H8 target: 50%)
      avgValidationTime: 2.8, // Average time in minutes
      fixAcceptanceRate: 89.2, // 89.2% of suggested fixes are accepted
      licenseComplianceScore: 94.7, // 94.7% compliance score
      lastUpdated: new Date(),
    };

    const res = NextResponse.json({
      success: true,
      data: validationMetrics,
      message: 'Validation metrics retrieved successfully',
      componentMapping: COMPONENT_MAPPING,
    });
    await logInfo('[ValidationMetricsAPI] GET success', {
      component: 'ValidationMetricsAPI',
      operation: 'GET',
      loadTime: Date.now() - start,
    });
    return res;
  } catch (error) {
    const processedError = errorHandlingService.processError(
      error,
      'Failed to retrieve validation metrics',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      { component: 'ValidationMetricsAPI', operation: 'GET' }
    );
    await logError('[ValidationMetricsAPI] GET failed', error as unknown, {
      component: 'ValidationMetricsAPI',
      operation: 'GET',
      errorCode: processedError.code,
    });

    return NextResponse.json(
      {
        success: false,
        error: processedError.message,
        componentMapping: COMPONENT_MAPPING,
      },
      { status: 500 }
    );
  }
}
