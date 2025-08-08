import { NextResponse } from 'next/server';
import { snapshot } from '@/lib/observability/metricsStore';

export async function GET() {
  const data = snapshot();
  return NextResponse.json({ success: true, data });
}
