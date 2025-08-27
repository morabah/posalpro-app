import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const errorHandlingService = ErrorHandlingService.getInstance();

// GET /api/proposals/[id]/versions - list versions
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await validateApiPermission(request, { resource: 'proposals', action: 'read' });
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await ctx.params;
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);
    const versionQuery = url.searchParams.get('version');
    const detail =
      url.searchParams.get('detail') === '1' || url.searchParams.get('include') === 'detail';

    // Detail mode for a specific version with diff
    if (detail && versionQuery) {
      const PrismaLocal = (require('@prisma/client') as any).Prisma;
      const vNum = Number(versionQuery);
      if (!Number.isFinite(vNum)) {
        return NextResponse.json({ success: false, error: 'Invalid version' }, { status: 400 });
      }
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

      if (!rows || rows.length === 0) {
        return NextResponse.json({ success: true, data: null });
      }
      const current = rows.find(r => r.version === vNum)!;
      const previous = rows.find(r => r.version === vNum - 1) || null;

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
        else if (
          prev.quantity !== p.quantity ||
          prev.unitPrice !== p.unitPrice ||
          prev.discount !== p.discount
        ) {
          updated.push({ productId: p.productId, from: prev, to: p });
        }
      }
      for (const p of prevList) {
        if (!curMap.has(p.productId)) removed.push(p.productId);
      }

      // Attach user name
      let createdByName: string | null = null;
      if (current.createdBy) {
        try {
          const u = await prisma.user.findUnique({
            where: { id: current.createdBy },
            select: { name: true },
          });
          createdByName = u?.name || null;
        } catch {}
      }

      // Resolve product names in a single query
      const allIds = Array.from(
        new Set<string>([...added, ...removed, ...updated.map(u => u.productId)])
      );
      const productsMap: Record<string, { name: string; sku: string | null }> = {};
      if (allIds.length > 0) {
        const products = await prisma.product.findMany({
          where: { id: { in: allIds } },
          select: { id: true, name: true, sku: true },
        });
        for (const p of products) {
          productsMap[p.id] = { name: p.name, sku: p.sku } as { name: string; sku: string | null };
        }
      }

      // Resolve customer name (from snapshot if available, otherwise one lookup)
      let customerName: string | null = null;
      const snapCustomerName = (current.snapshot && (current.snapshot as any).customerName) as
        | string
        | undefined;
      if (snapCustomerName && typeof snapCustomerName === 'string') {
        customerName = snapCustomerName;
      } else {
        const snapCustomerId = (current.snapshot && (current.snapshot as any).customerId) as
          | string
          | undefined;
        if (snapCustomerId) {
          try {
            const cust = await prisma.customer.findUnique({
              where: { id: snapCustomerId },
              select: { name: true },
            });
            customerName = cust?.name || null;
          } catch {}
        }
      }

      // Compute total value for this version using snapshot if available
      function computeTotalValue(snap: any): number {
        try {
          if (typeof snap?.value === 'number') return Number((snap.value || 0).toFixed(2));
          const list = Array.isArray(snap?.products) ? snap.products : [];
          let sum = 0;
          for (const p of list) {
            const qty = Number(p?.quantity ?? 0);
            const price = Number(p?.unitPrice ?? 0);
            const discount = Number(p?.discount ?? 0);
            sum += qty * price * (1 - discount / 100);
          }
          return Number(sum.toFixed(2));
        } catch {
          return 0;
        }
      }
      const totalValue = computeTotalValue(current.snapshot);

      return NextResponse.json({
        success: true,
        data: {
          version: current.version,
          createdAt: current.createdAt,
          createdBy: current.createdBy,
          createdByName,
          changeType: current.changeType,
          changesSummary: current.changesSummary,
          diff: { added, removed, updated },
          productsMap,
          customerName,
          totalValue,
        },
      });
    }

    const PrismaLocal = (require('@prisma/client') as any).Prisma;
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
                 (
                   SELECT COALESCE(SUM(
                     COALESCE((p->>'total')::numeric,
                              (COALESCE((p->>'quantity')::numeric,0)) *
                              (COALESCE((p->>'unitPrice')::numeric,0)) *
                              (1 - COALESCE((p->>'discount')::numeric,0)/100))
                   ), 0)
                   FROM jsonb_array_elements(COALESCE(pv.snapshot->'products', '[]'::jsonb)) AS p
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
          ? Number((v as any).totalValue)
          : undefined,
    }));

    const res = NextResponse.json({ success: true, data });
    res.headers.set('Cache-Control', 'public, max-age=30, s-maxage=120');
    res.headers.set('Content-Type', 'application/json; charset=utf-8');
    return res;
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Failed to fetch proposal versions',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        component: 'ProposalVersionsAPI',
        operation: 'GET',
      }
    );
    return NextResponse.json(
      { success: false, error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

// Helper to collect productIds from snapshot
function extractProductIds(snapshot: any): string[] {
  try {
    const md = snapshot?.metadata || snapshot;
    const step4 = md?.wizardData?.step4;
    const ids = new Set<string>();
    if (Array.isArray(step4?.products)) {
      for (const p of step4.products) {
        const id = typeof p?.productId === 'string' ? p.productId : undefined;
        if (id) ids.add(id);
      }
    }
    if (Array.isArray(snapshot?.products)) {
      for (const link of snapshot.products) {
        const id = typeof link?.productId === 'string' ? link.productId : undefined;
        if (id) ids.add(id);
      }
    }
    return Array.from(ids);
  } catch {
    return [];
  }
}

// POST /api/proposals/[id]/versions - create version snapshot
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  let proposalId: string | undefined;
  try {
    await validateApiPermission(request, { resource: 'proposals', action: 'update' });
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await ctx.params;
    proposalId = id;

    const body = await request.json().catch(() => ({}));
    const changeType: string = typeof body.changeType === 'string' ? body.changeType : 'update';
    const changesSummary: string | undefined =
      typeof body.changesSummary === 'string' ? body.changesSummary : undefined;
    const productIdHintRaw = body.productIdHint;
    const productIdHints: string[] = Array.isArray(productIdHintRaw)
      ? productIdHintRaw.filter((v: unknown): v is string => typeof v === 'string')
      : typeof productIdHintRaw === 'string'
        ? [productIdHintRaw]
        : [];

    // Load latest proposal with minimal relations for snapshot
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            productId: true,
            quantity: true,
            unitPrice: true,
            total: true,
            updatedAt: true,
          },
        },
        sections: { select: { id: true, title: true, order: true, updatedAt: true } },
      },
    });
    if (!proposal)
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    // Get next version number
    const PrismaLocal2 = (require('@prisma/client') as any).Prisma;
    const last = (await prisma.$queryRaw(
      PrismaLocal2.sql`SELECT COALESCE(MAX(version), 0) as v FROM proposal_versions WHERE "proposalId" = ${id}`
    )) as Array<{ v: number }>;
    const nextVersion = (last[0]?.v ?? 0) + 1;

    const snapshot = {
      id: proposal.id,
      title: proposal.title,
      status: proposal.status,
      priority: proposal.priority,
      value: proposal.value,
      currency: proposal.currency,
      customerId: proposal.customerId,
      metadata: proposal.metadata,
      products: proposal.products,
      sections: proposal.sections,
      updatedAt: proposal.updatedAt,
    };

    const productIds = Array.from(new Set([...extractProductIds(snapshot), ...productIdHints]));

    const createdArr = (await prisma.$queryRaw(
      PrismaLocal2.sql`INSERT INTO proposal_versions ("proposalId", version, "createdBy", "changeType", "changesSummary", snapshot, "productIds")

                 VALUES (${id}, ${nextVersion}, ${session.user.id}, ${changeType}, ${changesSummary ?? null}, ${snapshot as any}, ${productIds})

                 RETURNING id, "proposalId", version, "createdAt", "changeType", "changesSummary"`
    )) as Array<{
      id: string;
      proposalId: string;
      version: number;
      createdAt: Date;
      changeType: string;
      changesSummary: string | null;
    }>;
    const created = createdArr[0];

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Failed to create version',
      ErrorCodes.DATA.CREATE_FAILED,
      {
        component: 'ProposalVersionsAPI',
        operation: 'POST',
        proposalId,
      }
    );
    return NextResponse.json(
      { success: false, error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
