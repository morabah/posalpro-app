/**
 * PosalPro MVP2 - SME Resources API Route
 * Returns contribution resources for SME interface
 */

import { authOptions } from '@/lib/auth';
import { logger } from '@/utils/logger';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Mock resources data
const mockResources = [
  {
    id: 'resource-1',
    name: 'Cloud Architecture Guide',
    type: 'documentation',
    url: 'https://docs.posalpro.com/cloud-architecture',
    description: 'Comprehensive guide for cloud architecture best practices',
    category: 'technical',
    tags: ['cloud', 'architecture', 'best-practices'],
    createdBy: 'admin@posalpro.com',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: 'resource-2',
    name: 'Security Compliance Checklist',
    type: 'checklist',
    url: 'https://docs.posalpro.com/security-checklist',
    description: 'Security compliance requirements checklist',
    category: 'security',
    tags: ['security', 'compliance', 'checklist'],
    createdBy: 'admin@posalpro.com',
    createdAt: new Date('2024-01-16T14:30:00Z'),
    updatedAt: new Date('2024-01-16T14:30:00Z'),
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

    logger.info('SME resources retrieved', {
      userId: session.user.id,
      resourcesCount: mockResources.length,
    });

    return NextResponse.json({
      success: true,
      data: mockResources,
      message: 'SME resources retrieved successfully',
    });
  } catch (error) {
    logger.error('SME Resources API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve SME resources',
      },
      { status: 500 }
    );
  }
}
