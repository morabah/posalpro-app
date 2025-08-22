import { authOptions } from '@/lib/auth';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { ErrorCodes, errorHandlingService, StandardError } from '@/lib/errors';
import { logError } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Allow error reporting even without authentication for better error tracking
    const errorData = await request.json();

    // ✅ ENHANCED: Use standardized error handling service
    const errorHandlingService = ErrorHandlingService.getInstance();

    // Process the error with proper categorization
    const standardError = errorHandlingService.processError(
      new Error(errorData.message || 'Unknown error'),
      'Error reported from client',
      errorData.code || 'SYSTEM.UNKNOWN',
      {
        component: 'ErrorReportingAPI',
        operation: 'POST',
        clientData: {
          componentStack: errorData.componentStack,
          userAgent: errorData.userAgent,
          url: errorData.url,
          timestamp: errorData.timestamp,
          metadata: errorData.metadata,
        },
        session: session
          ? {
              userId: session.user?.id,
              email: session.user?.email,
            }
          : null,
      }
    );

    // ✅ ENHANCED: Use proper logger for error reporting
    await logError('Client error reported', standardError, {
      component: 'ErrorReportingAPI',
      operation: 'POST',
      clientData: {
        componentStack: errorData.componentStack,
        userAgent: errorData.userAgent,
        url: errorData.url,
        timestamp: errorData.timestamp,
        session: session
          ? {
              userId: session.user?.id,
              email: session.user?.email,
            }
          : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Error reported successfully',
      errorId: standardError.code,
    });
  } catch (error) {
    // Use standardized error handling for error reporting failures
    ErrorHandlingService.getInstance().processError(
      error,
      'Failed to process error report',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      {
        component: 'ErrorReportingAPI',
        operation: 'POST',
      }
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process error report',
      },
      { status: 500 }
    );
  }
}
