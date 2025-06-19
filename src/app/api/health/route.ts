/**
 * PosalPro MVP2 - System Health Check API Endpoint
 * Simplified for Netlify serverless environment
 */

import { NextResponse } from 'next/server';

interface SimpleHealthCheck {
  status: 'healthy' | 'error';
  timestamp: string;
  environment: string;
  message: string;
}

export async function GET(): Promise<NextResponse> {
  try {
    const health: SimpleHealthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      message: 'PosalPro MVP2 API is running'
    };

    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    const errorHealth: SimpleHealthCheck = {
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      message: error instanceof Error ? error.message : 'Health check failed'
    };

    return NextResponse.json(errorHealth, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}