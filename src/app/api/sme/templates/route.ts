/**
 * PosalPro MVP2 - SME Templates API Route
 * Returns contribution templates for SME interface
 */

import { authOptions } from '@/lib/auth';
import { logger } from '@/utils/logger';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Mock templates data
const mockTemplates = [
  {
    id: 'template-1',
    name: 'Technical Specification Template',
    category: 'technical',
    description: 'Standard template for technical specifications',
    content: 'This technical specification provides...',
    wordCount: 250,
    tags: ['technical', 'specification', 'cloud'],
    createdBy: 'admin@posalpro.com',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: 'template-2',
    name: 'Security Assessment Template',
    category: 'security',
    description: 'Comprehensive security assessment template',
    content: 'This security assessment covers...',
    wordCount: 300,
    tags: ['security', 'assessment', 'compliance'],
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

    logger.info('SME templates retrieved', {
      userId: session.user.id,
      templatesCount: mockTemplates.length,
    });

    return NextResponse.json({
      success: true,
      data: mockTemplates,
      message: 'SME templates retrieved successfully',
    });
  } catch (error) {
    logger.error('SME Templates API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve SME templates',
      },
      { status: 500 }
    );
  }
}
