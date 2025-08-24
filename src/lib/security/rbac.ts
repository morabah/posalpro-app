/**
 * Role-Based Access Control (RBAC) - CORE_REQUIREMENTS.md Compliant
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: US-1.4 (Security & Compliance), US-1.5 (Audit Trail)
 * - Hypothesis: H8 (Security Compliance), H9 (Audit Transparency)
 * - Acceptance Criteria: ['Permission validation works', 'Scope-based access control', 'Audit integration']
 *
 * COMPLIANCE STATUS:
 * ✅ Structured Logging with metadata
 * ✅ TypeScript Type Safety (no any types)
 * ✅ Performance Optimization with caching
 * ✅ Security audit integration
 */

import { logDebug, logError, logInfo } from '@/lib/logger';
import { securityAuditManager } from './audit';

// ====================
// TypeScript Interfaces
// ====================

export interface RBACContext {
  userId?: string;
  userRoles?: string[];
  userPermissions?: string[];
}

export interface ApiPermissionConfig {
  resource: string;
  action: string;
  scope: 'OWN' | 'TEAM' | 'ALL';
  context: RBACContext;
}

export interface Permission {
  resource: string;
  action: string;
  scope: 'OWN' | 'TEAM' | 'ALL';
}

export interface Role {
  name: string;
  permissions: Permission[];
  description?: string;
}

export interface RBACConfig {
  enableRBAC?: boolean;
  defaultScope?: 'OWN' | 'TEAM' | 'ALL';
  strictMode?: boolean;
}

// ====================
// RBAC Manager
// ====================

/**
 * RBAC Manager - Singleton Pattern
 *
 * Provides centralized role-based access control for API operations
 * including permission validation, scope checking, and audit integration.
 */
class RBACManager {
  private static instance: RBACManager;
  private config: Required<RBACConfig>;
  private roles: Map<string, Role> = new Map();
  private permissionCache: Map<string, boolean> = new Map();

  private constructor(config: RBACConfig = {}) {
    this.config = {
      enableRBAC: config.enableRBAC ?? true,
      defaultScope: config.defaultScope ?? 'TEAM',
      strictMode: config.strictMode ?? true,
    };

    this.initializeDefaultRoles();
  }

  static getInstance(config?: RBACConfig): RBACManager {
    if (!RBACManager.instance) {
      RBACManager.instance = new RBACManager(config);
    }
    return RBACManager.instance;
  }

  // ====================
  // Role Management
  // ====================

  /**
   * Initialize default roles and permissions
   */
  private initializeDefaultRoles(): void {
    // System Administrator - Full access
    this.addRole({
      name: 'SYSTEM_ADMINISTRATOR',
      description: 'Full system access with all permissions',
      permissions: [{ resource: '*', action: '*', scope: 'ALL' }],
    });

    // Team Manager - Team-level access
    this.addRole({
      name: 'TEAM_MANAGER',
      description: 'Team management with team-level permissions',
      permissions: [
        { resource: 'customers', action: '*', scope: 'TEAM' },
        { resource: 'products', action: '*', scope: 'TEAM' },
        { resource: 'proposals', action: '*', scope: 'TEAM' },
        { resource: 'rfps', action: '*', scope: 'TEAM' },
        { resource: 'sme', action: '*', scope: 'TEAM' },
        { resource: 'workflows', action: '*', scope: 'TEAM' },
        { resource: 'dashboard', action: '*', scope: 'TEAM' },
      ],
    });

    // Proposal Manager - Proposal-focused access
    this.addRole({
      name: 'PROPOSAL_MANAGER',
      description: 'Proposal management with limited permissions',
      permissions: [
        { resource: 'proposals', action: '*', scope: 'TEAM' },
        { resource: 'customers', action: 'read', scope: 'TEAM' },
        { resource: 'products', action: 'read', scope: 'TEAM' },
        { resource: 'rfps', action: 'read', scope: 'TEAM' },
        { resource: 'dashboard', action: 'read', scope: 'TEAM' },
      ],
    });

    // SME Contributor - Limited access
    this.addRole({
      name: 'SME_CONTRIBUTOR',
      description: 'SME contributions with minimal permissions',
      permissions: [
        { resource: 'sme', action: 'read', scope: 'OWN' },
        { resource: 'sme', action: 'update', scope: 'OWN' },
        { resource: 'proposals', action: 'read', scope: 'TEAM' },
      ],
    });

    // Viewer - Read-only access
    this.addRole({
      name: 'VIEWER',
      description: 'Read-only access to team resources',
      permissions: [
        { resource: 'customers', action: 'read', scope: 'TEAM' },
        { resource: 'products', action: 'read', scope: 'TEAM' },
        { resource: 'proposals', action: 'read', scope: 'TEAM' },
        { resource: 'rfps', action: 'read', scope: 'TEAM' },
        { resource: 'dashboard', action: 'read', scope: 'TEAM' },
      ],
    });
  }

  /**
   * Add a new role
   */
  addRole(role: Role): void {
    this.roles.set(role.name, role);
    this.clearPermissionCache();

    logInfo('RBAC: Role added', {
      component: 'RBACManager',
      operation: 'addRole',
      roleName: role.name,
      permissionCount: role.permissions.length,
    });
  }

  /**
   * Remove a role
   */
  removeRole(roleName: string): void {
    this.roles.delete(roleName);
    this.clearPermissionCache();

    logInfo('RBAC: Role removed', {
      component: 'RBACManager',
      operation: 'removeRole',
      roleName,
    });
  }

