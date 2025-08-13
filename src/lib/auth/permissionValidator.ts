/**
 * Enhanced Permission Validation System
 * Comprehensive permission checking with context awareness and inheritance
 */

import prisma from '@/lib/db/prisma';
import { deleteAuthCache, getAuthCache, setAuthCache } from '@/lib/redis';
import { logger } from '@/utils/logger';

export interface PermissionContext {
  userId: string;
  resourceId?: string;
  resourceType?: string;
  resourceOwner?: string;
  teamId?: string;
  departmentId?: string;
  metadata?: Record<string, unknown>;
}

export interface PermissionResult {
  granted: boolean;
  reason: string;
  appliedRule?: string;
  inheritedFrom?: string;
}

export interface ContextRule {
  id: string;
  attribute: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN';
  value: unknown;
  effect: 'GRANT' | 'DENY';
}

export class PermissionValidator {
  private static instance: PermissionValidator;
  private permissionCache: Map<string, { permissions: string[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): PermissionValidator {
    if (!PermissionValidator.instance) {
      PermissionValidator.instance = new PermissionValidator();
    }
    return PermissionValidator.instance;
  }

  /**
   * Validate permission with full context awareness
   */
  public async validatePermission(
    userId: string,
    resource: string,
    action: string,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    try {
      // Get user permissions with caching
      const userPermissions = await this.getUserPermissions(userId);

      // Check direct permission
      const directPermission = `${resource}:${action}`;
      if (this.hasDirectPermission(userPermissions, directPermission)) {
        return {
          granted: true,
          reason: 'Direct permission granted',
          appliedRule: directPermission,
        };
      }

      // Check wildcard permissions
      const wildcardResult = this.checkWildcardPermissions(userPermissions, resource, action);
      if (wildcardResult.granted) {
        return wildcardResult;
      }

      // Check scope-based permissions with context
      if (context) {
        const scopeResult = await this.checkScopeBasedPermissions(
          userId,
          resource,
          action,
          context,
          userPermissions
        );
        if (scopeResult.granted) {
          return scopeResult;
        }
      }

      // Check context rules
      const contextResult = await this.checkContextRules(userId, resource, action, context);
      if (contextResult.granted) {
        return contextResult;
      }

      // Check role hierarchy inheritance
      const inheritanceResult = await this.checkRoleInheritance(userId, resource, action);
      if (inheritanceResult.granted) {
        return inheritanceResult;
      }

      return {
        granted: false,
        reason: 'No matching permissions found',
      };
    } catch (error) {
      logger.error('[Permission] Validation error', { userId, resource, action, error });
      return {
        granted: false,
        reason: 'Permission validation failed',
      };
    }
  }

  /**
   * Batch validate multiple permissions
   */
  public async validatePermissions(
    userId: string,
    permissions: Array<{ resource: string; action: string; context?: PermissionContext }>
  ): Promise<Record<string, PermissionResult>> {
    const results: Record<string, PermissionResult> = {};

    for (const { resource, action, context } of permissions) {
      const key = `${resource}:${action}`;
      results[key] = await this.validatePermission(userId, resource, action, context);
    }

    return results;
  }

  /**
   * Get user permissions with caching
   */
  private async getUserPermissions(userId: string): Promise<string[]> {
    const cacheKey = `user_permissions_${userId}`;
    const redisKey = `permissions:${userId}`;
    const cached = this.permissionCache.get(cacheKey);

    // Fast in-memory cache
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.permissions;
    }

    // Cross-instance cache via Redis/memory fallback
    const redisCached = await getAuthCache<string[]>(redisKey);
    if (Array.isArray(redisCached) && redisCached.length > 0) {
      // Warm in-memory cache and return
      this.permissionCache.set(cacheKey, {
        permissions: redisCached,
        timestamp: Date.now(),
      });
      return redisCached;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            where: { isActive: true },
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
          permissions: {
            where: { isActive: true },
            include: {
              permission: true,
            },
          },
        },
      });

      if (!user) {
        return [];
      }

      const permissions = new Set<string>();

      // Add direct user permissions
      user.permissions.forEach(up => {
        const perm = `${up.permission.resource}:${up.permission.action}`;
        permissions.add(perm);
      });

      // Add role-based permissions
      user.roles.forEach(ur => {
        ur.role.permissions.forEach(rp => {
          const perm = `${rp.permission.resource}:${rp.permission.action}`;
          permissions.add(perm);
        });
      });

      const permissionArray = Array.from(permissions);

      // Cache the result (in-memory + Redis)
      this.permissionCache.set(cacheKey, {
        permissions: permissionArray,
        timestamp: Date.now(),
      });
      // Fire-and-forget; TTL managed by AUTH_TTL in redis.ts
      void setAuthCache(redisKey, permissionArray);

      return permissionArray;
    } catch (error) {
      logger.error('[Permission] Failed to get user permissions', { userId, error });
      return [];
    }
  }

  /**
   * Check direct permission match
   */
  private hasDirectPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.includes(requiredPermission);
  }

  /**
   * Check wildcard permissions
   */
  private checkWildcardPermissions(
    userPermissions: string[],
    resource: string,
    action: string
  ): PermissionResult {
    // Check for full wildcard
    if (userPermissions.includes('*:*')) {
      return {
        granted: true,
        reason: 'Full wildcard permission',
        appliedRule: '*:*',
      };
    }

    // Check for resource wildcard
    const resourceWildcard = `${resource}:*`;
    if (userPermissions.includes(resourceWildcard)) {
      return {
        granted: true,
        reason: 'Resource wildcard permission',
        appliedRule: resourceWildcard,
      };
    }

    // Check for action wildcard
    const actionWildcard = `*:${action}`;
    if (userPermissions.includes(actionWildcard)) {
      return {
        granted: true,
        reason: 'Action wildcard permission',
        appliedRule: actionWildcard,
      };
    }

    return { granted: false, reason: 'No wildcard permissions match' };
  }

  /**
   * Check scope-based permissions (OWN, TEAM, ALL)
   */
  private async checkScopeBasedPermissions(
    userId: string,
    resource: string,
    action: string,
    context: PermissionContext,
    userPermissions: string[]
  ): Promise<PermissionResult> {
    try {
      // Check OWN scope
      const ownPermission = `${resource}:${action}:OWN`;
      if (userPermissions.includes(ownPermission)) {
        if (context.resourceOwner === userId) {
          return {
            granted: true,
            reason: 'OWN scope permission - user owns resource',
            appliedRule: ownPermission,
          };
        }
      }

      // Check TEAM scope
      const teamPermission = `${resource}:${action}:TEAM`;
      if (userPermissions.includes(teamPermission) && context.teamId) {
        const userTeam = await this.getUserTeam(userId);
        if (userTeam === context.teamId) {
          return {
            granted: true,
            reason: 'TEAM scope permission - same team',
            appliedRule: teamPermission,
          };
        }
      }

      return { granted: false, reason: 'No scope-based permissions match' };
    } catch (error) {
      logger.error('[Permission] Scope check error', { userId, resource, action, error });
      return { granted: false, reason: 'Scope validation failed' };
    }
  }

  /**
   * Check context rules
   */
  private async checkContextRules(
    userId: string,
    resource: string,
    action: string,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    if (!context) {
      return { granted: false, reason: 'No context provided for context rules' };
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            where: { isActive: true },
            include: {
              role: {
                include: {
                  contextRules: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return { granted: false, reason: 'User not found' };
      }

      for (const userRole of user.roles) {
        for (const rule of userRole.role.contextRules) {
          const ruleResult = this.evaluateContextRule(rule, context);

          if (ruleResult.matches) {
            if (rule.effect === 'GRANT') {
              return {
                granted: true,
                reason: `Context rule granted access: ${rule.attribute} ${rule.operator} ${rule.value}`,
                appliedRule: rule.id,
              };
            } else if (rule.effect === 'DENY') {
              return {
                granted: false,
                reason: `Context rule denied access: ${rule.attribute} ${rule.operator} ${rule.value}`,
                appliedRule: rule.id,
              };
            }
          }
        }
      }

      return { granted: false, reason: 'No context rules matched' };
    } catch (error) {
      logger.error('[Permission] Context rule check error', { userId, resource, action, error });
      return { granted: false, reason: 'Context rule validation failed' };
    }
  }

  /**
   * Check role hierarchy inheritance
   */
  private async checkRoleInheritance(
    userId: string,
    resource: string,
    action: string
  ): Promise<PermissionResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            where: { isActive: true },
            include: {
              role: {
                include: {
                  parent: {
                    include: {
                      permissions: {
                        include: {
                          permission: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        return { granted: false, reason: 'User not found' };
      }

      const requiredPermission = `${resource}:${action}`;

      for (const userRole of user.roles) {
        const currentRole = userRole.role.parent;

        while (currentRole) {
          const hasPermission = currentRole.permissions.some(
            rp => `${rp.permission.resource}:${rp.permission.action}` === requiredPermission
          );

          if (hasPermission) {
            return {
              granted: true,
              reason: 'Permission inherited from parent role',
              appliedRule: requiredPermission,
              inheritedFrom: currentRole.name,
            };
          }

          // Move up the hierarchy (would need to fetch parent's parent)
          break; // For now, only check immediate parent
        }
      }

      return { granted: false, reason: 'No inherited permissions found' };
    } catch (error) {
      logger.error('[Permission] Inheritance check error', { userId, resource, action, error });
      return { granted: false, reason: 'Inheritance validation failed' };
    }
  }

  /**
   * Evaluate context rule
   */
  private evaluateContextRule(
    rule: ContextRule,
    context: PermissionContext
  ): { matches: boolean; reason: string } {
    const contextValue = this.getContextValue(context, rule.attribute);

    if (contextValue === undefined) {
      return { matches: false, reason: `Context attribute '${rule.attribute}' not found` };
    }

    switch (rule.operator) {
      case 'EQUALS':
        return {
          matches: contextValue === rule.value,
          reason: `${contextValue} ${rule.operator} ${rule.value}`,
        };
      case 'NOT_EQUALS':
        return {
          matches: contextValue !== rule.value,
          reason: `${contextValue} ${rule.operator} ${rule.value}`,
        };
      case 'CONTAINS':
        return {
          matches: String(contextValue).includes(String(rule.value)),
          reason: `${contextValue} ${rule.operator} ${rule.value}`,
        };
      case 'GREATER_THAN':
        return {
          matches: Number(contextValue) > Number(rule.value),
          reason: `${contextValue} ${rule.operator} ${rule.value}`,
        };
      case 'LESS_THAN':
        return {
          matches: Number(contextValue) < Number(rule.value),
          reason: `${contextValue} ${rule.operator} ${rule.value}`,
        };
      default:
        return { matches: false, reason: `Unknown operator: ${rule.operator}` };
    }
  }

  /**
   * Get context value by attribute path
   */
  private getContextValue(context: PermissionContext, attribute: string): unknown {
    const parts = attribute.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Get user's team ID
   */
  private async getUserTeam(userId: string): Promise<string | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });

      return user?.department || null;
    } catch (error) {
      logger.error('[Permission] Failed to get user team', { userId, error });
      return null;
    }
  }

  /**
   * Clear permission cache for a user
   */
  public clearUserCache(userId: string): void {
    const cacheKey = `user_permissions_${userId}`;
    this.permissionCache.delete(cacheKey);
    void deleteAuthCache(`permissions:${userId}`);
  }

  /**
   * Clear all permission cache
   */
  public clearAllCache(): void {
    this.permissionCache.clear();
  }
}

// Export singleton instance
export const permissionValidator = PermissionValidator.getInstance();
