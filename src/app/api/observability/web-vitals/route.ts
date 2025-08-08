import { NextRequest, NextResponse } from 'next/server';
import { recordWebVital } from '@/lib/observability/metricsStore';

type MetricPayload = {
  name: 'FCP' | 'LCP' | 'CLS' | 'TTFB' | 'INP';
  value: number;
  id?: string;
  label?: string;
};

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let payload: MetricPayload | null = null;

    if (contentType.includes('application/json')) {
      payload = (await request.json()) as MetricPayload;
    } else {
      // Beacon without content-type; read as text then parse
      const text = await request.text();
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
}
