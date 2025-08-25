// API route wrapper with authentication, RBAC, validation, and logging
import { authOptions } from '@/lib/auth';
import { badRequest, errorToJson, forbidden, unauthorized } from '@/lib/errors';
import { logError, logInfo } from '@/lib/logger';
import { getOrCreateRequestId } from '@/lib/requestId';
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
        let query: Q extends z.ZodTypeAny ? z.infer<Q> : undefined = undefined;
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
        }

        // Parse request body
        let body: B extends z.ZodTypeAny ? z.infer<B> : undefined = undefined;
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
        }

        // Call the handler
        const response = await handler({
          req,
          user,
          query,
          body,
          requestId,
        });

        // Add request ID to response headers
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('x-request-id', requestId);

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
        const response = await handler({
          req,
          user: { id: 'anonymous', email: 'anonymous', roles: undefined },
          query: undefined as any,
          body: undefined as any,
          requestId,
        });

        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('x-request-id', requestId);

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
      const status = error instanceof Error && 'status' in error ? (error as any).status : 500;
      const payload = errorToJson(error);

      logError('route_request_error', {
        path: url.pathname,
        method: req.method,
        status,
        duration,
        requestId,
        error: payload,
      });

      return new Response(JSON.stringify(payload), {
        status,
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': requestId,
        },
      });
    }
  };
}

// Import the badRequest helper
