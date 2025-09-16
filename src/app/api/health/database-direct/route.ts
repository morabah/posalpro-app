// Force Node.js runtime to avoid Edge Function conflicts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { testDirectConnection } from '@/lib/db/direct-connection';

export async function GET() {
  try {
    console.log('🔍 Testing direct database connection...');

    const result = await testDirectConnection();

    if (result.success) {
      return NextResponse.json({
        db: 'up',
        connection: 'direct',
        timestamp: new Date().toISOString(),
        result: result.result
      });
    } else {
      return NextResponse.json({
        db: 'down',
        connection: 'direct',
        error: result.error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ Direct database connection test failed:', error);

    return NextResponse.json({
      db: 'down',
      connection: 'direct',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