  /**
   * Get all roles
   */
  getRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  /**
   * Get a specific role
   */
  getRole(roleName: string): Role | undefined {
    return this.roles.get(roleName);
  }

  // ====================
  // Permission Validation
  // ====================

  /**
   * Validate API permission
   */
  async validateApiPermission(config: ApiPermissionConfig): Promise<boolean> {
    if (!this.config.enableRBAC) {
      return true;
    }

    const { resource, action, scope, context } = config;
    const cacheKey = this.generatePermissionCacheKey(resource, action, scope, context);

    // Check cache first
    if (this.permissionCache.has(cacheKey)) {
      const cachedResult = this.permissionCache.get(cacheKey)!;
      logDebug('RBAC: Permission cache hit', {
        component: 'RBACManager',
        operation: 'validateApiPermission',
        resource,
        action,
        scope,
        userId: context.userId,
        cachedResult,
      });
      return cachedResult;
    }

    try {
      const hasPermission = this.checkPermission(resource, action, scope, context);

      // Cache the result
      this.permissionCache.set(cacheKey, hasPermission);

      // Log the permission check
      securityAuditManager.logPermissionCheck(
        context.userId || 'unknown',
        resource,
        action,
        scope,
        hasPermission,
        this.getRequiredPermissions(resource, action)
      );

      logDebug('RBAC: Permission validation result', {
        component: 'RBACManager',
        operation: 'validateApiPermission',
        resource,
        action,
        scope,
        userId: context.userId,
        hasPermission,
        userRoles: context.userRoles,
      });

      return hasPermission;
    } catch (error) {
      logError('RBAC: Permission validation failed', {
        component: 'RBACManager',
        operation: 'validateApiPermission',
        resource,
        action,
        scope,
        userId: context.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // In strict mode, deny access on error
      if (this.config.strictMode) {
        return false;
      }

      // In non-strict mode, allow access on error
      return true;
    }
  }

  /**
   * Check if user has permission for a specific resource and action
   */
  private checkPermission(
    resource: string,
    action: string,
    scope: string,
    context: RBACContext
  ): boolean {
    const { userId, userRoles, userPermissions } = context;

    // System administrators have full access
    if (userRoles?.includes('SYSTEM_ADMINISTRATOR')) {
      return true;
    }

    // Check user permissions directly
    if (
      userPermissions?.includes(`${resource}:${action}`) ||
      userPermissions?.includes(`${resource}:*`)
    ) {
      return true;
    }

    // Check role-based permissions
    if (userRoles) {
      for (const roleName of userRoles) {
        const role = this.roles.get(roleName);
        if (role && this.roleHasPermission(role, resource, action, scope)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if a role has the required permission
   */
  private roleHasPermission(role: Role, resource: string, action: string, scope: string): boolean {
    return role.permissions.some(permission => {
      // Check resource match (wildcard or exact)
      const resourceMatch = permission.resource === '*' || permission.resource === resource;

      // Check action match (wildcard or exact)
      const actionMatch = permission.action === '*' || permission.action === action;

      // Check scope match (ALL scope overrides others)
      const scopeMatch = permission.scope === 'ALL' || permission.scope === scope;

      return resourceMatch && actionMatch && scopeMatch;
    });
  }

  /**
   * Get required permissions for a resource and action
   */
  private getRequiredPermissions(resource: string, action: string): string[] {
    return [`${resource}:${action}`];
  }

  /**
   * Generate cache key for permission validation
   */
  private generatePermissionCacheKey(
    resource: string,
    action: string,
    scope: string,
    context: RBACContext
  ): string {
    const userId = context.userId || 'unknown';
    const roles = context.userRoles?.sort().join(',') || '';
    const permissions = context.userPermissions?.sort().join(',') || '';

    return `${userId}:${roles}:${permissions}:${resource}:${action}:${scope}`;
  }

  /**
   * Clear permission cache
   */
  clearPermissionCache(): void {
    this.permissionCache.clear();
    logDebug('RBAC: Permission cache cleared', {
      component: 'RBACManager',
      operation: 'clearPermissionCache',
    });
  }

  // ====================
  // Utility Methods
  // ====================

  /**
   * Check if user has any role
   */
  hasRole(userRoles: string[], roleName: string): boolean {
    return userRoles.includes(roleName);
  }

  /**
   * Get user's effective permissions
   */
  getUserPermissions(userRoles: string[]): Permission[] {
    const permissions: Permission[] = [];

    for (const roleName of userRoles) {
      const role = this.roles.get(roleName);
      if (role) {
        permissions.push(...role.permissions);
      }
    }

    // Remove duplicates
    return permissions.filter(
      (permission, index, self) =>
        index ===
        self.findIndex(
          p =>
            p.resource === permission.resource &&
            p.action === permission.action &&
            p.scope === permission.scope
        )
    );
  }

  /**
   * Get RBAC statistics
   */
  getRBACStats(): {
    totalRoles: number;
    totalPermissions: number;
    cacheSize: number;
    roles: string[];
  } {
    const roles = Array.from(this.roles.keys());
    const totalPermissions = Array.from(this.roles.values()).reduce(
      (total, role) => total + role.permissions.length,
      0
    );

    return {
      totalRoles: this.roles.size,
      totalPermissions,
      cacheSize: this.permissionCache.size,
      roles,
    };
  }
}

// ====================
// Export
// ====================

export const rbacManager = RBACManager.getInstance();

/**
 * Validate API permission - Convenience function
 */
export async function validateApiPermission(config: ApiPermissionConfig): Promise<boolean> {
  return rbacManager.validateApiPermission(config);
}

export { RBACManager };
