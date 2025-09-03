// API route wrapper with authentication, RBAC, validation, and logging
import { authOptions } from '@/lib/auth';
import { badRequest, forbidden, StandardError, unauthorized } from '@/lib/errors';
import { logError, logInfo } from '@/lib/logger';
import { getCache, setCache } from '@/lib/redis';
import { getOrCreateRequestId } from '@/lib/requestId';
import { createHash } from 'crypto';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

// Role types
export type Role =
  | 'admin'
  | 'sales'
  | 'viewer'
  | 'manager'
  | 'System Administrator'
  | 'Administrator';

// Route configuration interface
export interface RouteConfig<
  Q extends z.ZodTypeAny | undefined,
  B extends z.ZodTypeAny | undefined,
> {
  roles?: Role[];
  query?: Q;
  body?: B;
  requireAuth?: boolean;
  /**
   * Optional API deprecation metadata for this route.
   * When provided, standard headers will be added:
   * - Deprecation: true
   * - Sunset: <RFC 8594 date>
   * - Link: </docs/deprecations#...>; rel="deprecation"
   */
  deprecated?: {
    sunset?: string; // e.g., Wed, 11 Nov 2026 23:59:59 GMT
    link?: string; // URL to deprecation docs
    message?: string; // Optional textual context (non-standard header)
  };
  /**
   * API version to be advertised via headers. Defaults to '1'.
   */
  apiVersion?: string;
  /**
   * Idempotency options. When an `Idempotency-Key` header is present on
   * mutating requests (POST/PUT/PATCH/DELETE), responses will be cached and
   * re-served for the same key + route + user + payload.
   */
  idempotency?: {
    enabled?: boolean; // defaults to true for mutating methods
    ttlSeconds?: number; // defaults to 24h
    scope?: 'user' | 'global'; // key includes user by default
  };
}

// Handler function type
export type RouteHandler<
  Q extends z.ZodTypeAny | undefined,
  B extends z.ZodTypeAny | undefined,
> = (params: {
  req: Request;
  user: { id: string; email: string; roles?: string[] };
  query: Q extends z.ZodTypeAny ? z.infer<Q> : undefined;
  body: B extends z.ZodTypeAny ? z.infer<B> : undefined;
  requestId: string;
}) => Promise<Response>;

