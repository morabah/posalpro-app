import { logger } from '@/utils/logger';/**
 * PosalPro MVP2 - SME Resources API Route
 * Returns resources for SME contributions
 */

import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock resources data
    const resources = [
      {
        id: 'resource-001',
        title: 'Cloud Architecture Best Practices',
        type: 'document',
        url: '/resources/cloud-architecture-guide.pdf',
        description: 'Comprehensive guide to cloud architecture patterns and best practices',
        relevanceScore: 95,
      },
      {
        id: 'resource-002',
        title: 'Security Compliance Framework',
        type: 'specification',
        url: '/resources/security-compliance.pdf',
        description:
          'Industry standard security compliance requirements and implementation guidelines',
        relevanceScore: 88,
      },
      {
        id: 'resource-003',
        title: 'Enterprise Integration Patterns',
        type: 'example',
        url: '/resources/integration-patterns.pdf',
        description: 'Common integration patterns for enterprise systems',
        relevanceScore: 82,
      },
      {
        id: 'resource-004',
        title: 'ISO 27001 Standard',
        type: 'standard',
        url: '/resources/iso-27001.pdf',
        description: 'International standard for information security management systems',
        relevanceScore: 90,
      },
      {
        id: 'resource-005',
        title: 'Cloud Migration Case Study',
        type: 'example',
        url: '/resources/migration-case-study.pdf',
        description: 'Real-world example of successful enterprise cloud migration',
        relevanceScore: 85,
      },
      {
        id: 'resource-006',
        title: 'Performance Monitoring Guidelines',
        type: 'document',
        url: '/resources/performance-monitoring.pdf',
        description: 'Best practices for monitoring cloud infrastructure performance',
        relevanceScore: 78,
      },
      {
        id: 'resource-007',
        title: 'Disaster Recovery Planning',
        type: 'specification',
        url: '/resources/disaster-recovery.pdf',
        description: 'Comprehensive disaster recovery planning and implementation guide',
        relevanceScore: 92,
      },
      {
        id: 'resource-008',
        title: 'API Design Standards',
        type: 'standard',
        url: '/resources/api-design-standards.pdf',
        description: 'Industry standards for RESTful API design and implementation',
        relevanceScore: 75,
      },
    ];

    return NextResponse.json(resources);
  } catch (error) {
    logger.error('SME Resources API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
