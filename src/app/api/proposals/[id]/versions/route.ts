import { error as apiError, ok } from '@/lib/api/response';
import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import { logInfo } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const errorHandlingService = ErrorHandlingService.getInstance();

// GET /api/proposals/[id]/versions - list versions
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    // TEMPORARILY DISABLE AUTH FOR DEBUGGING
    // await validateApiPermission(request, { resource: 'proposals', action: 'read' });
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return new Response(JSON.stringify({
    //     ok: false,
    //     error: 'Authentication required to access proposal versions'
    //   }), {
    //     status: 401,
    //     headers: { 'Content-Type': 'application/json' },
    //   });
    // }
    const { id } = await ctx.params;
    const PrismaLocal = (require('@prisma/client') as any).Prisma;

    const requestUrl = new URL(request.url);
    const limit = Math.min(Number(requestUrl.searchParams.get('limit') || 50), 200);
    const versionQuery = requestUrl.searchParams.get('version');
    const detail =
      requestUrl.searchParams.get('detail') === '1' || requestUrl.searchParams.get('include') === 'detail';

    // Detail mode for a specific version with diff
    if (detail && versionQuery) {
      console.log('🔍 DEBUG: Processing detail mode for version', versionQuery);

      const vNum = Number(versionQuery);
      if (!Number.isFinite(vNum)) {
        return NextResponse.json(
          { ok: false, error: 'Invalid version number' },
          { status: 400 }
        );
      }

      // Get current and previous version data
      console.log('🔍 DEBUG: About to query database for versions', { id, vNum });
      const rows = (await prisma.$queryRaw(
        PrismaLocal.sql`
          SELECT version, snapshot, "createdBy", "createdAt", "changeType", COALESCE("changesSummary", '') as "changesSummary"
          FROM proposal_versions
          WHERE "proposalId" = ${id} AND version IN (${vNum}, ${vNum - 1})
          ORDER BY version DESC
        `
      )) as Array<{
        version: number;
        snapshot: any;
        createdBy: string | null;
        createdAt: Date;
        changeType: string;
        changesSummary: string;
      }>;

      console.log('🔍 DEBUG: Database query completed', { rowsFound: rows?.length || 0 });

      if (!rows || rows.length === 0) {
        console.log('🔍 DEBUG: No rows found for versions', { id, vNum });
        return NextResponse.json(
          { ok: false, error: 'Version not found' },
          { status: 404 }
        );
      }

      const current = rows.find(r => r.version === vNum)!;
      const previous = rows.find(r => r.version === vNum - 1);

      // Calculate diff
      const curList = normalizeProducts(current.snapshot);
      const prevList = previous ? normalizeProducts(previous.snapshot) : [];
      const prevMap = new Map(prevList.map(p => [p.productId, p]));
      const curMap = new Map(curList.map(p => [p.productId, p]));

      const added: string[] = [];
      const removed: string[] = [];
      const updated: Array<{ productId: string; from: any; to: any }> = [];

      for (const p of curList) {
        const prev = prevMap.get(p.productId);
        if (!prev) added.push(p.productId);
        else if (prev &&
          (prev.quantity !== p.quantity ||
           prev.unitPrice !== p.unitPrice ||
           prev.discount !== p.discount)
        ) {
          updated.push({ productId: p.productId, from: prev, to: p });
        }
      }
      for (const p of prevList) {
        if (!curMap.has(p.productId)) removed.push(p.productId);
      }

      // Get user name
      let createdByName: string | null = null;
      if (current.createdBy) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: current.createdBy || undefined },
            select: { name: true }
          });
          createdByName = user?.name || null;
        } catch {}
      }

      // Get product names for the diff
      const allProductIds = Array.from(new Set([
        ...added,
        ...removed,
        ...updated.map(u => u.productId)
      ]));

      const productsMap: Record<string, { name: string; sku: string | null }> = {};
      if (allProductIds.length > 0) {
        const products = await prisma.product.findMany({
          where: { id: { in: allProductIds } },
          select: { id: true, name: true, sku: true },
        });
        for (const p of products) {
          productsMap[p.id] = { name: p.name, sku: p.sku };
        }
      }

      // Calculate total value
      let totalValue = Number(
        current.snapshot?.calculatedTotalValue ||
        current.snapshot?.value ||
        0
      );

      // Get customer name
      let customerName: string | null = null;
      const customerId = current.snapshot?.customerId;
      if (customerId) {
        try {
          const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { name: true }
          });
          customerName = customer?.name || null;
        } catch {}
      }

      const response = {
        ok: true,
        data: {
          version: current.version,
          createdAt: current.createdAt,
          createdBy: current.createdBy,
          createdByName,
          changeType: current.changeType,
          changesSummary: current.changesSummary,
          diff: { added, removed, updated },
          productsMap,
          totalValue,
          customerName,
          isInitialVersion: vNum === 1
        }
      };

      console.log('🔍 DEBUG: Returning real diff data', {
        version: current.version,
        addedCount: added.length,
        removedCount: removed.length,
        updatedCount: updated.length,
        totalValue,
        customerName
      });

      return NextResponse.json(response, { status: 200 });
    }

    // Basic list mode
    const versions = (await prisma.$queryRaw(
      PrismaLocal.sql`
        SELECT pv.id,
               pv."proposalId" as "proposalId",
               pv.version,
               pv."createdAt",
               pv."createdBy",
               u.name as "createdByName",
               pv."changeType",
               pv."changesSummary",
               COALESCE(
                 (pv.snapshot->>'calculatedTotalValue')::numeric,
                 (pv.snapshot->>'value')::numeric,
                 (
                   SELECT COALESCE(SUM(pp.total), 0)
                   FROM proposal_products pp
                   WHERE pp."proposalId" = pv."proposalId"
                 ),
                 0
               ) AS "totalValue"
        FROM proposal_versions pv
        LEFT JOIN users u ON u.id = pv."createdBy"
        WHERE pv."proposalId" = ${id}
        ORDER BY pv.version DESC
        LIMIT ${limit}
      `
    )) as Array<{
      id: string;
      proposalId: string;
      version: number;
      createdAt: Date;
      createdBy: string | null;
      createdByName: string | null;
      changeType: string;
      changesSummary: string | null;
      totalValue: any;
    }>;

    const data = versions.map(v => ({
      ...v,
      totalValue:
        v.totalValue !== null && v.totalValue !== undefined
          ? Number(v.totalValue)
          : undefined,
    }));

    const responsePayload = { ok: true, data: data };
    const response = new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=120');
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    return response;
  } catch (error) {
    const errorHandlingService = ErrorHandlingService.getInstance();
    errorHandlingService.processError(
      error,
      'Failed to fetch proposal versions',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        component: 'ProposalVersionsAPI',
        operation: 'GET',
      }
    );
    return NextResponse.json(apiError(ErrorCodes.DATA.FETCH_FAILED, 'Failed to fetch versions'), {
      status: 500,
    });
  }
}

// Helper function to normalize products from snapshot
function normalizeProducts(
  snap: any
): Array<{ productId: string; quantity: number; unitPrice: number; discount: number }> {
  const list: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }> = [];
  try {
    const arr = Array.isArray(snap?.products) ? snap.products : [];
    for (const p of arr) {
      if (p?.productId) {
        list.push({
          productId: String(p.productId),
          quantity: Number(p.quantity ?? 0),
          unitPrice: Number(p.unitPrice ?? 0),
          discount: Number(p.discount ?? 0),
        });
      }
    }
  } catch {}
  return list;
}
