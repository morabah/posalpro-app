import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simulate a server error for testing
    console.error('[TestErrorEndpoint] Simulated server error for testing purposes');

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Simulated server error for testing',
        code: 'TEST_SERVER_ERROR',
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('[TestErrorEndpoint] Simulated server error:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Simulated server error for testing',
        code: 'TEST_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
