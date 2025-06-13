/**
 * PosalPro MVP2 - Role-Based Access Control Middleware
 * Handles role-based authorization for API routes
 */

import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Role } from './types';

export function withRole(
  allowedRoles: Role | Role[],
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function (req: NextRequest) {
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
      console.error('RBAC Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
