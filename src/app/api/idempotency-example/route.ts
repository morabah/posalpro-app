/**
 * Example API route demonstrating idempotency protection
 * This simulates a sensitive operation that should not be duplicated
 */

import { assertIdempotent } from '@/server/api/idempotency';
import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';

// Simulate a database/storage for this example
let processedRequests = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    // Apply idempotency protection
    // This will prevent duplicate processing even if the client retries
    await assertIdempotent(request, '/api/idempotency-example', {
      userId: 'user_123', // Optional: scope to specific user
      ttlMs: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Parse request body
    const body = await request.json();
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

    console.log(`✅ Processed ${action} request: ${requestId}`);

    return NextResponse.json({
      success: true,
      data: processedData,
      message: 'Request processed successfully',
      note: 'This request is now protected against duplicates for 24 hours'
    });

  } catch (error) {
    // assertIdempotent throws Response objects with appropriate status codes
    if (error instanceof Response) {
      return error;
    }

    // Handle unexpected errors
    const processedError = ErrorHandlingService.processError(error, 'Unexpected error in idempotency example');
    logError('Unexpected error in idempotency example', processedError, {
      component: 'idempotency-example',
      operation: 'POST',
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return list of processed requests for demonstration
  const requests = Array.from(processedRequests.values());

  return NextResponse.json({
    success: true,
    data: {
      totalProcessed: requests.length,
      requests: requests.slice(-10) // Last 10 requests
    }
  });
}
