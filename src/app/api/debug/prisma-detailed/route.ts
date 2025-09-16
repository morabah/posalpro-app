// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,

      // Environment variables
      environmentVariables: {
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
        DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 20) + '...',
        PRISMA_GENERATE_DATAPROXY: process.env.PRISMA_GENERATE_DATAPROXY,
        PRISMA_CLIENT_ENGINE_TYPE: process.env.PRISMA_CLIENT_ENGINE_TYPE,
        PRISMA_CLI_QUERY_ENGINE_TYPE: process.env.PRISMA_CLI_QUERY_ENGINE_TYPE,
        PRISMA_ENGINE_TYPE: process.env.PRISMA_ENGINE_TYPE,
        PRISMA_CLI_BINARY_TARGETS: process.env.PRISMA_CLI_BINARY_TARGETS,
      },

      // Prisma client instantiation test
      prismaClientTest: {
        canInstantiate: false,
        error: null,
        engineType: 'unknown',
      },

      // File system checks
      fileSystem: {
        prismaClientExists: false,
        prismaClientPath: null as string | null,
        queryEngineExists: false,
        queryEnginePath: null as string[] | null,
      }
    };

    // Test Prisma client instantiation
    try {
      const prisma = new PrismaClient();
      diagnostics.prismaClientTest.canInstantiate = true;

      // Try to get engine type from the client
      try {
        // This might fail if the client is not properly configured
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        diagnostics.prismaClientTest.engineType = 'working';
      } catch (queryError: any) {
        diagnostics.prismaClientTest.error = queryError.message;
        diagnostics.prismaClientTest.engineType = 'error';
      }

      await prisma.$disconnect();
    } catch (instantiationError: any) {
      diagnostics.prismaClientTest.error = instantiationError.message;
    }

    // Check file system
    const fs = await import('fs');
    const path = await import('path');

    const prismaClientPath = path.join(process.cwd(), 'node_modules/.prisma/client');
    const queryEnginePath = path.join(prismaClientPath, 'query-engine');

    diagnostics.fileSystem.prismaClientExists = fs.existsSync(prismaClientPath);
    diagnostics.fileSystem.prismaClientPath = prismaClientPath;

    if (diagnostics.fileSystem.prismaClientExists) {
      // Check for query engine files
      const files = fs.readdirSync(prismaClientPath);
      const queryEngineFiles = files.filter(file =>
        file.includes('query-engine') || file.includes('libquery_engine')
      );
      diagnostics.fileSystem.queryEngineExists = queryEngineFiles.length > 0;
      diagnostics.fileSystem.queryEnginePath = queryEngineFiles;
    }

    return NextResponse.json(diagnostics, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
