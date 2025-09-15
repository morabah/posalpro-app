/**
 * Product Relationships → Version History (proposal changes)
 * Returns proposal change entries that involve the specified productId.
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { prisma } from '@/lib/prisma';
import { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getCache, setCache } from '@/lib/redis';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { StandardError } from '@/lib/errors';

const errorHandlingService = ErrorHandlingService.getInstance();

export async function GET(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'ProductRelationshipVersionsAPI',
    operation: 'GET',
  });

  try {
    await validateApiPermission(request, { resource: 'proposals', action: 'read' });
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const authError = new StandardError({
        message: 'Unauthorized access attempt',
        code: ErrorCodes.AUTH.UNAUTHORIZED,
        metadata: {
          component: 'ProductRelationshipVersionsAPI',
          operation: 'GET',
        },
      });
      const errorResponse = errorHandler.createErrorResponse(
        authError,
        'Unauthorized',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401
      );
      return errorResponse;
    }

    const url = new URL(request.url);
    const productIdParam = url.searchParams.get('productId');
    const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);

    // Cursor-based pagination: createdAt desc, id desc
    const cursorCreatedAtParam = url.searchParams.get('cursorCreatedAt');
    const cursorIdParam = url.searchParams.get('cursorId');
    const cursorCreatedAt = cursorCreatedAtParam ? new Date(cursorCreatedAtParam) : null;
    const cursorId = cursorIdParam || null;

    // Short TTL cache key (per product + cursor + limit)
    // Use param before resolution for cache scoping, then rebuild after resolution
    const cacheKey =
      `products:relationships:versions:${productIdParam || 'unknown'}:` +
      `${cursorCreatedAt ? cursorCreatedAt.getTime() : 'start'}:${cursorId ?? 'none'}:${limit}`;
    try {
      const cached = await withAsyncErrorHandler(
        () => getCache(cacheKey),
        'Failed to retrieve cached data',
        { component: 'ProductRelationshipVersionsAPI', operation: 'CACHE_CHECK' }
      );
      if (cached && typeof cached === 'object') {
        return errorHandler.createSuccessResponse(
          cached as Record<string, unknown>,
          'Product relationship versions retrieved from cache'
        );
      }
    } catch {
      // ignore cache errors
    }

    if (!productIdParam) {
      const validationError = new StandardError({
        message: 'productId is required',
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        metadata: {
          component: 'ProductRelationshipVersionsAPI',
          operation: 'GET',
        },
      });
      const errorResponse = errorHandler.createErrorResponse(
        validationError,
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400
      );
      return errorResponse;
    }

    // Accept either Product.id (cuid) or Product.sku
    let resolvedProductId = productIdParam as string;
    if (!/^[a-z0-9]{25,}$/i.test(productIdParam)) {
      // Likely SKU; try lookup
      const prod = await withAsyncErrorHandler(
        () =>
          prisma.product.findUnique({
            where: {
              tenantId_sku: {
                tenantId: 'tenant_default',
                sku: productIdParam,
              },
            },
            select: { id: true },
          }),
        'Failed to lookup product by SKU',
        { component: 'ProductRelationshipVersionsAPI', operation: 'PRODUCT_LOOKUP' }
      );
      if (prod?.id) resolvedProductId = prod.id;
    }

    // Pull authoritative history from ProposalVersion snapshots (captures deletes too)
    // Use raw SQL to ensure compatibility across generated clients
    const PrismaLocal = Prisma;

    // Build cursor condition for stable pagination
    const cursorCondition =
      cursorCreatedAt && cursorId
        ? PrismaLocal.sql`AND (pv."createdAt" < ${cursorCreatedAt} OR (pv."createdAt" = ${cursorCreatedAt} AND pv.id < ${cursorId}))`
        : PrismaLocal.empty;

    const rows = await withAsyncErrorHandler(
      () =>
        prisma.$queryRaw(
          PrismaLocal.sql`
            SELECT pv.id,
                   pv."proposalId",
                   pv.version,
                   pv."createdAt",
                   pv."createdBy",
                   u.name as "createdByName",
                   pv."changeType",
                   pv."changesSummary",
                   (
                     SELECT COALESCE(SUM((COALESCE((p->>'quantity')::numeric,0)) *
                                        (COALESCE((p->>'unitPrice')::numeric,0)) *
                                        (1 - COALESCE((p->>'discount')::numeric,0)/100)), 0)
                     FROM jsonb_array_elements(pv.snapshot->'products') AS p
                   ) AS "totalValue"
            FROM proposal_versions pv
            LEFT JOIN users u ON u.id = pv."createdBy"
            WHERE ${resolvedProductId} = ANY (pv."productIds")
            ${cursorCondition}
            ORDER BY pv."createdAt" DESC, pv.id DESC
            LIMIT ${limit + 1}
          `
        ) as Promise<
          Array<{
            id: string;
            proposalId: string;
            version: number;
            createdAt: Date;
            createdBy: string | null;
            createdByName: string | null;
            changeType: string;
            changesSummary: string | null;
            totalValue: any;
          }>
        >,
      'Failed to execute raw SQL query for version history',
      { component: 'ProductRelationshipVersionsAPI', operation: 'RAW_SQL_QUERY' }
    );

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, -1) : rows;

    const data = pageRows.map(
      (r: {
        id: string;
        proposalId: string;
        version: number;
        createdAt: Date;
        createdBy: string | null;
        createdByName?: string | null;
        changeType: string;
        changesSummary: string | null;
      }) => ({
        id: r.id,
        version: r.version,
        proposalId: r.proposalId,
        title: 'Proposal change',
        changeType:
          (r.changeType as
            | 'create'
            | 'update'
            | 'section_update'
            | 'status_change'
            | 'product_change') || 'update',
        description: r.changesSummary || '',
        changedBy: r.createdBy || undefined,
        createdByName: (r as any).createdByName || undefined,
        timestamp: r.createdAt,
        totalValue:
          typeof (r as any).totalValue === 'number' ? Number((r as any).totalValue) : undefined,
      })
    );

    const next = hasMore
      ? {
          cursorCreatedAt: pageRows[pageRows.length - 1]?.createdAt?.toISOString() || null,
          cursorId: pageRows[pageRows.length - 1]?.id || null,
        }
      : null;

    const payload = {
      success: true,
      data,
      pagination: {
        limit,
        hasMore,
        nextCursor: next,
      },
    } as const;

    try {
      // 120s Redis TTL inside setCache implementation
      await withAsyncErrorHandler(
        () => setCache(cacheKey, payload, 120),
        'Failed to cache version history data',
        { component: 'ProductRelationshipVersionsAPI', operation: 'CACHE_SET' }
      );
    } catch {
      // ignore cache errors
    }

    return errorHandler.createSuccessResponse(
      payload,
      'Product relationship version history retrieved successfully'
    );
  } catch (error) {
    const systemError = errorHandlingService.processError(
      error,
      'Failed to fetch product relationship version history',
      ErrorCodes.DATA.FETCH_FAILED,
      { component: 'ProductRelationshipVersionsAPI', operation: 'GET' }
    );

    const errorResponse = errorHandler.createErrorResponse(
      systemError,
      'Failed to fetch product relationship version history',
      ErrorCodes.DATA.FETCH_FAILED,
      500
    );
    return errorResponse;
  }
}
