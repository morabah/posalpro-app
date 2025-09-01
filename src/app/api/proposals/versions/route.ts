import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getCache, setCache } from '@/lib/redis';
import { logInfo } from '@/lib/logger';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { ProposalVersionsQuerySchema } from '@/features/proposals/schemas';

const errorHandlingService = ErrorHandlingService.getInstance();

// GET /api/proposals/versions - list proposal version entries with cursor pagination (newest first)
export async function GET(request: NextRequest) {
  try {
    await validateApiPermission(request, { resource: 'proposals', action: 'read' });
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const { limit, cursorCreatedAt, cursorId } = ProposalVersionsQuerySchema.parse({
      limit: url.searchParams.get('limit'),
      cursorCreatedAt: url.searchParams.get('cursorCreatedAt') || undefined,
      cursorId: url.searchParams.get('cursorId') || undefined,
    });

    // Short‑TTL caching (60–120s) to reduce DB load for frequent checks
    const cacheKey = `proposalVersions:${session.user.id}:${cursorCreatedAt || 'first'}:${
      cursorId || 'none'
    }:${limit}`;
    try {
      const cachedRaw = await getCache(cacheKey);
      if (cachedRaw && typeof cachedRaw === 'object') {
        const res = NextResponse.json(cachedRaw as Record<string, unknown>);
        res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=180');
        res.headers.set('Content-Type', 'application/json; charset=utf-8');
        return res;
      }
    } catch {
      // ignore cache errors
    }

    // Build optional cursor filter using tagged template
    const cursorFilter =
      cursorCreatedAt && cursorId
        ? Prisma.sql`WHERE (pv."createdAt" < ${new Date(cursorCreatedAt)} OR (pv."createdAt" = ${new Date(
            cursorCreatedAt
          )} AND pv.id < ${cursorId}))`
        : Prisma.sql``;

    const rows = (await prisma.$queryRaw(
      Prisma.sql`
        SELECT pv.id,
               pv."proposalId",
               p.title as "proposalTitle",
               pv.version,
               pv."createdAt",
               pv."createdBy",
               u.name as "createdByName",
               pv."changeType",
               COALESCE(pv."changesSummary", '') as "changesSummary",
               -- Priority: calculatedTotalValue > value > recalculate from current proposal > 0
               COALESCE(
                 (pv.snapshot->>'calculatedTotalValue')::numeric,
                 (pv.snapshot->>'value')::numeric,
                 (
                   SELECT COALESCE(SUM(pp.total), 0)
                   FROM proposal_products pp
                   WHERE pp."proposalId" = pv."proposalId"
                 ),
                 0
               ) AS "totalValue",
               pv.snapshot->>'value' AS "rawValue",
               pv.snapshot AS "fullSnapshot"
        FROM proposal_versions pv
        LEFT JOIN proposals p ON p.id = pv."proposalId"
        LEFT JOIN users u ON u.id = pv."createdBy"
        ${cursorFilter}
        ORDER BY pv."createdAt" DESC, pv.id DESC
        LIMIT ${limit + 1}
      `
    )) as Array<{
      id: string;
      proposalId: string;
      proposalTitle: string | null;
      version: number;
      createdAt: Date;
      createdBy: string | null;
      createdByName: string | null;
      changeType: string;
      changesSummary: string | null;
      totalValue: any;
      rawValue: string | null;
      fullSnapshot: any;
    }>;

    const hasNextPage = rows.length > limit;
    const sliced = hasNextPage ? rows.slice(0, limit) : rows;

    const data = sliced.map(r => {
      const totalValue = Number(r.totalValue) || 0;

      logInfo('🔍 DEBUG: Version history item processing', {
        component: 'ProposalVersionsAPI',
        operation: 'GET',
        versionId: r.id,
        proposalId: r.proposalId,
        version: r.version,
        rawTotalValue: r.totalValue,
        rawValue: r.rawValue,
        processedTotalValue: totalValue,
        totalValueType: typeof totalValue,
        fullSnapshotKeys: Object.keys(r.fullSnapshot || {}),
        snapshotCalculatedTotalValue: r.fullSnapshot?.calculatedTotalValue,
        snapshotOriginalStoredValue: r.fullSnapshot?.originalStoredValue,
        recalculatedFromCurrentProducts: totalValue > 0 && !r.fullSnapshot?.calculatedTotalValue && !r.fullSnapshot?.value,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      const result = {
        id: r.id,
        proposalId: r.proposalId,
        proposalTitle: r.proposalTitle || 'Proposal',
        version: r.version,
        timestamp: r.createdAt,
        changeType: r.changeType,
        description: r.changesSummary || '',
        changedBy: r.createdBy || undefined,
        createdByName: r.createdByName || undefined,
        totalValue:
          r.totalValue !== null && r.totalValue !== undefined
            ? Number((r as any).totalValue)
            : undefined,
      };

      return result;
    });

    const next = hasNextPage
      ? {
          cursorCreatedAt: sliced[sliced.length - 1].createdAt.toISOString(),
          cursorId: sliced[sliced.length - 1].id,
        }
      : null;

    const payload = {
      success: true,
      data,
      count: data.length,
      pagination: {
        limit,
        hasNextPage,
        nextCursor: next,
      },
    };

    const res = NextResponse.json(payload);
    res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=180');
    res.headers.set('Content-Type', 'application/json; charset=utf-8');

    // Set cache
    try {
      await setCache(cacheKey, payload, 120);
    } catch {
      // ignore cache errors
    }
    return res;
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Failed to fetch all proposal versions',
      ErrorCodes.DATA.FETCH_FAILED,
      { component: 'AllProposalVersionsAPI', operation: 'GET' }
    );
    return NextResponse.json(
      { success: false, error: 'Failed to fetch proposal version history' },
      { status: 500 }
    );
  }
}
