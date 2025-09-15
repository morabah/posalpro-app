import { logError } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Force Node.js runtime to avoid Edge Function conflicts with Prisma

// Simple OpenAPI route without environment dependencies
export const GET = async () => {
  try {
    // Basic OpenAPI spec without environment dependencies
    const doc = {
      openapi: '3.0.3',
      info: {
        title: 'PosalPro MVP2 API',
        version: '1.0.0',
        description: 'Proposal management API'
      },
      servers: [{ url: '/api' }],
      paths: {
        '/auth/login': {
          post: {
            summary: 'User login',
            responses: {
              200: { description: 'Login successful' },
              401: { description: 'Invalid credentials' }
            }
          }
        }
      }
    };

    return new Response(JSON.stringify(doc, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    logError('openapi_generation_failed', error);
    return new Response(JSON.stringify({ ok: false, message: 'Failed to generate OpenAPI spec' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