// Main route wrapper function
export function createRoute<Q extends z.ZodTypeAny | undefined, B extends z.ZodTypeAny | undefined>(
  config: RouteConfig<Q, B>,
  handler: RouteHandler<Q, B>
) {
  return async (req: Request): Promise<Response> => {
    const requestId = getOrCreateRequestId(req);
    const url = new URL(req.url);
    const startTime = Date.now();
    const method = req.method.toUpperCase();

    // Helper: decorate response headers consistently
    const decorate = (headers: Headers) => {
      headers.set('x-request-id', requestId);
      headers.set('x-api-version', config.apiVersion ?? '1');
      if (config.deprecated) {
        headers.set('Deprecation', 'true');
        if (config.deprecated.sunset) headers.set('Sunset', config.deprecated.sunset);
        if (config.deprecated.link)
          headers.append('Link', `${config.deprecated.link}; rel="deprecation"`);
        if (config.deprecated.message)
          headers.set('x-api-deprecation-message', config.deprecated.message);
      }
    };

    // Helper: compute stable hash of arbitrary input
    const hash = (input: unknown) =>
      createHash('sha256')
        .update(typeof input === 'string' ? input : JSON.stringify(input))
        .digest('hex');

    // Helper: minimal safe header subset for caching
    const pickSafeHeaders = (h: HeadersInit) => {
      const headers = new Headers(h);
      const out = new Headers();
      const allow = [
        'content-type',
        'cache-control',
        'deprecation',
        'sunset',
        'link',
        'x-api-version',
        'x-api-deprecation-message',
      ];
      for (const [k, v] of headers.entries()) {
        if (allow.includes(k.toLowerCase())) out.set(k, v);
      }
      return Object.fromEntries(out.entries());
    };

    try {
      // Log request start
      logInfo('route_request_start', {
        path: url.pathname,
        method: req.method,
        requestId,
        userAgent: req.headers.get('user-agent'),
      });

      // Authentication check
      if (config.requireAuth !== false) {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
          throw unauthorized('Authentication required');
        }

        const user = session.user as { id: string; email: string; roles?: string[] };

        // Role-based access control
        if (
          config.roles &&
          (!user.roles || !user.roles.some(role => config.roles!.includes(role as Role)))
        ) {
          throw forbidden(`Access denied. Required roles: ${config.roles.join(', ')}`);
        }

        // Parse query parameters
        let query: Q extends z.ZodTypeAny ? z.infer<Q> : undefined;
        if (config.query) {
          try {
            const queryParams = Object.fromEntries(url.searchParams);
            query = config.query.parse(queryParams) as any;
          } catch (error) {
            if (error instanceof z.ZodError) {
              throw badRequest('Invalid query parameters', error.errors);
            }
            throw error;
          }
        } else {
          query = undefined as any;
        }

        // Parse request body
        let body: B extends z.ZodTypeAny ? z.infer<B> : undefined;
        if (config.body && req.method !== 'GET') {
          try {
            const contentType = req.headers.get('content-type');
            if (contentType?.includes('application/json')) {
              const jsonBody = await req.json();
              body = config.body.parse(jsonBody) as any;
            } else {
              throw badRequest('Content-Type must be application/json');
            }
          } catch (error) {
            if (error instanceof z.ZodError) {
              throw badRequest('Invalid request body', error.errors);
            }
            throw error;
          }
        } else {
          body = undefined as any;
        }

        // Idempotency (auth path)
        const idempotencyKey = req.headers.get('idempotency-key') || undefined;
        const idempotencyEnabled =
          (config.idempotency?.enabled ?? true) &&
          ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
        let cacheKey: string | null = null;
        if (idempotencyEnabled && idempotencyKey) {
          const scopePart = (config.idempotency?.scope ?? 'user') === 'user' ? user.id : 'global';
          const payloadHash = hash({ body, queryParams: Object.fromEntries(url.searchParams) });
          cacheKey = `idemp:${scopePart}:${method}:${url.pathname}:${idempotencyKey}:${payloadHash}`;
          const cached = await getCache<{
            status: number;
            headers: Record<string, string>;
            body: string;
          }>(cacheKey);
          if (cached) {
            const headers = new Headers(cached.headers);
            decorate(headers);
            headers.set('x-idempotent-replay', 'true');
            logInfo('route_idempotent_replay', {
              path: url.pathname,
              method,
              requestId,
              userId: user.id,
            });
            return new Response(cached.body, { status: cached.status, headers });
          }
        }

        // Call the handler
        const response = await handler({
          req,
          user,
          query,
          body,
          requestId,
        });

        // Add request ID and API headers to response
        const responseHeaders = new Headers(response.headers);
        decorate(responseHeaders);

        // Persist idempotent response if applicable
        if (cacheKey) {
          try {
            const ttl = config.idempotency?.ttlSeconds ?? 60 * 60 * 24; // 24h
            const bodyText = await response.clone().text();
            await setCache(
              cacheKey,
              {
                status: response.status,
                headers: pickSafeHeaders(response.headers),
                body: bodyText,
              },
              ttl
            );
          } catch (e) {
            // Swallow cache errors; never break main path
            logError('route_idempotent_cache_write_failed', {
              error: (e as Error)?.message,
              requestId,
            });
          }
        }

        // Log successful response
        const duration = Date.now() - startTime;
        logInfo('route_request_success', {
          path: url.pathname,
          method: req.method,
          status: response.status,
          duration,
          requestId,
          userId: user.id,
        });

        return new Response(response.body, {
          ...response,
          headers: responseHeaders,
        });
      } else {
        // No authentication required
        // Idempotency pre-check (unauth path)
        const idempKeyUnauth = req.headers.get('idempotency-key') || undefined;
        const idempEnabledUnauth =
          (config.idempotency?.enabled ?? true) &&
          ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
        if (idempEnabledUnauth && idempKeyUnauth) {
          const payloadHash = hash({ queryParams: Object.fromEntries(url.searchParams) });
          const preKey = `idemp:anonymous:${method}:${url.pathname}:${idempKeyUnauth}:${payloadHash}`;
          const cached = await getCache<{
            status: number;
            headers: Record<string, string>;
            body: string;
          }>(preKey);
          if (cached) {
            const headers = new Headers(cached.headers);
            decorate(headers);
            headers.set('x-idempotent-replay', 'true');
            logInfo('route_idempotent_replay', {
              path: url.pathname,
              method,
              requestId,
              userId: 'anonymous',
            });
            return new Response(cached.body, { status: cached.status, headers });
          }
        }

        // Body parse is optional in unauth path (no schema -> skip)
        const response = await handler({
          req,
          user: { id: 'anonymous', email: 'anonymous', roles: undefined },
          query: undefined as any,
          body: undefined as any,
          requestId,
        });

        const responseHeaders = new Headers(response.headers);
        decorate(responseHeaders);

        // Idempotency (unauth path)
        if (idempEnabledUnauth && idempKeyUnauth) {
          const payloadHash = hash({ queryParams: Object.fromEntries(url.searchParams) });
          const cacheKey = `idemp:anonymous:${method}:${url.pathname}:${idempKeyUnauth}:${payloadHash}`;
          try {
            const ttl = config.idempotency?.ttlSeconds ?? 60 * 60 * 24; // 24h
            const bodyText = await response.clone().text();
            await setCache(
              cacheKey,
              {
                status: response.status,
                headers: pickSafeHeaders(response.headers),
                body: bodyText,
              },
              ttl
            );
          } catch (e) {
            logError('route_idempotent_cache_write_failed', {
              error: (e as Error)?.message,
              requestId,
            });
          }
        }

        const duration = Date.now() - startTime;
        logInfo('route_request_success', {
          path: url.pathname,
          method: req.method,
          status: response.status,
          duration,
          requestId,
          userId: 'anonymous',
        });

        return new Response(response.body, {
          ...response,
          headers: responseHeaders,
        });
      }
    } catch (error) {
      // Handle errors
      const duration = Date.now() - startTime;

      // Determine HTTP status code from error
      let status = 500; // Default to internal server error

      if (error instanceof StandardError) {
        // Use the error code to HTTP status mapping
        const { errorCodeToHttpStatus } = await import('@/lib/errors/ErrorCodes');
        status = errorCodeToHttpStatus[error.code] ?? 500;
      } else if (error instanceof Error && 'status' in error) {
        status = (error as any).status;
      }

      // Return unwrapped response format per CORE_REQUIREMENTS.md §464
      const payload = error instanceof StandardError ? error.message : 'An error occurred';

      logError('route_request_error', {
        path: url.pathname,
        method: req.method,
        status,
        duration,
        requestId,
        error: payload,
      });

      const errorHeaders = new Headers({ 'Content-Type': 'application/json' });
      decorate(errorHeaders);

      return new Response(JSON.stringify(payload), {
        status,
        headers: errorHeaders,
      });
    }
  };
}

// Import the badRequest helper
