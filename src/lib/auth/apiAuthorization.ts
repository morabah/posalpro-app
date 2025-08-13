/**
 * API Authorization Utility
 * Standardized permission validation for API endpoints
 */

import { logger } from '@/utils/logger';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthorizationContext {
  userId: string;
  roles: string[];
  permissions: string[];
  resourceId?: string;
  resourceOwner?: string;
}

export interface PermissionCheck {
  resource: string;
  action: string;
  scope?: 'ALL' | 'TEAM' | 'OWN';
  context?: Record<string, unknown>;
}

/**
 * Validate user permissions for API endpoints
 */
export async function validateApiPermission(
  req: NextRequest,
  requiredPermission: string | PermissionCheck,
  context?: Record<string, unknown>
): Promise<AuthorizationContext> {
  const token = await getToken({ req });

  if (!token) {
    logger.warn('[API Auth] No valid token found', { path: req.nextUrl.pathname });
    const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    throw res;
  }

  const authContext: AuthorizationContext = {
    userId: token.id as string,
    roles: Array.isArray(token.roles) ? token.roles : [],
    permissions: Array.isArray(token.permissions) ? token.permissions : [],
  };

  // Handle string permission format
  if (typeof requiredPermission === 'string') {
    if (!hasPermission(authContext.permissions, requiredPermission)) {
      logger.warn('[API Auth] Permission denied', {
        userId: authContext.userId,
        required: requiredPermission,
        path: req.nextUrl.pathname,
      });
      const res = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      throw res;
    }
    return authContext;
  }

  // Handle complex permission check
  const permissionString = `${requiredPermission.resource}:${requiredPermission.action}`;

  // Check basic permission
  if (!hasPermission(authContext.permissions, permissionString)) {
    // Check if user has scope-based access
    if (requiredPermission.scope === 'OWN' && context?.resourceOwner === authContext.userId) {
      return authContext;
    }

    if (
      requiredPermission.scope === 'TEAM' &&
      context?.userTeam &&
      context?.resourceTeam === context?.userTeam
    ) {
      return authContext;
    }

    logger.warn('[API Auth] Complex permission denied', {
      userId: authContext.userId,
      required: permissionString,
      scope: requiredPermission.scope,
      context: context ? Object.keys(context) : [],
      path: req.nextUrl.pathname,
    });
    const res = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    throw res;
  }

  return authContext;
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  // Check for exact permission match
  if (userPermissions.includes(requiredPermission)) return true;

  // Check for wildcard permissions
  if (userPermissions.includes('*:*')) return true;

  // Check for resource-level wildcard (e.g., 'proposals:*')
  const [resource] = requiredPermission.split(':');
  if (userPermissions.includes(`${resource}:*`)) return true;

  return false;
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(userRoles: string[], requiredRoles: string | string[]): boolean {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  // Check for super admin roles
  if (userRoles.includes('System Administrator') || userRoles.includes('Administrator')) {
    return true;
  }

  return roles.some(role => userRoles.includes(role));
}

/**
 * Validate admin access
 */
export async function validateAdminAccess(req: NextRequest): Promise<AuthorizationContext> {
  return validateApiPermission(req, 'admin:access');
}

/**
 * Validate resource ownership
 */
export async function validateResourceOwnership(
  req: NextRequest,
  resourceOwnerId: string,
  fallbackPermission?: string
): Promise<AuthorizationContext> {
  const token = await getToken({ req });

  if (!token) {
    throw new Error('Authentication required');
  }

  const authContext: AuthorizationContext = {
    userId: token.id as string,
    roles: Array.isArray(token.roles) ? token.roles : [],
    permissions: Array.isArray(token.permissions) ? token.permissions : [],
  };

  // Check if user owns the resource
  if (authContext.userId === resourceOwnerId) {
    return authContext;
  }

  // Check fallback permission if provided
  if (fallbackPermission && hasPermission(authContext.permissions, fallbackPermission)) {
    return authContext;
  }

  // Check for super admin access
  if (hasRole(authContext.roles, ['System Administrator', 'Administrator'])) {
    return authContext;
  }

  logger.warn('[API Auth] Resource ownership validation failed', {
    userId: authContext.userId,
    resourceOwner: resourceOwnerId,
    fallbackPermission,
    path: req.nextUrl.pathname,
  });

  throw new Error('Access denied: insufficient permissions or ownership');
}

/**
 * Create permission validation middleware
 */
export function createPermissionMiddleware(permission: string | PermissionCheck) {
  return async (req: NextRequest) => {
    return await validateApiPermission(req, permission);
  };
}

/**
 * Audit permission check
 */
export async function auditPermissionCheck(
  authContext: AuthorizationContext,
  permission: string,
  granted: boolean,
  resource?: string,
  resourceId?: string
) {
  try {
    // In a real implementation, this would log to audit system
    logger.info('[Permission Audit]', {
      userId: authContext.userId,
      permission,
      granted,
      resource,
      resourceId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[Permission Audit] Failed to log audit event', error);
  }
}
