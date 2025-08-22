import { authOptions } from '@/lib/auth';
import { createApiErrorResponse, ErrorCodes } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// Mock assignment data for testing
const mockAssignments = [
  {
    id: 'assignment-1',
    proposalId: 'proposal-1',
    smeId: 'sme-user-1',
    smeName: 'Dr. Sarah Johnson',
    smeEmail: 'sarah.johnson@posalpro.com',
    expertiseArea: 'Cloud Architecture',
    priority: 'HIGH',
    status: 'ASSIGNED',
    dueDate: '2024-02-15T23:59:59Z',
    description: 'Review cloud architecture section for enterprise proposal',
    assignedAt: '2024-01-15T10:00:00Z',
    assignedBy: 'proposal-manager-1',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'assignment-2',
    proposalId: 'proposal-2',
    smeId: 'sme-user-2',
    smeName: 'Mike Chen',
    smeEmail: 'mike.chen@posalpro.com',
    expertiseArea: 'Cybersecurity',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    dueDate: '2024-02-10T23:59:59Z',
    description: 'Security assessment and compliance validation',
    assignedAt: '2024-01-12T14:30:00Z',
    assignedBy: 'proposal-manager-1',
    updatedAt: '2024-01-18T09:15:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      logger.warn('Unauthorized SME assignments access attempt');
      return createApiErrorResponse(
        'Unauthorized access',
        'Unauthorized access',
        ErrorCodes.AUTH.UNAUTHORIZED
      );
    }

    // Check if user has appropriate role to access SME assignments
    const userRoles = session.user.roles || [];
    const canAccessAssignments =
      userRoles.includes('Technical SME') ||
      userRoles.includes('Proposal Manager') ||
      userRoles.includes('Administrator');

    if (!canAccessAssignments) {
      logger.warn('Insufficient permissions for SME assignments access', {
        userId: session.user.id,
        userRoles,
      });
      return createApiErrorResponse(
        'Insufficient permissions to access SME assignments',
        'Insufficient permissions to access SME assignments',
        ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS
      );
    }

    // Filter assignments based on user role
    let filteredAssignments = mockAssignments;

    // If user is SME, only show their assignments
    if (userRoles.includes('Technical SME') && !userRoles.includes('Administrator')) {
      filteredAssignments = filteredAssignments.filter(a => a.smeEmail === session.user.email);
    }

    logger.info('SME assignments retrieved', {
      userId: session.user.id,
      userRoles,
      resultsCount: filteredAssignments.length,
    });

    return NextResponse.json({
      success: true,
      data: filteredAssignments,
      pagination: {
        total: filteredAssignments.length,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
      metadata: {
        userRole: userRoles[0] || 'Unknown',
      },
    });
  } catch (error) {
    logger.error('SME assignments retrieval error:', error);

    return createApiErrorResponse(
      error,
      'Internal server error during SME assignments retrieval',
      ErrorCodes.SYSTEM.INTERNAL_ERROR
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return createApiErrorResponse(
        'Unauthorized access',
        'Unauthorized access',
        ErrorCodes.AUTH.UNAUTHORIZED
      );
    }

    // Check if user has permission to create assignments
    const userRoles = session.user.roles || [];
    const canCreateAssignments =
      userRoles.includes('Proposal Manager') || userRoles.includes('Administrator');

    if (!canCreateAssignments) {
      return createApiErrorResponse(
        'Insufficient permissions to create SME assignments',
        'Insufficient permissions to create SME assignments',
        ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS
      );
    }

    const body = await request.json();

    // Mock assignment creation
    const newAssignment = {
      id: `assignment-${Date.now()}`,
      ...body,
      status: 'ASSIGNED',
      assignedAt: new Date().toISOString(),
      assignedBy: session.user.id,
      updatedAt: new Date().toISOString(),
    };

    logger.info('SME assignment created', {
      assignmentId: newAssignment.id,
      assignedBy: session.user.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: newAssignment,
        message: 'SME assignment created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('SME assignment creation error:', error);

    return createApiErrorResponse(
      error,
      'Internal server error during SME assignment creation',
      ErrorCodes.SYSTEM.INTERNAL_ERROR
    );
  }
}
