/**
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
 * PosalPro MVP2 - Performance Optimization API
 * Memory profiling, database query optimization, and asset compression
 * Component Traceability: US-6.1, US-6.2, H8, H9
 */

import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import {
  createApiErrorResponse,
  ErrorCodes,
  ErrorHandlingService,
  StandardError,
} from '@/lib/errors';
import ImageOptimizationService from '@/lib/performance/ImageOptimizationService';
import MemoryOptimizationService from '@/lib/performance/MemoryOptimizationService';
import { getCache, setCache } from '@/lib/redis';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

import { logWarn } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Component Traceability Matrix:
 * - User Stories: US-6.1 (Performance Monitoring), US-6.2 (Memory Optimization)
 * - Acceptance Criteria: AC-6.1.1, AC-6.1.2, AC-6.2.1, AC-6.2.2
 * - Hypotheses: H8 (Memory Efficiency), H9 (Query Optimization)
 * - Methods: GET (monitor), POST (optimize)
 * - Test Cases: TC-H8-003, TC-H9-002
 */

export async function GET(request: NextRequest) {
  try {
    await validateApiPermission(request, { resource: 'performance', action: 'read' });
    // Get session for authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Unauthorized access attempt',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'PerformanceOptimizationAPI',
            operation: 'getOptimizationStatus',
          },
        }),
        'Unauthorized',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401,
        { userFriendlyMessage: 'You must be logged in to access this resource' }
      );
    }

    // Initialize services
    const memoryService = MemoryOptimizationService.getInstance();
    const imageService = ImageOptimizationService.getInstance();

    // Get memory metrics
    const memoryMetrics = memoryService.getMemoryMetrics();
    const isMemoryAcceptable = memoryService.isMemoryUsageAcceptable();
    const memoryLeaks = memoryService.detectMemoryLeaks();
    const queryMetrics = memoryService.getQueryMetrics();
    const recommendations = memoryService.getOptimizationRecommendations();

    // Get image optimization stats
    const imageStats = await imageService.getOptimizationStats();

    // Check cache for optimization results
    const cacheKey = `optimization:status:${session.user.id}`;
    const cachedStatus = await getCache<{ timestamp?: string }>(cacheKey);

    const optimizationStatus = {
      timestamp: new Date().toISOString(),
      memory: {
        metrics: memoryMetrics,
        isAcceptable: isMemoryAcceptable,
        leaks: memoryLeaks,
        recommendations: recommendations.filter(r => r.type === 'memory'),
      },
      queries: {
        metrics: queryMetrics,
        recommendations: recommendations.filter(r => r.type === 'query'),
      },
      images: {
        stats: imageStats,
        recommendations: recommendations.filter(r => r.type === 'cache'),
      },
      cache: {
        hasCachedStatus: !!cachedStatus,
        lastOptimization: cachedStatus?.timestamp ?? null,
      },
    };

    // Cache the status for 5 minutes
    try {
      await setCache(cacheKey, optimizationStatus, 300);
    } catch (cacheError) {
      logWarn('[PerformanceOptimizationAPI] Failed to cache status:', {
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
    }

    return NextResponse.json(optimizationStatus);
  } catch (error) {
    ErrorHandlingService.getInstance().processError(
      error,
      'Failed to get optimization status',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      {
        component: 'PerformanceOptimizationAPI',
        operation: 'getOptimizationStatus',
      }
    );

    return createApiErrorResponse(
      error instanceof StandardError
        ? error
        : new StandardError({
            message: 'Failed to get optimization status',
            code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
            cause: error instanceof Error ? error : undefined,
            metadata: {
              component: 'PerformanceOptimizationAPI',
              operation: 'getOptimizationStatus',
            },
          }),
      'Failed to get optimization status',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      { userFriendlyMessage: 'Unable to retrieve optimization status. Please try again later.' }
    );
  }
}

export async function POST(request: NextRequest) {
  let type: string = '';
  try {
    await validateApiPermission(request, { resource: 'performance', action: 'update' });
    // Get session for authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Unauthorized access attempt',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'PerformanceOptimizationAPI',
            operation: 'triggerOptimization',
          },
        }),
        'Unauthorized',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401,
        { userFriendlyMessage: 'You must be logged in to access this resource' }
      );
    }

    // Parse request body
    const body = await request.json();
    const { type: requestType, options = {} } = body;
    type = requestType;

    // Initialize services
    const memoryService = MemoryOptimizationService.getInstance();
    const imageService = ImageOptimizationService.getInstance();

    let optimizationResults: any = {};

    switch (type) {
      case 'memory':
        // Trigger memory optimization
        await memoryService.optimizeMemory();
        optimizationResults = {
          type: 'memory',
          success: true,
          message: 'Memory optimization completed',
          metrics: memoryService.getMemoryMetrics(),
          leaks: memoryService.detectMemoryLeaks(),
        };
        break;

      case 'queries':
        // Query optimization is handled by the service automatically
        optimizationResults = {
          type: 'queries',
          success: true,
          message: 'Query optimization monitoring active',
          metrics: memoryService.getQueryMetrics(),
        };
        break;

      case 'images': {
        // Trigger image optimization
        const imageResults = await imageService.compressAssets();
        optimizationResults = {
          type: 'images',
          success: true,
          message: 'Image optimization completed',
          results: imageResults,
        };
        break;
      }

      case 'all': {
        // Trigger all optimizations
        await memoryService.optimizeMemory();
        const imageResultsAll = await imageService.compressAssets();

        optimizationResults = {
          type: 'all',
          success: true,
          message: 'All optimizations completed',
          memory: {
            metrics: memoryService.getMemoryMetrics(),
            leaks: memoryService.detectMemoryLeaks(),
          },
          images: imageResultsAll,
          queries: memoryService.getQueryMetrics(),
        };
        break;
      }

      default: {
        return createApiErrorResponse(
          new StandardError({
            message: 'Invalid optimization type',
            code: ErrorCodes.VALIDATION.INVALID_INPUT,
            metadata: {
              component: 'PerformanceOptimizationAPI',
              operation: 'triggerOptimization',
              requestedType: type,
            },
          }),
          'Invalid optimization type',
          ErrorCodes.VALIDATION.INVALID_INPUT,
          400,
          { userFriendlyMessage: 'Invalid optimization type specified' }
        );
      }
    }

    // Cache the results
    const cacheKey = `optimization:results:${session.user.id}:${type}`;
    try {
      await setCache(cacheKey, optimizationResults, 600); // 10 minutes
    } catch (cacheError) {
      logWarn('[PerformanceOptimizationAPI] Failed to cache results:', {
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: optimizationResults,
    });
  } catch (error) {
    ErrorHandlingService.getInstance().processError(
      error,
      'Failed to trigger optimization',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      {
        component: 'PerformanceOptimizationAPI',
        operation: 'triggerOptimization',
        optimizationType: type,
      }
    );

    return createApiErrorResponse(
      error instanceof StandardError
        ? error
        : new StandardError({
            message: 'Failed to trigger optimization',
            code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
            cause: error instanceof Error ? error : undefined,
            metadata: {
              component: 'PerformanceOptimizationAPI',
              operation: 'triggerOptimization',
            },
          }),
      'Failed to trigger optimization',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500,
      { userFriendlyMessage: 'Unable to trigger optimization. Please try again later.' }
    );
  }
}
