import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Force Node.js runtime to avoid Edge Function conflicts

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Profile test endpoint working',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Test endpoint failed',
      },
      { status: 500 }
    );
  }
}
