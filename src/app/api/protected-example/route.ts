/**
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
 * Example API route demonstrating API key authentication
 * This route requires API key with 'read:protected' scope
 */

import { assertApiKey } from '@/server/api/apiKeyGuard';
import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { ErrorHandlingService, ErrorCodes } from '@/lib/errors';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

export async function GET(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'ProtectedExampleAPI',
    operation: 'GET',
  });

  try {
    // Require API key with 'read:protected' scope
    await assertApiKey(request, 'read:protected');

    // If we reach here, API key is valid and has required scope
    const protectedData = {
      timestamp: new Date().toISOString(),
      protectedResource: 'This is sensitive data',
      authenticatedVia: 'API Key'
    };

    return errorHandler.createSuccessResponse(
      protectedData,
      'Protected endpoint accessed successfully'
    );

  } catch (error) {
    // Preserve specialized API key authentication error handling
    if (error instanceof Response) {
      return error;
    }

    // Handle unexpected errors with the new error handler
    logError('Unexpected error in protected endpoint', {
      component: 'ProtectedExampleAPI',
      operation: 'GET',
      error: error instanceof Error ? error.message : String(error),
    });

    const systemError = ErrorHandlingService.getInstance().processError(
      error,
      'Unexpected error in protected endpoint',
      ErrorCodes.SYSTEM.INTERNAL_ERROR
    );

    const errorResponse = errorHandler.createErrorResponse(
      systemError,
      'Internal server error',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500
    );
    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'ProtectedExampleAPI',
    operation: 'POST',
  });

  try {
    // Require API key with 'write:protected' scope for POST operations
    await assertApiKey(request, 'write:protected');

    const body = await withAsyncErrorHandler(
      () => request.json(),
      'Failed to parse request body',
      { component: 'ProtectedExampleAPI', operation: 'POST' }
    );

    // Process the protected write operation
    const operationData = {
      operation: 'create',
      resource: 'protected-resource',
      received: body,
      timestamp: new Date().toISOString()
    };

    return errorHandler.createSuccessResponse(
      operationData,
      'Protected write operation completed'
    );

  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    logError('Unexpected error in protected POST endpoint', {
      component: 'ProtectedExampleAPI',
      operation: 'POST',
      error: error instanceof Error ? error.message : String(error),
    });

    const systemError = ErrorHandlingService.getInstance().processError(
      error,
      'Unexpected error in protected POST endpoint',
      ErrorCodes.SYSTEM.INTERNAL_ERROR
    );

    const errorResponse = errorHandler.createErrorResponse(
      systemError,
      'Internal server error',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500
    );
    return errorResponse;
  }
}
