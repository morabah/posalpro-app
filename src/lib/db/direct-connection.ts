// Direct Database Connection Handler
// Provides direct PostgreSQL connections as an alternative to Prisma

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

    // Use the direct PostgreSQL connection string
    const connectionString = databaseUrl;

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
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
export async function testDirectConnection(): Promise<{
  success: boolean;
  error?: string;
  result?: any;
}> {
  try {
    const client = getDirectConnection();
    const result = await client.query('SELECT 1 as test, NOW() as timestamp');

    return {
      success: true,
      result: result.rows[0],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
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
