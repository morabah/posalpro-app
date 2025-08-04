/**
 * PosalPro MVP2 - SME Versions API Route
 * Returns version history for SME contributions
 */

import { authOptions } from '@/lib/auth';
import { logger } from '@/utils/logger';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Mock versions data
const mockVersions = [
  {
    id: 'version-1',
    assignmentId: 'sme-assignment-001',
    version: 3,
    content:
      'This technical specification outlines the comprehensive cloud migration strategy for TechCorp Industries...',
    wordCount: 156,
    createdBy: 'sarah.johnson@posalpro.com',
    createdAt: new Date('2024-12-19T14:30:00Z'),
    changes: 'Updated technical specifications with cloud architecture details',
    status: 'draft',
  },
  {
    id: 'version-2',
    assignmentId: 'sme-assignment-001',
    version: 2,
    content: 'This technical specification provides cloud migration strategy...',
    wordCount: 142,
    createdBy: 'sarah.johnson@posalpro.com',
    createdAt: new Date('2024-12-18T11:15:00Z'),
    changes: 'Added security compliance requirements',
    status: 'draft',
  },
  {
    id: 'version-3',
    assignmentId: 'sme-assignment-001',
    version: 1,
    content: 'Technical specification for cloud migration...',
    wordCount: 98,
    createdBy: 'sarah.johnson@posalpro.com',
    createdAt: new Date('2024-12-17T09:00:00Z'),
    changes: 'Initial draft created',
    status: 'draft',
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    logger.info('SME versions retrieved', {
      userId: session.user.id,
      versionsCount: mockVersions.length,
    });

    return NextResponse.json({
      success: true,
      data: mockVersions,
      message: 'SME versions retrieved successfully',
    });
  } catch (error) {
    logger.error('SME Versions API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve SME versions',
      },
      { status: 500 }
    );
  }
}
