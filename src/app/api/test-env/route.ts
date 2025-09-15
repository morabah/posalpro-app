import { NextRequest, NextResponse } from 'next/server';
// Force Node.js runtime to avoid Edge Function conflicts
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const envVars = {
      DATABASE_URL: process.env.DATABASE_URL
        ? `${process.env.DATABASE_URL.substring(0, 20)}...`
        : 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
        ? `${process.env.NEXTAUTH_SECRET.substring(0, 10)}...`
        : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      CSRF_SECRET: process.env.CSRF_SECRET ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    };

    // Simple environment check without database
    const allEnvVarsPresent = Object.values(envVars).every(
      val => val !== 'NOT SET' && !val.includes('NOT SET')
    );

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: 'production',
      envVars,
      allPresent: allEnvVarsPresent,
      message: allEnvVarsPresent
        ? '✅ All environment variables loaded successfully'
        : '❌ Some environment variables missing',
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        envCheck: 'FAILED',
      },
      { status: 500 }
    );
  }
}
