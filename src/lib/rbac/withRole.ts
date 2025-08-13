/**
 * PosalPro MVP2 - Role-Based Access Control Middleware
 * Handles role-based authorization for API routes
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
// Note: Do not bind to a narrow Role type here. Roles come from DB and vary by env.

export function withRole(
  allowedRoles: string | string[],
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function (req: NextRequest) {
    const errorHandlingService = ErrorHandlingService.getInstance();

    try {
      const token = await getToken({ req });

      if (!token) {
        return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
      }

      // Normalize roles from token (supports token.roles array or token.role string)
      const tokenRolesRaw = (token as any).roles ?? (token as any).role ?? [];
      const userRoles: string[] = Array.isArray(tokenRolesRaw) ? tokenRolesRaw : [tokenRolesRaw];

      const rolesRequired = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      const isSuperAdmin =
        userRoles.includes('System Administrator') || userRoles.includes('Administrator');
      const hasAllowedRole = rolesRequired.some(role => userRoles.includes(role));

      if (!(isSuperAdmin || hasAllowedRole)) {
        return NextResponse.json(
          { error: 'Forbidden - Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(req);
    } catch (error) {
      errorHandlingService.processError(
        error,
        'RBAC authorization failed',
        ErrorCodes.AUTH.AUTHORIZATION_FAILED,
        {
          component: 'withRole',
          operation: 'roleBasedAuthorization',
          allowedRoles: Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles],
          userFriendlyMessage: 'Access denied. Please check your permissions.',
        }
      );

      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
