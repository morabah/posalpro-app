/**
 * Multi-Tenant Context Management
 * Provides tenant context throughout the application
 */

import { logDebug } from './logger';

export interface TenantContext {
  tenantId: string;
  tenantName?: string;
  domain?: string;
  subdomain?: string;
}

/**
 * Get current tenant context
 * In a real application, this would come from:
 * - JWT token payload
 * - Request headers (X-Tenant-ID)
 * - Subdomain routing
 * - Database lookup based on user
 */
export function getCurrentTenant(): TenantContext {
  // For development, we'll use a default tenant
  // In production, this would be determined by the request context

  const tenantId =
    process.env.DEFAULT_TENANT_ID || process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'tenant_default';

  logDebug('Retrieved current tenant context', {
    component: 'TenantContext',
    operation: 'getCurrentTenant',
    tenantId,
  });

  return {
    tenantId,
    tenantName: 'Default Tenant',
    domain: process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost',
  };
}

/**
 * Validate tenant access
 * Ensures the current user has access to the specified tenant
 */
export function validateTenantAccess(tenantId: string): boolean {
  const currentTenant = getCurrentTenant();
  return currentTenant.tenantId === tenantId;
}

/**
 * Get tenant-scoped query filter
 * Returns a Prisma where clause for tenant filtering
 */
export function getTenantFilter(tenantId?: string): { tenantId: string } {
  const tenant = tenantId ? { tenantId } : getCurrentTenant();
  return { tenantId: tenant.tenantId };
}

/**
 * Apply tenant filtering to Prisma queries
 */
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
    };
  }

  return {
    ...query,
    where: tenantFilter,
  };
}
