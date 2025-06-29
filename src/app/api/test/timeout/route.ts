import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simulate a timeout by waiting longer than typical timeout thresholds
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay

    return NextResponse.json(
      {
        message: 'This response should have timed out',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[TestTimeoutEndpoint] Timeout test error:', error);

    return NextResponse.json(
      {
        error: 'Request Timeout',
        message: 'Request timed out during testing',
        code: 'TEST_TIMEOUT',
      },
      { status: 408 }
    );
  }
}
