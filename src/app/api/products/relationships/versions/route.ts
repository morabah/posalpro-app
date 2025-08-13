/**
 * Product Relationships → Version History (proposal changes)
 * Returns proposal change entries that involve the specified productId.
 */

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const errorHandlingService = ErrorHandlingService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const productIdParam = url.searchParams.get('productId');
    const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);
    if (!productIdParam) {
      return NextResponse.json({ success: false, error: 'productId is required' }, { status: 400 });
    }

    // Accept either Product.id (cuid) or Product.sku
    let resolvedProductId = productIdParam;
    if (!/^[a-z0-9]{25,}$/i.test(productIdParam)) {
      // Likely SKU; try lookup
      const prod = await prisma.product.findUnique({
        where: { sku: productIdParam },
        select: { id: true },
      });
      if (prod?.id) resolvedProductId = prod.id;
    }

    // Pull authoritative history from ProposalVersion snapshots (captures deletes too)
    // Use raw SQL to ensure compatibility across generated clients
    const PrismaLocal = (require('@prisma/client') as any).Prisma;
    const rows = (await prisma.$queryRaw(
      PrismaLocal.sql`
        SELECT pv.id,
               pv."proposalId",
               pv.version,
               pv."createdAt",
               pv."createdBy",
               u.name as "createdByName",
               pv."changeType",
               pv."changesSummary",
               -- compute total value from snapshot JSON (quantity * unitPrice * (1 - discount))
               (
                 SELECT COALESCE(SUM((COALESCE((p->>'quantity')::numeric,0)) *
                                    (COALESCE((p->>'unitPrice')::numeric,0)) *
                                    (1 - COALESCE((p->>'discount')::numeric,0)/100)), 0)
                 FROM jsonb_array_elements(pv.snapshot->'products') AS p
               ) AS "totalValue"
        FROM proposal_versions pv
        LEFT JOIN users u ON u.id = pv."createdBy"
        WHERE ${resolvedProductId} = ANY (pv."productIds")
        ORDER BY pv."createdAt" DESC
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

    const data = rows.map(
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

    return NextResponse.json({ success: true, data, count: data.length });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Failed to fetch product relationship version history',
      ErrorCodes.DATA.FETCH_FAILED,
      { component: 'ProductRelationshipVersionsAPI', operation: 'GET' }
    );
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product relationship version history' },
      { status: 500 }
    );
  }
}
