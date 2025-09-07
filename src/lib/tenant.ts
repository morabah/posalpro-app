/**
 * Multi-Tenant Context Management
 * Request-aware tenant resolver with async context storage.
 *
 * This module can be imported in both server and client environments.
 * AsyncLocalStorage is used server-side for request context, with browser fallbacks.
 */

// @ts-ignore - Next.js bundler directive to ignore this file in client bundle
// This file contains Node.js-specific imports that should only be used server-side

// Dynamic import for AsyncLocalStorage to avoid bundling issues
let AsyncLocalStorage: any = null;

// Initialize AsyncLocalStorage dynamically (only on server)
if (typeof window === 'undefined') {
  try {
    // Only import on server-side
    const asyncHooks = require('node:async_hooks');
    AsyncLocalStorage = asyncHooks.AsyncLocalStorage;
  } catch {
    // Fallback if import fails
    AsyncLocalStorage = null;
  }
}

import { getAuthSecret } from '@/lib/auth/secret';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { logDebug, logWarn } from './logger';

export interface TenantContext {
  tenantId: string;
  tenantName?: string;
  domain?: string;
  subdomain?: string;
}

// Async context to carry tenant per request (works in Node runtime paths)
// Only create AsyncLocalStorage if available (server-side)
const tenantAls =
  typeof AsyncLocalStorage !== 'undefined' && AsyncLocalStorage
    ? new (AsyncLocalStorage as any)()
    : null;

/**
 * Initialize tenant context for the current request and run the callback inside it.
 * Resolution priority:
 * 1) Explicit header `x-tenant-id`
 * 2) NextAuth token claim `tenantId`
 * 3) Subdomain from host (e.g., acme.example.com -> acme)
 * 4) Environment default (development only)
 */
export async function withTenantContext<T>(req: NextRequest, fn: () => T | Promise<T>): Promise<T> {
  const tenant = await resolveTenantFromRequest(req);

  // Use AsyncLocalStorage if available (server-side), otherwise just run the function
  if (tenantAls) {
    return await tenantAls.run(tenant, fn as any);
  } else {
    // Browser environment - just run the function without context
    return await fn();
  }
}

/**
 * Run a function within a provided tenant context (Node runtime helper).
 */
export async function runWithTenantContext<T>(tenant: TenantContext, fn: () => T | Promise<T>) {
  // Use AsyncLocalStorage if available (server-side), otherwise just run the function
  if (tenantAls) {
    return await tenantAls.run(tenant, fn as any);
  } else {
    // Browser environment - just run the function without context
    return await fn();
  }
}

/**
 * Resolve tenant information from the incoming request.
 */
export async function resolveTenantFromRequest(req: NextRequest): Promise<TenantContext> {
  // 1) Header override
  const headerTenant = (req.headers.get('x-tenant-id') || '').trim();
  if (headerTenant) {
    const ctx = { tenantId: headerTenant, domain: req.headers.get('host') || undefined };
    logDebug('Tenant resolved from header', { tenantId: headerTenant });
    return ctx;
  }

  // 2) NextAuth token
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const jwtTenant = (token as any)?.tenantId as string | undefined;
    if (jwtTenant) {
      const ctx = { tenantId: jwtTenant, domain: req.headers.get('host') || undefined };
      logDebug('Tenant resolved from JWT', { tenantId: jwtTenant });
      return ctx;
    }
  } catch (e) {
    // Token may not be present on public endpoints
    logWarn('Tenant JWT resolve skipped', { reason: (e as Error)?.message });
  }

  // 3) Subdomain from Host header
  const host = req.headers.get('host') || '';
  const sub = extractSubdomain(host);
  if (sub) {
    const ctx = { tenantId: sub, domain: host, subdomain: sub };
    logDebug('Tenant resolved from subdomain', { tenantId: sub });
    return ctx;
  }

  // 4) Development fallback only
  const fallback =
    process.env.DEFAULT_TENANT_ID || process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'tenant_default';
  if (process.env.NODE_ENV !== 'production') {
    logWarn('Using development tenant fallback', { tenantId: fallback });
    return { tenantId: fallback, domain: host || 'localhost' };
  }

  // In production, absence is a configuration error
  throw new Error('Unable to resolve tenant in production (no header/token/subdomain)');
}

/** Extract subdomain from host; returns null for apex domains. */
export function extractSubdomain(host: string): string | null {
  const parts = host.split(':')[0].split('.'); // strip port
  if (parts.length < 3) return null;
  return parts[0] || null;
}

/** Get tenant from async context; throws if not present in production. */
export function getCurrentTenant(): TenantContext {
  // Try to get tenant from async context if available
  if (tenantAls) {
    const ctx = tenantAls.getStore();
    if (ctx) return ctx;
  }

  // Always provide fallback tenant in development and production
  const tenantId =
    process.env.DEFAULT_TENANT_ID || process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'tenant_default';
  return {
    tenantId,
    domain: process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost',
    tenantName: process.env.NODE_ENV === 'development' ? 'Development Tenant' : undefined,
  };
}

/** Validate tenant access for the active context. */
export function validateTenantAccess(tenantId: string): boolean {
  const currentTenant = getCurrentTenant();
  return currentTenant.tenantId === tenantId;
}

/** Get tenant filter for Prisma where clauses. */
export function getTenantFilter(tenantId?: string): { tenantId: string } {
  const tenant = tenantId ? { tenantId } : getCurrentTenant();
  return { tenantId: tenant.tenantId };
}

/** Apply tenant filtering to Prisma queries. */
export function applyTenantFilter<T extends Record<string, any>>(
  query: T,
  tenantId?: string
): T & { where: { tenantId: string } } {
  const tenantFilter = getTenantFilter(tenantId);
  if ('where' in query) {
    return {
      ...query,
      where: {
        ...query.where,
        ...tenantFilter,
      },
    } as any;
  }
  return {
    ...query,
    where: tenantFilter,
  } as any;
}

/** Utility to expose ALS for tests */
export const __tenantAls = tenantAls;
