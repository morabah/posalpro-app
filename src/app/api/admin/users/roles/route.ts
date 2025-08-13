/**
 * PosalPro MVP2 - Admin User Roles API
 * Assign and remove roles for users
 */

import prisma from '@/lib/db/prisma';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const errorHandlingService = ErrorHandlingService.getInstance();

const RoleAssignmentSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid userId' }).or(z.string().min(1)),
  roleId: z.string().uuid().optional(),
  roleName: z.string().min(1).optional(),
});

const RoleRemovalSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid userId' }).or(z.string().min(1)),
  roleId: z.string().uuid().optional(),
  roleName: z.string().min(1).optional(),
});

async function ensureAdmin(req: NextRequest): Promise<{ ok: boolean; reason?: string }> {
  try {
    const token = await getToken({ req });
    if (!token) return { ok: false, reason: 'Unauthorized' };

    const rawRoles = (token as any).roles;
    const roles = Array.isArray(rawRoles)
      ? rawRoles
      : typeof rawRoles === 'string'
        ? [rawRoles]
        : [];

    const isAdmin = roles.includes('System Administrator');
    if (isAdmin) return { ok: true };

    // Dev convenience: allow known admin emails in development
    if (process.env.NODE_ENV !== 'production' && (token as any).email) {
      const adminEmails = ['admin@posalpro.com', 'test@posalpro.com'];
      if (adminEmails.includes(String((token as any).email).toLowerCase())) {
        return { ok: true };
      }
    }
    return { ok: false, reason: 'Forbidden' };
  } catch (err) {
    return { ok: false, reason: 'Authorization error' };
  }
}

function pickRoleIdentifier(input: { roleId?: string; roleName?: string }) {
  if (input.roleId) return { byId: true as const, value: input.roleId };
  if (input.roleName) return { byId: false as const, value: input.roleName };
  return null;
}

// GET /api/admin/users/roles?userId=... | email=...
export async function GET(request: NextRequest) {
  try {
    const auth = await ensureAdmin(request);
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.reason || 'Forbidden' },
        { status: auth.reason === 'Unauthorized' ? 401 : 403 }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const email = url.searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json({ error: 'userId or email is required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: email! },
      include: {
        roles: { where: { isActive: true }, include: { role: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roles = user.roles.map(ur => ({ id: ur.role.id, name: ur.role.name }));
    return NextResponse.json({ user: { id: user.id, email: user.email }, roles });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Failed to fetch user roles',
      ErrorCodes.DATA.FETCH_FAILED,
      {
        context: 'admin_user_roles_api',
        operation: 'list_user_roles',
        requestUrl: request.url,
        timestamp: new Date().toISOString(),
      }
    );

    return NextResponse.json(
      {
        error: 'Failed to fetch user roles',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/roles - Assign role to user
export async function POST(request: NextRequest) {
  let targetUserId: string | undefined;
  try {
    const auth = await ensureAdmin(request);
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.reason || 'Forbidden' },
        { status: auth.reason === 'Unauthorized' ? 401 : 403 }
      );
    }

    const body = await request.json();
    const parsed = RoleAssignmentSchema.parse(body);
    targetUserId = parsed.userId;

    const user = await prisma.user.findUnique({ where: { id: parsed.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const roleIdent = pickRoleIdentifier(parsed);
    if (!roleIdent)
      return NextResponse.json({ error: 'roleId or roleName is required' }, { status: 400 });

    const role = await prisma.role.findFirst({
      where: roleIdent.byId
        ? { id: roleIdent.value }
        : { name: { equals: roleIdent.value, mode: 'insensitive' } },
    });
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

    const existing = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: role.id, isActive: true },
    });

    if (existing) {
      return NextResponse.json({
        message: 'Role already assigned',
        assignment: { id: existing.id, userId: user.id, roleId: role.id },
      });
    }

    const assignment = await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        isActive: true,
        assignedBy: 'ADMIN',
      },
    });

    return NextResponse.json(
      {
        message: 'Role assigned successfully',
        assignment: { id: assignment.id, userId: user.id, roleId: role.id },
      },
      { status: 201 }
    );
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Failed to assign role to user',
      ErrorCodes.DATA.UPDATE_FAILED,
      {
        context: 'admin_user_roles_api',
        operation: 'assign_role',
        userId: targetUserId,
        requestUrl: request.url,
        timestamp: new Date().toISOString(),
      }
    );

    return NextResponse.json(
      {
        error: 'Failed to assign role',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/roles - Remove role from user (soft-remove by setting isActive=false)
export async function DELETE(request: NextRequest) {
  let targetUserId: string | undefined;
  try {
    const auth = await ensureAdmin(request);
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.reason || 'Forbidden' },
        { status: auth.reason === 'Unauthorized' ? 401 : 403 }
      );
    }

    const body = await request.json();
    const parsed = RoleRemovalSchema.parse(body);
    targetUserId = parsed.userId;

    const user = await prisma.user.findUnique({ where: { id: parsed.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const roleIdent = pickRoleIdentifier(parsed);
    if (!roleIdent)
      return NextResponse.json({ error: 'roleId or roleName is required' }, { status: 400 });

    const role = await prisma.role.findFirst({
      where: roleIdent.byId
        ? { id: roleIdent.value }
        : { name: { equals: roleIdent.value, mode: 'insensitive' } },
    });
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

    const existing = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: role.id, isActive: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Role assignment not found' }, { status: 404 });
    }

    await prisma.userRole.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Role removed successfully' });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Failed to remove role from user',
      ErrorCodes.DATA.UPDATE_FAILED,
      {
        context: 'admin_user_roles_api',
        operation: 'remove_role',
        userId: targetUserId,
        requestUrl: request.url,
        timestamp: new Date().toISOString(),
      }
    );

    return NextResponse.json(
      {
        error: 'Failed to remove role',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
