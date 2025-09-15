/**
 * PosalPro MVP2 - Admin Audit Logs API Route
 * Database-driven audit log management with RBAC enforcement
 * Provides comprehensive audit trail for admin actions
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { ok } from '@/lib/api/response';
import { RBACMiddleware } from '@/lib/auth';
import { badRequest, forbidden } from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

/**
 * Component Traceability Matrix
 */
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-8.3'],
  acceptanceCriteria: ['AC-8.1.2', 'AC-8.3.1'],
  methods: ['getAuditLogs()', 'filterAuditLogs()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-003', 'TC-H8-004'],
};

// GET /api/admin/audit - Fetch audit logs with RBAC enforcement
export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Authentication check
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw forbidden('Authentication required');
    }

    const user = session.user as {
      id: string;
      email: string;
      roles?: string[];
    };

    // RBAC Enforcement - Admin access required
    const rbacValidation = RBACMiddleware.validateAdminAccess(user.roles || []);
    if (!rbacValidation.allowed) {
      logError('RBAC Access Denied', {
        component: 'AdminAuditAPI',
        operation: 'GET',
        userId: user.id,
        userRoles: user.roles,
        reason: rbacValidation.reason,
        requestId,
      });
      throw forbidden(rbacValidation.reason || 'Access denied');
    }

    logDebug('RBAC Access Granted', {
      component: 'AdminAuditAPI',
      operation: 'GET',
      userId: user.id,
      userRoles: user.roles,
      requestId,
    });

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');
    const model = url.searchParams.get('model');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const skip = (pageNum - 1) * limitNum;

    logDebug('Fetching admin audit logs', {
      component: 'AdminAuditAPI',
      operation: 'GET',
      userId: user.id,
      requestId,
      page: pageNum,
      limit: limitNum,
      filters: { userId, action, model, startDate, endDate },
    });

    // Build where clause for filtering
    const where: Record<string, unknown> = {};

    if (userId) {
      where.actorId = userId;
    }

    if (action) {
      where.action = { equals: action, mode: 'insensitive' };
    }

    if (model) {
      where.model = { equals: model, mode: 'insensitive' };
    }

    if (startDate || endDate) {
      where.at = {};
      if (startDate) {
        (where.at as any).gte = new Date(startDate);
      }
      if (endDate) {
        (where.at as any).lte = new Date(endDate);
      }
    }

    // Execute database query
    const [totalCount, auditLogs] = await prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          at: 'desc',
        },
      }),
    ]);

    logDebug('Admin audit logs query results', {
      component: 'AdminAuditAPI',
      operation: 'GET',
      totalCount,
      logsCount: auditLogs.length,
      requestId,
    });

    // Transform audit logs for frontend
    const transformedLogs = auditLogs.map(log => ({
      id: log.id,
      timestamp: log.at,
      user: log.actorId ? 'User' : 'System',
      userId: log.actorId,
      action: log.action,
      type: log.model,
      targetId: log.targetId,
      details: log.diff ? JSON.stringify(log.diff) : `${log.action} on ${log.model}`,
      ipAddress: log.ip || 'unknown',
      metadata: log.diff,
    }));

    logDebug('Admin audit logs transformation result', {
      component: 'AdminAuditAPI',
      operation: 'GET',
      rawLogsCount: auditLogs.length,
      transformedLogsCount: transformedLogs.length,
      requestId,
    });

    logInfo('Admin audit logs fetched successfully', {
      component: 'AdminAuditAPI',
      operation: 'GET',
      userId: user.id,
      requestId,
      count: transformedLogs.length,
      totalCount,
    });

    const responseData = {
      logs: transformedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
      filters: {
        userId,
        action,
        model,
        startDate,
        endDate,
      },
    };

    logDebug('Admin audit logs final response', {
      component: 'AdminAuditAPI',
      operation: 'GET',
      logsCount: responseData.logs.length,
      pagination: responseData.pagination,
      requestId,
    });

    return ok(responseData);
  } catch (error) {
    const duration = Date.now() - startTime;

    logError('Admin audit API error', {
      component: 'AdminAuditAPI',
      operation: 'GET',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      requestId,
    });

    // Re-throw to let Next.js handle the error response
    throw error;
  }
}

// POST /api/admin/audit - Create audit log entry (for system events)
export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Authentication check
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw forbidden('Authentication required');
    }

    const user = session.user as {
      id: string;
      email: string;
      roles?: string[];
    };

    // RBAC Enforcement - Admin access required
    const rbacValidation = RBACMiddleware.validateAdminAccess(user.roles || []);
    if (!rbacValidation.allowed) {
      logError('RBAC Access Denied', {
        component: 'AdminAuditAPI',
        operation: 'POST',
        userId: user.id,
        userRoles: user.roles,
        reason: rbacValidation.reason,
        requestId,
      });
      throw forbidden(rbacValidation.reason || 'Access denied');
    }

    logDebug('RBAC Access Granted', {
      component: 'AdminAuditAPI',
      operation: 'POST',
      userId: user.id,
      userRoles: user.roles,
      requestId,
    });

    // Parse request body
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw badRequest('Content-Type must be application/json');
    }

    const body = await req.json();
    const { action, model, targetId, diff } = body;

    if (!action || !model) {
      throw badRequest('Action and model are required');
    }

    logDebug('Creating audit log entry', {
      component: 'AdminAuditAPI',
      operation: 'POST',
      userId: user.id,
      requestId,
      action,
      model,
      targetId,
    });

    // Create audit log entry
    const auditLog = await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action,
        model,
        targetId,
        diff,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      },
    });

    logInfo('Audit log entry created successfully', {
      component: 'AdminAuditAPI',
      operation: 'POST',
      userId: user.id,
      requestId,
      auditLogId: auditLog.id,
      action,
      model,
    });

    return ok(
      {
        id: auditLog.id,
        timestamp: auditLog.at,
        action: auditLog.action,
        model: auditLog.model,
        targetId: auditLog.targetId,
        diff: auditLog.diff,
      },
      201
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    logError('Admin audit API error', {
      component: 'AdminAuditAPI',
      operation: 'POST',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      requestId,
    });

    // Re-throw to let Next.js handle the error response
    throw error;
  }
}
