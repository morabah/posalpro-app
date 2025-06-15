/**
 * PosalPro MVP2 - SME Assignment API Route
 * Returns SME assignment data for the contributions interface
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

    // Mock SME assignment data
    const assignment = {
      id: 'sme-assignment-001',
      proposalId: 'proposal-001',
      proposalTitle: 'Enterprise Cloud Migration Solution',
      customer: 'TechCorp Industries',
      sectionType: 'technical_specs',
      assignedBy: 'John Smith',
      assignedAt: new Date('2024-12-15T10:00:00Z'),
      dueDate: new Date('2024-12-25T17:00:00Z'),
      status: 'in_progress',
      requirements: [
        'Provide detailed technical specifications for cloud infrastructure',
        'Include security compliance requirements and implementation details',
        'Document integration points with existing systems',
        'Specify performance benchmarks and monitoring requirements',
        'Include disaster recovery and backup strategies',
      ],
      context: {
        proposalValue: 2500000,
        industry: 'Technology',
        complexity: 'high',
        priority: 'critical',
      },
      content: {
        draft:
          'This technical specification outlines the comprehensive cloud migration strategy for TechCorp Industries...',
        wordCount: 156,
        lastSaved: new Date('2024-12-19T14:30:00Z'),
        version: 3,
      },
    };

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('SME Assignment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
