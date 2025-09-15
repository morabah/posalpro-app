import { logger } from '@/lib/logger';
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
/**
 * PosalPro MVP2 - Logout API Route
 * Session cleanup and security logging
 */

import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { ErrorCodes, StandardError } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'AuthLogoutRoute',
    operation: 'POST',
  });

  try {
    // Get current session
    const session = await withAsyncErrorHandler(
      () => getServerSession(authOptions),
      'Failed to get user session for logout',
      { component: 'AuthLogoutRoute', operation: 'POST' }
    );

    if (!session?.user?.id) {
      const authError = new StandardError({
        message: 'No active session found',
        code: ErrorCodes.AUTH.UNAUTHORIZED,
        metadata: {
          component: 'AuthLogoutRoute',
          operation: 'POST',
        },
      });
      const errorResponse = errorHandler.createErrorResponse(
        authError,
        'No active session found',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401
      );
      return errorResponse;
    }

    // In a real implementation, you would:
    // 1. Deactivate user sessions in database
    // 2. Log logout event in audit log
    // 3. Track logout analytics
    // 4. Clear session cookies

    const responseData = {
      message: 'Logged out successfully',
      success: true,
    };

    return errorHandler.createSuccessResponse(
      responseData,
      'User logged out successfully'
    );
  } catch (error) {
    logger.error('Logout error:', error);

    const systemError = new Error('Internal server error during logout');
    const errorResponse = errorHandler.createErrorResponse(
      systemError,
      'Internal server error',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500
    );
    return errorResponse;
  }
}
