import { createRoute } from '@/lib/api/route';
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
import { NextResponse } from 'next/server';
import { recordWebVital } from '@/lib/observability/metricsStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MetricPayload {
  name: 'FCP' | 'LCP' | 'CLS' | 'TTFB' | 'INP';
  value: number;
  id?: string;
  label?: string;
}

export const POST = createRoute({ requireAuth: false }, async ({ req }) => {
  try {
    const contentType = req.headers.get('content-type') || '';
    let payload: MetricPayload | null = null;

    if (contentType.includes('application/json')) {
      payload = (await req.json()) as MetricPayload;
    } else {
      // Beacon without content-type; read as text then parse
      const text = await req.text();
      try {
        payload = JSON.parse(text) as MetricPayload;
      } catch {
        payload = null;
      }
    }

    if (!payload || typeof payload.name !== 'string' || typeof payload.value !== 'number') {
      return NextResponse.json({ success: false, message: 'Invalid metric' }, { status: 400 });
    }

    // Clamp/normalize obvious outliers (defense-in-depth)
    const value = Number.isFinite(payload.value) ? Math.max(0, Math.min(payload.value, 60000)) : 0;
    recordWebVital(payload.name, value);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
});
