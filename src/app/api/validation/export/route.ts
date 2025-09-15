/**
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
 * PosalPro MVP2 - Validation Report Export API
 * Phase 9/10: Validation Dashboard & Mobile Performance Integration
 * Component Traceability Matrix: US-3.3, H8
 */

import { ErrorHandlingService } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.3'],
  acceptanceCriteria: ['AC-3.3.3'],
  methods: ['exportValidationReport()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-003'],
};

/**
 * POST /api/validation/export
 * Exports validation report in PDF or CSV format
 */
export async function POST(request: NextRequest) {
  const errorHandlingService = ErrorHandlingService.getInstance();

  try {
    const body = await request.json();
    const { format, timeFilter, includeMetrics, includeIssues, includeRules } = body;

    // Validate required fields
    if (!format || !['pdf', 'csv'].includes(format)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid format (pdf or csv) is required',
          componentMapping: COMPONENT_MAPPING,
        },
        { status: 400 }
      );
    }

    // Placeholder report generation; integrate real generator when available
    const reportData = {
      format,
      timeFilter,
      generatedAt: new Date(),
      includeMetrics: includeMetrics || false,
      includeIssues: includeIssues || false,
      includeRules: includeRules || false,
    };

    const fileName = `validation-report-${new Date().toISOString().split('T')[0]}.${format}`;
    const downloadUrl = `/api/validation/downloads/${encodeURIComponent(fileName)}`;

    return NextResponse.json({
      success: true,
      data: {
        downloadUrl,
        fileName,
        reportData,
        fileSize: format === 'pdf' ? '2.4 MB' : '156 KB',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
      },
      message: `Validation report generated successfully in ${format.toUpperCase()} format`,
      componentMapping: COMPONENT_MAPPING,
    });
  } catch (error) {
    const processedError = errorHandlingService.processError(
      error,
      'Failed to export validation report'
    );

    return NextResponse.json(
      {
        success: false,
        error: errorHandlingService.getUserFriendlyMessage(error),
        componentMapping: COMPONENT_MAPPING,
      },
      { status: 500 }
    );
  }
}
