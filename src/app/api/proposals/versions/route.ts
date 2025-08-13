import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const errorHandlingService = ErrorHandlingService.getInstance();

// GET /api/proposals/versions - list all proposal version entries (newest first)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const QuerySchema = z.object({
      limit: z.coerce.number().int().positive().max(500).default(200),
    });
    const { limit } = QuerySchema.parse({ limit: url.searchParams.get('limit') });

    const PrismaLocal = (require('@prisma/client') as any).Prisma;
    const rows = (await prisma.$queryRaw(
      PrismaLocal.sql`
        SELECT pv.id,
               pv."proposalId",
               p.title as "proposalTitle",
               pv.version,
               pv."createdAt",
               pv."createdBy",
               u.name as "createdByName",
               pv."changeType",
               COALESCE(pv."changesSummary", '') as "changesSummary",
                COALESCE(
                  (
                    SELECT COALESCE(SUM(
                      COALESCE((pjson->>'total')::numeric,
                               (COALESCE((pjson->>'quantity')::numeric,0)) *
                               (COALESCE((pjson->>'unitPrice')::numeric,0)) *
                               (1 - COALESCE((pjson->>'discount')::numeric,0)/100))
                    ), 0)
                    FROM jsonb_array_elements(COALESCE(pv.snapshot->'products', '[]'::jsonb)) AS pjson
                  ),
                  (
                    SELECT COALESCE(SUM(
                      COALESCE((p2->>'total')::numeric,
                               (COALESCE((p2->>'quantity')::numeric,0)) *
                               (COALESCE((p2->>'unitPrice')::numeric,0)) *
                               (1 - COALESCE((p2->>'discount')::numeric,0)/100))
                    ), 0)
                    FROM jsonb_array_elements(
                      COALESCE(pv.snapshot->'metadata'->'wizardData'->'step4'->'products', '[]'::jsonb)
                    ) AS p2
                  ),
                  0
                ) AS "totalValue"
        FROM proposal_versions pv
        LEFT JOIN proposals p ON p.id = pv."proposalId"
        LEFT JOIN users u ON u.id = pv."createdBy"
        ORDER BY pv."createdAt" DESC
        LIMIT ${limit}
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
    }>;

    const data = rows.map(r => ({
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
    }));

    const res = NextResponse.json({ success: true, data, count: data.length });
    res.headers.set('Cache-Control', 'public, max-age=30, s-maxage=120');
    res.headers.set('Content-Type', 'application/json; charset=utf-8');
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
