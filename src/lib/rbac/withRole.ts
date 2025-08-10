/**
 * PosalPro MVP2 - Role-Based Access Control Middleware
 * Handles role-based authorization for API routes
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Role } from './types';

export function withRole(
  allowedRoles: Role | Role[],
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function (req: NextRequest) {
    const errorHandlingService = ErrorHandlingService.getInstance();

    try {
      const token = await getToken({ req });

      if (!token) {
        return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
      }

      const userRole = token.role as Role;
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!roles.includes(userRole)) {
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
