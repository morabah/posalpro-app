/**
 * Example API route demonstrating API key authentication
 * This route requires API key with 'read:protected' scope
 */

import { assertApiKey } from '@/server/api/apiKeyGuard';
import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';

export async function GET(request: NextRequest) {
  try {
    // Require API key with 'read:protected' scope
    await assertApiKey(request, 'read:protected');

    // If we reach here, API key is valid and has required scope
    return NextResponse.json({
      success: true,
      message: 'Protected endpoint accessed successfully',
      data: {
        timestamp: new Date().toISOString(),
        protectedResource: 'This is sensitive data',
        authenticatedVia: 'API Key'
      }
    });

  } catch (error) {
    // assertApiKey throws Response objects with appropriate status codes
    if (error instanceof Response) {
      return error;
    }

    // Handle unexpected errors
    const processedError = ErrorHandlingService.processError(error, 'Unexpected error in protected endpoint');
    logError('Unexpected error in protected endpoint', processedError, {
      component: 'protected-example',
      operation: 'GET',
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

export async function POST(request: NextRequest) {
  try {
    // Require API key with 'write:protected' scope for POST operations
    await assertApiKey(request, 'write:protected');

    const body = await request.json();

    // Process the protected write operation
    return NextResponse.json({
      success: true,
      message: 'Protected write operation completed',
      data: {
        operation: 'create',
        resource: 'protected-resource',
        received: body,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    const processedError = ErrorHandlingService.processError(error, 'Unexpected error in protected POST endpoint');
    logError('Unexpected error in protected POST endpoint', processedError, {
      component: 'protected-example',
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
