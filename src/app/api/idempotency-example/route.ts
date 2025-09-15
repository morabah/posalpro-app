/**
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
 * Example API route demonstrating idempotency protection
 * This simulates a sensitive operation that should not be duplicated
 */

import { assertIdempotent } from '@/server/api/idempotency';
import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '@/lib/logger';
import { ErrorHandlingService, ErrorCodes } from '@/lib/errors';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

export const dynamic = 'force-dynamic';

// Simulate a database/storage for this example
const processedRequests = new Map<string, any>();

export async function POST(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'IdempotencyExampleAPI',
    operation: 'POST',
  });

  try {
    // Apply idempotency protection
    // This will prevent duplicate processing even if the client retries
    await assertIdempotent(request, '/api/idempotency-example', {
      userId: 'user_123', // Optional: scope to specific user
      ttlMs: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Parse request body
    const body = await withAsyncErrorHandler(
      () => request.json(),
      'Failed to parse request body',
      { component: 'IdempotencyExampleAPI', operation: 'POST' }
    );
    const { action, data } = body;

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate a unique request ID for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Store the processed request (in real app, this would be in database)
    const processedData = {
      id: requestId,
      action,
      data,
      processedAt: new Date().toISOString(),
      status: 'completed'
    };

    processedRequests.set(requestId, processedData);

    logInfo('Processed idempotency request', {
      action: action,
      requestId: requestId,
      component: 'IdempotencyExampleAPI'
    });

    return errorHandler.createSuccessResponse(
      processedData,
      'Request processed successfully'
    );

  } catch (error) {
    // Preserve specialized idempotency error handling
    if (error instanceof Response) {
      return error;
    }

    // Handle unexpected errors with the new error handler
    logError('Unexpected error in idempotency example', {
      component: 'IdempotencyExampleAPI',
      operation: 'POST',
      error: error instanceof Error ? error.message : String(error),
    });

    const systemError = ErrorHandlingService.getInstance().processError(
      error,
      'Unexpected error in idempotency example',
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

export async function GET() {
  const errorHandler = getErrorHandler({
    component: 'IdempotencyExampleAPI',
    operation: 'GET',
  });

  // Return list of processed requests for demonstration
  const requests = Array.from(processedRequests.values());
  const requestsData = {
    totalProcessed: requests.length,
    requests: requests.slice(-10) // Last 10 requests
  };

  return errorHandler.createSuccessResponse(
    requestsData,
    'Processed requests retrieved successfully'
  );
}
