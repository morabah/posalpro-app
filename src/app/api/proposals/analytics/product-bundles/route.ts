import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

type PairKey = string; // `${productAId}::${productBId}` with id order normalization

export async function GET(request: NextRequest) {
  const ehs = ErrorHandlingService.getInstance();
  try {
    await validateApiPermission(request, 'analytics:read');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const items = await prisma.proposalProduct.findMany({
      select: { proposalId: true, productId: true, product: { select: { id: true, name: true } } },
      take: 20000,
    });
    const byProposal = new Map<string, Array<{ id: string; name: string }>>();
    for (const it of items) {
      const arr = byProposal.get(it.proposalId) || [];
      if (it.product) arr.push({ id: it.product.id, name: it.product.name });
      byProposal.set(it.proposalId, arr);
    }
    const pairMap = new Map<
      PairKey,
      { aId: string; aName: string; bId: string; bName: string; count: number }
    >();
    for (const products of byProposal.values()) {
      const uniq = Array.from(new Map(products.map(p => [p.id, p])).values());
      for (let i = 0; i < uniq.length; i++) {
        for (let j = i + 1; j < uniq.length; j++) {
          const [a, b] = [uniq[i], uniq[j]].sort((x, y) => x.id.localeCompare(y.id));
          const key: PairKey = `${a.id}::${b.id}`;
          const existing = pairMap.get(key) || {
            aId: a.id,
            aName: a.name,
            bId: b.id,
            bName: b.name,
            count: 0,
          };
          existing.count += 1;
          pairMap.set(key, existing);
        }
      }
    }
    const pairs = Array.from(pairMap.values())
      .sort((x, y) => y.count - x.count)
      .slice(0, 15);
    const res = NextResponse.json({ success: true, data: { pairs } });
    if (process.env.NODE_ENV === 'production')
      res.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    else res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    const err = ehs.processError(
      error,
      'Failed to fetch product bundles',
      ErrorCodes.DATA.FETCH_FAILED,
      { component: 'ProductBundlesAnalyticsAPI', operation: 'GET' }
    );
    return NextResponse.json(
      { success: false, error: err.message, code: err.code },
      { status: 500 }
    );
  }
}
