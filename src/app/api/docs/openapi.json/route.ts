import { createRoute } from '@/lib/api/route';
import { logError } from '@/lib/logger';
import { generateOpenAPISpec } from '@/lib/openapi/generator';

export const GET = createRoute({ requireAuth: false, apiVersion: '1' }, async () => {
  try {
    const doc = await generateOpenAPISpec();
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
});

