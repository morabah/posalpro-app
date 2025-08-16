import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const ehs = ErrorHandlingService.getInstance();
  try {
    await validateApiPermission(request, 'proposals:read');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Aggregate product usage across all proposals and compute win counts
    const proposalProducts = await prisma.proposalProduct.findMany({
      select: {
        productId: true,
        quantity: true,
        unitPrice: true,
        proposal: { select: { status: true } },
        product: { select: { id: true, name: true, category: true } },
      },
      take: 100000,
    });

    const map = new Map<
      string,
      {
        productId: string;
        name: string;
        category: string | null;
        usage: number;
        totalQuantity: number;
        revenue: number;
        wins: number;
      }
    >();
    for (const row of proposalProducts) {
      if (!row.product) continue;
      const key = row.product.id;
      const existing = map.get(key) || {
        productId: row.product.id,
        name: row.product.name,
        category: Array.isArray(row.product.category) ? row.product.category.join(', ') : (row.product.category ?? null),
        usage: 0,
        totalQuantity: 0,
        revenue: 0,
        wins: 0,
      };
      existing.usage += 1;
      existing.totalQuantity += Number(row.quantity || 0);
      existing.revenue += Number(row.unitPrice || 0) * Number(row.quantity || 0);
      if (row.proposal?.status === 'ACCEPTED') existing.wins += 1;
      map.set(key, existing);
    }

    const products = Array.from(map.values()).sort((a, b) => b.usage - a.usage);
    const topWinning = [...products].sort((a, b) => b.wins - a.wins).slice(0, 10);

    const res = NextResponse.json({ success: true, data: { products, topWinning } });
    if (process.env.NODE_ENV === 'production') {
      res.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    } else {
      res.headers.set('Cache-Control', 'no-store');
    }
    return res;
  } catch (error) {
    const err = ehs.processError(
      error,
      'Failed to fetch product analytics',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        component: 'ProposalProductsAnalyticsAPI',
        operation: 'GET',
      }
    );
    return NextResponse.json(
      { success: false, error: err.message, code: err.code },
      { status: 500 }
    );
  }
}
