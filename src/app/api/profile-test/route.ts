import { NextRequest, NextResponse } from 'next/server';
// Force Node.js runtime to avoid Edge Function conflicts
export const runtime = "nodejs";

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
