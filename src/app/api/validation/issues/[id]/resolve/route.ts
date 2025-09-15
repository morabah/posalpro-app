/**
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
 * PosalPro MVP2 - Validation Issue Resolution API
 * Phase 9/10: Validation Dashboard & Mobile Performance Integration
 * Component Traceability Matrix: US-3.1, H8
 */

import { ErrorHandlingService } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.1'],
  acceptanceCriteria: ['AC-3.1.2'],
  methods: ['resolveValidationIssue()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001'],
};

/**
 * POST /api/validation/issues/[id]/resolve
 * Resolves a validation issue
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const errorHandlingService = ErrorHandlingService.getInstance();

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status, resolution } = body;

    // Validate required fields
    if (!status || !resolution) {
      return NextResponse.json(
        {
          success: false,
          error: 'Status and resolution are required',
          componentMapping: COMPONENT_MAPPING,
        },
        { status: 400 }
      );
    }

    // Simulate issue resolution
    // In production, this would update the actual validation issue in the database
    const resolvedIssue = {
      id,
      status,
      resolution,
      resolvedAt: new Date(),
      resolvedBy: 'current-user', // Would be actual user ID
    };

    return NextResponse.json({
      success: true,
      data: resolvedIssue,
      message: `Validation issue ${id} resolved successfully`,
      componentMapping: COMPONENT_MAPPING,
    });
  } catch (error) {
    const processedError = errorHandlingService.processError(
      error,
      'Failed to resolve validation issue'
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
