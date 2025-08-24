/**
 * Client-side RBAC Hook - Integrates with existing RBAC infrastructure
 *
 * Uses the existing RBACManager and securityAuditManager from @/lib/security
 * Component Traceability: US-1.4, US-1.5, H8, H9
 */

'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { logDebug } from '@/lib/logger';
import { securityAuditManager } from '@/lib/security/audit';
import { rbacManager } from '@/lib/security/rbac';
import { useCallback, useMemo } from 'react';

export interface RBACPermission {
  resource: string;
  action: string;
  scope?: 'OWN' | 'TEAM' | 'ALL';
}

export interface RBACContext {
  hasPermission: (permission: string | RBACPermission) => boolean;
  hasRole: (roles: string | string[]) => boolean;
  canCreate: (resource: string) => boolean;
  canRead: (resource: string) => boolean;
  canUpdate: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isContributor: boolean;
  validatePermission: (config: {
    resource: string;
    action: string;
    scope?: 'OWN' | 'TEAM' | 'ALL';
  }) => Promise<boolean>;
}

export function useRBAC(): RBACContext {
  const { user, isAuthenticated } = useAuth();

  const userRoles = useMemo(() => {
    if (!isAuthenticated || !user) return [];
    return Array.isArray(user.roles) ? user.roles : [];
  }, [isAuthenticated, user]);

  const userPermissions = useMemo(() => {
    if (!isAuthenticated || !user) return [];
    return Array.isArray(user.permissions) ? user.permissions : [];
  }, [isAuthenticated, user]);

  // Shared role mapping function
  const mapRoleName = useCallback((roleName: string): string => {
    const roleMapping: Record<string, string> = {
      'System Administrator': 'SYSTEM_ADMINISTRATOR',
      'Proposal Manager': 'PROPOSAL_MANAGER',
      'Subject Matter Expert (SME)': 'SME_CONTRIBUTOR',
      'Content Manager': 'CONTENT_MANAGER',
      'Team Manager': 'TEAM_MANAGER',
      Viewer: 'VIEWER',
    };
    return roleMapping[roleName] || roleName;
  }, []);

  const mappedUserRoles = useMemo(() => {
    return userRoles.map(mapRoleName);
  }, [userRoles, mapRoleName]);

  const isAdmin = useMemo(() => {
    // Check if user has any admin role (both formats)
    const hasAdminRole =
      rbacManager.hasRole(mappedUserRoles, 'SYSTEM_ADMINISTRATOR') ||
      userRoles.some(
        role => role.toLowerCase().includes('admin') || role.toLowerCase().includes('administrator')
      );

    logDebug('RBAC: Admin role check', {
      component: 'useRBAC',
      operation: 'isAdmin',
      userRoles,
      mappedUserRoles,
      hasAdminRole,
      userId: user?.id,
    });

    return hasAdminRole;
  }, [userRoles, mappedUserRoles, user?.id]);

  const isManager = useMemo(() => {
    return (
      rbacManager.hasRole(mappedUserRoles, 'TEAM_MANAGER') ||
      rbacManager.hasRole(mappedUserRoles, 'PROPOSAL_MANAGER')
    );
  }, [mappedUserRoles]);

  const isContributor = useMemo(() => {
    return (
      rbacManager.hasRole(mappedUserRoles, 'SME_CONTRIBUTOR') ||
      rbacManager.hasRole(mappedUserRoles, 'VIEWER')
    );
  }, [mappedUserRoles]);

  const hasPermission = useCallback(
    (permission: string | RBACPermission): boolean => {
      if (!isAuthenticated || !user) return false;

      // Admin bypass
      if (isAdmin) {
        logDebug('RBAC: Admin bypass for permission check', {
          component: 'useRBAC',
          operation: 'hasPermission',
          permission:
            typeof permission === 'string'
              ? permission
              : `${permission.resource}:${permission.action}`,
          userId: user.id,
        });
        return true;
      }

      // Handle string permission
      if (typeof permission === 'string') {
        const hasPerm = userPermissions.includes(permission);
        logDebug('RBAC: Permission check result', {
          component: 'useRBAC',
          operation: 'hasPermission',
          permission,
          hasPermission: hasPerm,
          userId: user.id,
        });
        return hasPerm;
      }

      // Handle complex permission using existing RBAC infrastructure
      const permissionString = `${permission.resource}:${permission.action}`;
      const hasPerm = userPermissions.includes(permissionString);

      logDebug('RBAC: Complex permission check result', {
        component: 'useRBAC',
        operation: 'hasPermission',
        permission: permissionString,
        scope: permission.scope,
        hasPermission: hasPerm,
        userId: user.id,
      });

      return hasPerm;
    },
    [isAuthenticated, user, userPermissions, isAdmin]
  );

  const hasRole = useCallback(
    (roles: string | string[]): boolean => {
      if (!isAuthenticated || !user) return false;

      const roleArray = Array.isArray(roles) ? roles : [roles];
      const mappedRequiredRoles = roleArray.map(mapRoleName);
      const hasUserRole = mappedRequiredRoles.some(role =>
        rbacManager.hasRole(mappedUserRoles, role)
      );

      logDebug('RBAC: Role check result', {
        component: 'useRBAC',
        operation: 'hasRole',
        requiredRoles: roleArray,
        mappedRequiredRoles,
        userRoles,
        mappedUserRoles,
        hasRole: hasUserRole,
        userId: user.id,
      });

      return hasUserRole;
    },
    [isAuthenticated, user, mappedUserRoles, mapRoleName]
  );

  const validatePermission = useCallback(
    async (config: {
      resource: string;
      action: string;
      scope?: 'OWN' | 'TEAM' | 'ALL';
    }): Promise<boolean> => {
      if (!isAuthenticated || !user) return false;

      try {
        // Use the existing RBAC infrastructure
        const result = await rbacManager.validateApiPermission({
          resource: config.resource,
          action: config.action,
          scope: config.scope || 'TEAM',
          context: {
            userId: user.id,
            userRoles,
            userPermissions,
          },
        });

        // Log the validation attempt
        securityAuditManager.logAccess({
          userId: user.id,
          resource: config.resource,
          action: config.action,
          scope: config.scope || 'TEAM',
          success: result,
          timestamp: new Date().toISOString(),
          metadata: {
            operationType: 'client_side_validation',
            component: 'useRBAC',
          },
        });

        return result;
      } catch (error) {
        logDebug('RBAC: Permission validation failed', {
          component: 'useRBAC',
          operation: 'validatePermission',
          resource: config.resource,
          action: config.action,
          scope: config.scope,
          userId: user.id,
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      }
    },
    [isAuthenticated, user, userRoles, userPermissions]
  );

  const canCreate = useCallback(
    (resource: string): boolean => {
      return hasPermission(`${resource}:create`);
    },
    [hasPermission]
  );

  const canRead = useCallback(
    (resource: string): boolean => {
      return hasPermission(`${resource}:read`);
    },
    [hasPermission]
  );

  const canUpdate = useCallback(
    (resource: string): boolean => {
      return hasPermission(`${resource}:update`);
    },
    [hasPermission]
  );

  const canDelete = useCallback(
    (resource: string): boolean => {
      return hasPermission(`${resource}:delete`);
    },
    [hasPermission]
  );

  return {
    hasPermission,
    hasRole,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    isAdmin,
    isManager,
    isContributor,
    validatePermission,
  };
}
