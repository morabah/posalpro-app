/**
 * RBAC Integration Layer
 * Connects all enhanced security components for unified RBAC implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { permissionValidator } from './permissionValidator';
import { secureSessionManager } from './secureSessionManager';
import { securityAuditManager } from './securityAudit';
// import { validateApiPermission } from './apiAuthorization';
import { logger } from '@/utils/logger';
import { RiskLevel, SecurityEventType } from '@prisma/client';

export interface RBACContext {
  userId: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  isSuperAdmin: boolean;
}

export interface RoutePermissionConfig {
  path: string;
  method?: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  allowPublic?: boolean;
  riskLevel?: RiskLevel;
}

/**
 * Enhanced RBAC Integration Manager
 */
export class RBACIntegrationManager {
  private static instance: RBACIntegrationManager;

  // Route permission mappings
  private routePermissions: RoutePermissionConfig[] = [
    // Admin routes
    { path: '/admin', requiredRoles: ['Administrator', 'System Administrator'], requiredPermissions: ['admin:access'], riskLevel: RiskLevel.HIGH },
    { path: '/admin/users', requiredPermissions: ['users:read', 'admin:access'], riskLevel: RiskLevel.HIGH },
    { path: '/admin/roles', requiredPermissions: ['roles:read', 'admin:access'], riskLevel: RiskLevel.HIGH },
    { path: '/admin/metrics', requiredPermissions: ['metrics:read', 'admin:access'], riskLevel: RiskLevel.MEDIUM },

    // API routes
    { path: '/api/admin', method: 'GET', requiredPermissions: ['admin:access'], riskLevel: RiskLevel.HIGH },
    { path: '/api/admin', method: 'POST', requiredPermissions: ['admin:write'], riskLevel: RiskLevel.HIGH },
    { path: '/api/admin', method: 'PUT', requiredPermissions: ['admin:write'], riskLevel: RiskLevel.HIGH },
    { path: '/api/admin', method: 'DELETE', requiredPermissions: ['admin:delete'], riskLevel: RiskLevel.CRITICAL },

    // Admin users/roles granularity
    { path: '/api/admin/users/roles', method: 'GET', requiredPermissions: ['users:read', 'roles:read'], riskLevel: RiskLevel.HIGH },
    { path: '/api/admin/users/roles', method: 'POST', requiredPermissions: ['roles:update'], riskLevel: RiskLevel.HIGH },
    { path: '/api/admin/users/roles', method: 'DELETE', requiredPermissions: ['roles:update'], riskLevel: RiskLevel.HIGH },

    { path: '/api/users', method: 'GET', requiredPermissions: ['users:read'], riskLevel: RiskLevel.MEDIUM },
    { path: '/api/users', method: 'POST', requiredPermissions: ['users:create'], riskLevel: RiskLevel.HIGH },
    { path: '/api/users', method: 'PUT', requiredPermissions: ['users:update'], riskLevel: RiskLevel.MEDIUM },
    { path: '/api/users', method: 'DELETE', requiredPermissions: ['users:delete'], riskLevel: RiskLevel.HIGH },

    { path: '/api/proposals', method: 'GET', requiredPermissions: ['proposals:read'], riskLevel: RiskLevel.LOW },
    { path: '/api/proposals', method: 'POST', requiredPermissions: ['proposals:create'], riskLevel: RiskLevel.MEDIUM },
    { path: '/api/proposals', method: 'PUT', requiredPermissions: ['proposals:update'], riskLevel: RiskLevel.MEDIUM },
    { path: '/api/proposals', method: 'DELETE', requiredPermissions: ['proposals:delete'], riskLevel: RiskLevel.HIGH },

    // Proposal subroutes
    { path: '/api/proposals/stats', method: 'GET', requiredPermissions: ['proposals:read'], riskLevel: RiskLevel.LOW },
    { path: '/api/proposals/versions', method: 'GET', requiredPermissions: ['proposals:read'], riskLevel: RiskLevel.LOW },

    // Dashboard routes
    { path: '/api/dashboard/stats', method: 'GET', requiredPermissions: ['proposals:read'], riskLevel: RiskLevel.LOW },
    { path: '/api/dashboard/enhanced-stats', method: 'GET', requiredPermissions: ['proposals:read'], riskLevel: RiskLevel.LOW },

    { path: '/api/customers', method: 'GET', requiredPermissions: ['customers:read'], riskLevel: RiskLevel.LOW },
    { path: '/api/customers', method: 'POST', requiredPermissions: ['customers:create'], riskLevel: RiskLevel.MEDIUM },
    { path: '/api/customers', method: 'PUT', requiredPermissions: ['customers:update'], riskLevel: RiskLevel.MEDIUM },
    { path: '/api/customers', method: 'DELETE', requiredPermissions: ['customers:delete'], riskLevel: RiskLevel.HIGH },

    // Workflow routes
    { path: '/api/workflows', method: 'GET', requiredPermissions: ['workflows:read'], riskLevel: RiskLevel.LOW },
    { path: '/api/workflows', method: 'POST', requiredPermissions: ['workflows:create'], riskLevel: RiskLevel.MEDIUM },
    { path: '/api/workflows', method: 'PUT', requiredPermissions: ['workflows:update'], riskLevel: RiskLevel.MEDIUM },
    { path: '/api/workflows', method: 'DELETE', requiredPermissions: ['workflows:delete'], riskLevel: RiskLevel.HIGH },

    // Content routes
    { path: '/api/content', method: 'GET', requiredPermissions: ['content:read'], riskLevel: RiskLevel.LOW },
    { path: '/api/content', method: 'POST', requiredPermissions: ['content:create'], riskLevel: RiskLevel.MEDIUM },
    { path: '/api/content', method: 'PUT', requiredPermissions: ['content:update'], riskLevel: RiskLevel.MEDIUM },
    { path: '/api/content', method: 'DELETE', requiredPermissions: ['content:delete'], riskLevel: RiskLevel.MEDIUM },

    // Products routes
    { path: '/api/products', method: 'GET', requiredPermissions: ['products:read'], riskLevel: RiskLevel.LOW },
    { path: '/api/products', method: 'POST', requiredPermissions: ['products:create'], riskLevel: RiskLevel.MEDIUM },
    { path: '/api/products', method: 'PUT', requiredPermissions: ['products:update'], riskLevel: RiskLevel.MEDIUM },
    { path: '/api/products', method: 'DELETE', requiredPermissions: ['products:delete'], riskLevel: RiskLevel.MEDIUM },

    // Profile routes
    { path: '/api/profile', method: 'GET', requiredPermissions: ['profile:read'], riskLevel: RiskLevel.LOW },
    { path: '/api/profile', method: 'PUT', requiredPermissions: ['profile:write'], riskLevel: RiskLevel.LOW },

    // Public routes
    { path: '/api/health', allowPublic: true, riskLevel: RiskLevel.LOW },
    { path: '/api/auth', allowPublic: true, riskLevel: RiskLevel.LOW },
    { path: '/login', allowPublic: true, riskLevel: RiskLevel.LOW },
    { path: '/register', allowPublic: true, riskLevel: RiskLevel.LOW },
  ];

