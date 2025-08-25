// Route Wrapper Template for Migration from Bridge Pattern

import { AppError, errorToJson, forbidden, unauthorized } from '@/lib/errors';
import { logError, logInfo } from '@/lib/logger';
import { getOrCreateRequestId } from '@/lib/requestId';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

type Role = 'admin' | 'sales' | 'viewer';

export function createRoute<Q extends z.ZodTypeAny | undefined, B extends z.ZodTypeAny | undefined>(
  cfg: {
    roles?: Role[];
    query?: Q;
    body?: B;
  },
  handler: (a: {
    req: Request;
    user: { id: string; role?: Role };
    query: Q extends z.ZodTypeAny ? z.infer<Q> : undefined;
    body: B extends z.ZodTypeAny ? z.infer<B> : undefined;
  }) => Promise<Response>
) {
  return async (req: Request) => {
    const rid = getOrCreateRequestId(req);
    const url = new URL(req.url);
    const t0 = Date.now();

    try {
      const session = await getServerSession();
      if (!session?.user) throw unauthorized();

      const user = session.user as { id: string; role?: Role };
      if (cfg.roles && (!user.role || !cfg.roles.includes(user.role))) throw forbidden();

      const query = cfg.query ? cfg.query.parse(Object.fromEntries(url.searchParams)) : undefined;
      const body = cfg.body && req.method !== 'GET' ? cfg.body.parse(await req.json()) : undefined;

      const res = await handler({
        req,
        user,
        query: query as any,
        body: body as any,
      });

      const h = new Headers(res.headers);
      h.set('x-request-id', rid);

      logInfo('route_ok', {
        path: url.pathname,
        method: req.method,
        status: res.status,
        ms: Date.now() - t0,
        rid,
      });

      return new Response(res.body, { ...res, headers: h });
    } catch (e) {
      const status = e instanceof AppError ? e.status : 500;
      const payload = errorToJson(e);

      logError('route_err', {
        path: url.pathname,
        method: req.method,
        status,
        ms: Date.now() - t0,
        rid,
        payload,
      });

      return new Response(JSON.stringify(payload), {
        status,
        headers: { 'content-type': 'application/json', 'x-request-id': rid },
      });
    }
  };
}
