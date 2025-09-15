/**
 * Prisma Configuration Health Check Route
 * Provides detailed information about Prisma client configuration
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { validatePrismaConfiguration } from '@/lib/validation/prisma-config-validator';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const validation = await validatePrismaConfiguration();

    return NextResponse.json({
      status: validation.isValid ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      configuration: {
        engineType: validation.engineType,
        databaseUrl: validation.databaseUrl.replace(/:(.*)@/, ':***@'),
        isDataProxyMode: validation.isDataProxyMode,
        isDirectConnection: validation.isDirectConnection,
        isValid: validation.isValid
      },
      environmentVariables: {
        PRISMA_GENERATE_DATAPROXY: process.env.PRISMA_GENERATE_DATAPROXY || 'not set',
        PRISMA_CLIENT_ENGINE_TYPE: process.env.PRISMA_CLIENT_ENGINE_TYPE || 'not set',
        PRISMA_CLI_QUERY_ENGINE_TYPE: process.env.PRISMA_CLI_QUERY_ENGINE_TYPE || 'not set',
        PRISMA_ENGINE_TYPE: process.env.PRISMA_ENGINE_TYPE || 'not set',
        DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set'
      },
      errors: validation.errors,
      warnings: validation.warnings,
      recommendations: generateRecommendations(validation)
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: process.env.NODE_ENV
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(validation: any): string[] {
  const recommendations: string[] = [];

  if (validation.isDataProxyMode && !validation.databaseUrl.startsWith('prisma://')) {
    recommendations.push('If using Data Proxy, ensure DATABASE_URL starts with prisma://');
  }

  if (validation.isDirectConnection && !validation.databaseUrl.startsWith('postgresql://')) {
    recommendations.push('If using direct connection, ensure DATABASE_URL starts with postgresql://');
  }

  if (validation.engineType === 'none' && validation.isDirectConnection) {
    recommendations.push('Client is in Data Proxy mode but DATABASE_URL suggests direct connection. Check Prisma client generation.');
  }

  if (validation.engineType !== 'none' && validation.isDataProxyMode) {
    recommendations.push('Client is in direct connection mode but DATABASE_URL suggests Data Proxy. Check Prisma client generation.');
  }

  if (process.env.PRISMA_GENERATE_DATAPROXY === 'true' && validation.isDirectConnection) {
    recommendations.push('Set PRISMA_GENERATE_DATAPROXY=false for direct PostgreSQL connections');
  }

  if (process.env.PRISMA_GENERATE_DATAPROXY === 'false' && validation.isDataProxyMode) {
    recommendations.push('Set PRISMA_GENERATE_DATAPROXY=true for Data Proxy connections');
  }

  return recommendations;
}