  public static getInstance(): RBACIntegrationManager {
    if (!RBACIntegrationManager.instance) {
      RBACIntegrationManager.instance = new RBACIntegrationManager();
    }
    return RBACIntegrationManager.instance;
  }

  /**
   * Enhanced middleware authentication and authorization
   */
  public async authenticateAndAuthorize(request: NextRequest): Promise<NextResponse | null> {
    const startTime = Date.now();
    const pathname = request.nextUrl.pathname;
    const method = request.method;
    const ipAddress = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    try {
      // Get JWT token
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      });

      // Check if route requires authentication
      const routeConfig = this.findRouteConfig(pathname, method);

      if (routeConfig?.allowPublic) {
        logger.info('[RBAC] Public route access', { pathname, method, ipAddress });
        return null; // Allow access
      }

      // Require authentication for protected routes
      if (!token) {
        logger.info('[RBAC] No token found for protected route', {
          pathname,
          method,
          hasAuthHeader: !!request.headers.get('authorization')
        });

        await securityAuditManager.logSecurityEvent({
          type: SecurityEventType.PERMISSION_DENIED,
          ipAddress,
          userAgent,
          resource: pathname,
          action: method,
          riskLevel: RiskLevel.MEDIUM,
          details: { reason: 'No authentication token' },
          timestamp: new Date(),
        });

        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Extract user context
      const rbacContext: RBACContext = {
        userId: token.sub || '',
        roles: (token.roles as string[]) || [],
        permissions: (token.permissions as string[]) || [],
        sessionId: token.sessionId as string || '',
        ipAddress,
        userAgent,
        isSuperAdmin: this.isSuperAdmin(token.roles as string[]),
      };

      // Validate session - skip in development for System Administrator
      const isDev = process.env.NODE_ENV === 'development';
      const isSystemAdmin = rbacContext.roles.includes('System Administrator');
      
      // Debug logging for authentication bypass
      logger.info('[RBAC] Authentication debug', {
        isDev,
        isSystemAdmin,
        roles: rbacContext.roles,
        userId: rbacContext.userId,
        pathname,
        willSkipValidation: isDev && isSystemAdmin
      });
      
      if (!(isDev && isSystemAdmin)) {
        const sessionValid = await secureSessionManager.validateSession(
          rbacContext.sessionId
        );

        if (!sessionValid) {
          await securityAuditManager.logSecurityEvent({
            type: SecurityEventType.SUSPICIOUS_ACTIVITY,
            userId: rbacContext.userId,
            ipAddress,
            userAgent,
            riskLevel: RiskLevel.HIGH,
            details: { reason: 'Invalid session' },
            timestamp: new Date(),
          });

          return NextResponse.redirect(new URL('/login', request.url));
        }
      }

      // Check permissions
      if (routeConfig) {
        const hasAccess = await this.checkRouteAccess(rbacContext, routeConfig);

        if (!hasAccess) {
          await securityAuditManager.logPermissionCheck(
            rbacContext.userId,
            pathname,
            method,
            false,
            'Insufficient permissions',
            ipAddress,
            userAgent
          );

          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }

        // Log successful access for high-risk routes
        if (routeConfig.riskLevel === RiskLevel.HIGH || routeConfig.riskLevel === RiskLevel.CRITICAL) {
          await securityAuditManager.logDataAccess(
            rbacContext.userId,
            pathname,
            'route',
            method,
            ipAddress,
            userAgent,
            true
          );
        }
      }

      const duration = Date.now() - startTime;
      logger.info('[RBAC] Access granted', {
        userId: rbacContext.userId,
        pathname,
        method,
        duration,
        riskLevel: routeConfig?.riskLevel,
      });

      return null; // Allow access

    } catch (error) {
      logger.error('[RBAC] Authentication error', { pathname, method, error });

      await securityAuditManager.logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        ipAddress,
        userAgent,
        resource: pathname,
        action: method,
        riskLevel: RiskLevel.HIGH,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date(),
      });

      return NextResponse.redirect(new URL('/error', request.url));
    }
  }

  /**
   * API route authorization wrapper
   */
  public async authorizeApiRoute(
    request: NextRequest,
    requiredPermissions: string[],
    options?: {
      resourceId?: string;
      context?: Record<string, unknown>;
      riskLevel?: RiskLevel;
    }
  ): Promise<{ authorized: boolean; context?: RBACContext; error?: string }> {
    try {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

      if (!token) {
        return { authorized: false, error: 'No authentication token' };
      }

      const rbacContext: RBACContext = {
        userId: token.sub || '',
        roles: (token.roles as string[]) || [],
        permissions: (token.permissions as string[]) || [],
        sessionId: token.sessionId as string || '',
        ipAddress: this.getClientIP(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        isSuperAdmin: this.isSuperAdmin(token.roles as string[]),
      };

      // Check permissions using permission validator
      for (const permission of requiredPermissions) {
        const hasPermission = await permissionValidator.validatePermission(
          rbacContext.userId,
          permission,
          'ALL',
          { userId: rbacContext.userId }
        );

        if (!hasPermission.granted) {
          return { authorized: false, error: 'Insufficient permissions' };
        }
      }

      // Log high-risk API access
      if (options?.riskLevel === RiskLevel.HIGH || options?.riskLevel === RiskLevel.CRITICAL) {
        await securityAuditManager.logDataAccess(
          rbacContext.userId,
          request.nextUrl.pathname,
          options?.resourceId || 'api',
          request.method,
          rbacContext.ipAddress,
          rbacContext.userAgent,
          true
        );
      }

      return { authorized: true, context: rbacContext };

    } catch (error) {
      logger.error('[RBAC] API authorization error', { error });
      return { authorized: false, error: 'Authorization system error' };
    }
  }

  /**
   * Check if user has access to route
   */
  private async checkRouteAccess(context: RBACContext, config: RoutePermissionConfig): Promise<boolean> {
    // Super admin override
    if (context.isSuperAdmin) {
      return true;
    }

    // Check required roles
    if (config.requiredRoles?.length) {
      const hasRole = config.requiredRoles.some(role => context.roles.includes(role));
      if (!hasRole) {
        return false;
      }
    }

    // Check required permissions
    if (config.requiredPermissions?.length) {
      for (const permission of config.requiredPermissions) {
        const hasPermission = await permissionValidator.validatePermission(
          context.userId,
          permission,
          'ALL',
          { userId: context.userId }
        );

        if (!hasPermission.granted) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Find route configuration
   */
  private findRouteConfig(pathname: string, method: string): RoutePermissionConfig | undefined {
    return this.routePermissions.find(config => {
      const pathMatches = pathname.startsWith(config.path);
      const methodMatches = !config.method || config.method === method;
      return pathMatches && methodMatches;
    });
  }

  /**
   * Check if user is super admin
   */
  private isSuperAdmin(roles: string[]): boolean {
    return roles.includes('System Administrator') || roles.includes('Administrator');
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    if (realIP) {
      return realIP;
    }

    return 'unknown';
  }

  /**
   * Add route permission configuration
   */
  public addRoutePermission(config: RoutePermissionConfig): void {
    this.routePermissions.push(config);
  }

  /**
   * Get security metrics for dashboard
   */
  public async getSecurityDashboard(timeRange?: number): Promise<{
    metrics: Record<string, unknown>;
    recentEvents: Array<Record<string, unknown>>;
    activeThreats: number;
  }> {
    const metrics = await securityAuditManager.getSecurityMetrics(timeRange);

    return {
      metrics,
      recentEvents: [],
      activeThreats: metrics.recentAlerts,
    };
  }
}

// Export singleton instance
export const rbacIntegration = RBACIntegrationManager.getInstance();
