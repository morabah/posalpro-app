// API route wrapper with authentication, RBAC, validation, and logging
import { authOptions } from '@/lib/auth';
import {
  badRequest,
  errorHandlingService,
  forbidden,
  StandardError,
  unauthorized,
} from '@/lib/errors';
import { logError, logInfo } from '@/lib/logger';
import { getCache, setCache } from '@/lib/redis';
import { getOrCreateRequestId } from '@/lib/requestId';
import { createHash } from 'crypto';
import { getFeatureFlags } from '@/lib/env';
import { runWithTenantContext } from '@/lib/tenant';
import { EntitlementService } from '@/lib/services/EntitlementService';
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
  /** Optional per-route entitlements required (by key). */
  entitlements?: string[];
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

        const user = session.user as {
          id: string;
          email: string;
          roles?: string[];
          tenantId: string;
        };

        // Role-based access control
        if (
          config.roles &&
          (!user.roles || !user.roles.some(role => config.roles!.includes(role as Role)))
        ) {
          throw forbidden(`Access denied. Required roles: ${config.roles.join(', ')}`);
        }

        // Optional seat enforcement (server-side guardrail). Admins bypass.
        try {
          const enforceSeats = process.env.SEAT_ENFORCEMENT === 'true';
          if (enforceSeats) {
            const isAdmin = (user.roles || []).some(r => r === 'Administrator' || r === 'System Administrator');
            if (!isAdmin) {
              const { getSeatStatus } = await import('@/lib/services/subscriptionService');
              const status = await getSeatStatus(user.tenantId);
              if (!status.hasAvailableSeat) {
                throw forbidden('Seat limit reached. Contact your administrator.');
              }
            }
          }
        } catch (e) {
          if (e instanceof StandardError) throw e;
          throw forbidden('Seat enforcement error');
        }

        // Optional subscription status enforcement (server-side guardrail). Admins bypass.
        try {
          const enforceSub = process.env.SUBSCRIPTION_ENFORCEMENT === 'true';
          if (enforceSub) {
            const isAdmin = (user.roles || []).some(r => r === 'Administrator' || r === 'System Administrator');
            if (!isAdmin) {
              const { getSubscriptionStatus } = await import('@/lib/services/subscriptionService');
              const sub = await getSubscriptionStatus(user.tenantId);
              const allowed = sub.status === 'ACTIVE' || sub.status === 'TRIALING';
              if (!allowed) {
                throw forbidden('Subscription inactive. Please update billing.');
              }
            }
          }
        } catch (e) {
          if (e instanceof StandardError) throw e;
          throw forbidden('Subscription enforcement error');
        }

        // Tenant scope check: if request carries x-tenant-id header or subdomain, ensure match
        const headerTenant = req.headers.get('x-tenant-id');
        if (headerTenant && user.tenantId && headerTenant !== user.tenantId) {
          throw forbidden('Tenant mismatch');
        }

        // Minimal paid feature gating using feature flags (server-side guard rail)
        if ((config as any).requireAuth !== false && (config as any).requirePaid) {
          const flags = getFeatureFlags();
          const enforce = process.env.PAID_FEATURES_ENFORCE === 'true';
          const paidOn = flags.enableExperimentalFeatures || process.env.PAID_FEATURES_DEFAULT === 'true';
          if (enforce && !paidOn) {
            throw forbidden('Upgrade required');
          }
        }

        // Entitlement enforcement: require all listed entitlements for the tenant
        if (config.entitlements && config.entitlements.length > 0) {
          const ok = await EntitlementService.hasEntitlements((user as any).tenantId, config.entitlements);
          if (!ok) {
            throw forbidden('Missing entitlements');
          }
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

        // Call the handler within tenant async context for Prisma middleware
        const response = await runWithTenantContext(
          { tenantId: user.tenantId } as any,
          async () =>
            handler({
              req,
              user,
              query,
              body,
              requestId,
            })
        );

        // Add request ID and API headers to response
        const responseHeaders = new Headers((response as Response).headers);
        decorate(responseHeaders);
        if (user.tenantId) responseHeaders.set('x-tenant-id', user.tenantId);

        // Persist idempotent response if applicable
        if (cacheKey) {
          try {
            const ttl = config.idempotency?.ttlSeconds ?? 60 * 60 * 24; // 24h
            const bodyText = await (response as Response).clone().text();
            await setCache(
              cacheKey,
              {
                status: (response as Response).status,
                headers: pickSafeHeaders((response as Response).headers),
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
          status: (response as Response).status,
          duration,
          requestId,
          userId: user.id,
        });

        return new Response((response as Response).body, {
          status: (response as Response).status,
          statusText: (response as Response).statusText,
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

        const responseHeaders = new Headers((response as Response).headers);
        decorate(responseHeaders);

        // Idempotency (unauth path)
        if (idempEnabledUnauth && idempKeyUnauth) {
          const payloadHash = hash({ queryParams: Object.fromEntries(url.searchParams) });
          const cacheKey = `idemp:anonymous:${method}:${url.pathname}:${idempKeyUnauth}:${payloadHash}`;
          try {
            const ttl = config.idempotency?.ttlSeconds ?? 60 * 60 * 24; // 24h
            const bodyText = await (response as Response).clone().text();
            await setCache(
              cacheKey,
              {
                status: (response as Response).status,
                headers: pickSafeHeaders((response as Response).headers),
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
          status: (response as Response).status,
          duration,
          requestId,
          userId: 'anonymous',
        });

        return new Response((response as Response).body, {
          status: (response as Response).status,
          statusText: (response as Response).statusText,
          headers: responseHeaders,
        });
      }
    } catch (error) {
      // Handle errors using ProblemDetails format
      const duration = Date.now() - startTime;

      // Create ProblemDetails response
      const problemResponse = errorHandlingService.createApiErrorResponse(
        error,
        'An error occurred',
        undefined,
        500
      );

      // Get the status from the response
      const status = problemResponse.status;

      // Log the error (already done in createApiErrorResponse)
      logError('route_request_error', {
        path: url.pathname,
        method: req.method,
        status,
        duration,
        requestId,
        error: error instanceof StandardError ? error.message : 'Unknown error',
      });

      // Add request headers to the response
      const responseHeaders = new Headers(problemResponse.headers);
      decorate(responseHeaders);

      return new Response(problemResponse.body, {
        status,
        headers: responseHeaders,
      });
    }
  };
}

// Import the badRequest helper
