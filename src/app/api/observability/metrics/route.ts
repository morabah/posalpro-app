import { NextResponse } from 'next/server';
import { snapshot } from '@/lib/observability/metricsStore';

export async function GET() {
  const t0 = Date.now();
  const data = snapshot();
  // Flatten a few headline metrics for the UI
  const lcpP95 = data.webVitals?.LCP?.p95 ?? 0;
  const inpP95 = data.webVitals?.INP?.p95 ?? 0;
  const clsRate = data.webVitals?.CLS?.poor ?? 0;
  const clsTotal = data.webVitals?.CLS?.count ?? 0;
  const clsPoorRate = clsTotal ? clsRate / clsTotal : 0;

  const res = NextResponse.json({
    success: true,
    data: {
      requests: data.requests,
      db: data.db,
      cache: data.cache,
      errors: data.errors,
      webVitals: data.webVitals,
      headline: {
        lcpP95,
        inpP95,
        clsRate: clsPoorRate,
      },
    },
  });
  const dur = Date.now() - t0;
  res.headers.set('Server-Timing', `app;dur=${dur}`);
  return res;
}
