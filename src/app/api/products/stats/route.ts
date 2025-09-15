
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';

import { createRoute } from '@/lib/api/route';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

export const GET = createRoute(
  {
    // Auth required by default; fine-grained permission validated below
  },
  async ({ req }) => {
    const errorHandler = getErrorHandler({
      component: 'ProductStatsAPI',
      operation: 'GET',
    });

    await validateApiPermission(req, 'products:read');

    try {
      // Lightweight diagnostic only in development
      if (process.env.NODE_ENV !== 'production') {
        void logDebug('🚀 [OPTIMIZED] Product stats request started', {
          component: 'ProductStatsAPI',
          operation: 'GET',
        });
      }
      const startTime = Date.now();

      // Single optimized query instead of multiple slow queries
      const stats = await withAsyncErrorHandler(
        () =>
          prisma.$queryRaw`
            SELECT
              COUNT(*) as total,
              COUNT(*) FILTER (WHERE "isActive" = true) as active,
              COUNT(*) FILTER (WHERE "isActive" = false) as inactive,
              COALESCE(AVG(price), 0) as "averagePrice"
            FROM products
            WHERE "isActive" = true
          `,
        'Failed to execute product statistics query',
        { component: 'ProductStatsAPI', operation: 'GET' }
      );

      const queryTime = Date.now() - startTime;
      if (process.env.NODE_ENV !== 'production') {
        void logInfo('✅ [OPTIMIZED] Product stats completed', {
          component: 'ProductStatsAPI',
          operation: 'GET',
          queryTime,
        });
      }

      const result = Array.isArray(stats) ? stats[0] : stats;

      const responseData = {
        total: Number(result.total) || 0,
        active: Number(result.active) || 0,
        inactive: Number(result.inactive) || 0,
        averagePrice: Number(result.averagePrice) || 0,
        queryTime,
        optimized: true,
      };

      return errorHandler.createSuccessResponse(
        responseData,
        'Product statistics retrieved successfully'
      );
    } catch (error) {
      const ehs = ErrorHandlingService.getInstance();
      const standardError = ehs.processError(
        error,
        'Failed to retrieve product statistics',
        ErrorCodes.DATA.FETCH_FAILED,
        { component: 'ProductStatsAPI', operation: 'GET' }
      );
      logError('ProductStatsAPI error', error, { errorCode: standardError.code });

      const errorResponse = errorHandler.createErrorResponse(
        standardError,
        'Failed to retrieve product statistics',
        ErrorCodes.DATA.FETCH_FAILED,
        500
      );
      return errorResponse;
    }
  }
);
