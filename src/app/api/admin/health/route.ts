import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Token-protected health variant for admin checks
    await validateApiPermission(request, 'admin:metrics:read');

    return NextResponse.json({
      ok: true,
      scope: 'admin',
      timestamp: new Date().toISOString(),
    });
  } catch (res: any) {
    // If validateApiPermission threw a NextResponse, forward it
    if (res && typeof res === 'object' && 'status' in res) {
      return res as NextResponse;
    }
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
