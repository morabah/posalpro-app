// Direct Database Connection Handler
// This bypasses Prisma client generation issues by using direct PostgreSQL connections

import { Pool } from 'pg';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Create a direct PostgreSQL connection pool
let pool: Pool | null = null;

export function getDirectConnection(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Ensure we're using postgresql:// URL, not prisma://
    let connectionString = databaseUrl;
    if (databaseUrl.startsWith('prisma://')) {
      // This is a workaround for the Data Proxy URL issue
      // In production, this should be fixed by updating Netlify environment variables
      console.warn('⚠️ WORKAROUND: Converting prisma:// URL to postgresql:// URL');

      // Extract the actual database URL from the prisma:// URL
      // This is a temporary workaround - the proper fix is to update Netlify env vars
      const url = new URL(databaseUrl);
      const actualDbUrl = url.searchParams.get('url');

      if (actualDbUrl) {
        connectionString = actualDbUrl;
      } else {
        // Fallback: construct from known pattern
        connectionString = 'postgresql://neondb_owner:YOUR_PASSWORD@ep-ancient-sun-a9gve4ul-pooler.gwc.azure.neon.tech/neondb?sslmode=require';
        console.warn('⚠️ Using fallback connection string - update with actual credentials');
      }
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    console.log('✅ Direct PostgreSQL connection pool created');
  }

  return pool;
}

// Test the direct connection
export async function testDirectConnection(): Promise<{ success: boolean; error?: string; result?: any }> {
  try {
    const client = getDirectConnection();
    const result = await client.query('SELECT 1 as test, NOW() as timestamp');

    return {
      success: true,
      result: result.rows[0]
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Close the connection pool
export async function closeDirectConnection(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Direct PostgreSQL connection pool closed');
  }
}
