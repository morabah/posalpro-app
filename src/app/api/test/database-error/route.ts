import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simulate a database connection error
    console.error('[TestDatabaseEndpoint] Simulated database connection error for testing');

    return NextResponse.json(
      {
        error: 'Database Connection Error',
        message: 'Simulated database error for testing',
        code: 'TEST_DATABASE_ERROR',
      },
      { status: 503 }
    );
  } catch (error) {
    console.error('[TestDatabaseEndpoint] Simulated database error:', error);

    return NextResponse.json(
      {
        error: 'Database Connection Error',
        message: 'Simulated database error for testing',
        code: 'TEST_DATABASE_ERROR',
      },
      { status: 503 }
    );
  }
}
