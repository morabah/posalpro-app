import { ErrorCodes } from '@/lib/errors';
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
import { logInfo } from '@/lib/logger';
import { getErrorHandler } from '@/server/api/errorHandler';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'ProductRelationshipsAPI',
    operation: 'GET',
  });

  try {
    logInfo('Product relationships API called', {
      component: 'ProductRelationshipsAPI',
      operation: 'GET',
      userStory: 'US-4.1',
      hypothesis: 'H5',
    });

    // For now, return empty array - this can be expanded later
    const relationshipsData: unknown[] = [];
    return errorHandler.createSuccessResponse(
      relationshipsData,
      'Product relationships retrieved successfully'
    );
  } catch (error) {
    const errorResponse = errorHandler.createErrorResponse(
      error,
      'Failed to retrieve product relationships',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500
    );
    return errorResponse;
  }
}
