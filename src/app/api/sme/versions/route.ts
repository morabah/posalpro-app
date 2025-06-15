/**
 * PosalPro MVP2 - SME Versions API Route
 * Returns version history for SME contributions
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

    // Mock version history data
    const versions = [
      {
        id: 'version-003',
        version: 3,
        content:
          'This technical specification outlines the comprehensive cloud migration strategy for TechCorp Industries. The solution encompasses a multi-phase approach to migrating existing on-premises infrastructure to a hybrid cloud environment...',
        savedAt: new Date('2024-12-19T14:30:00Z'),
        wordCount: 156,
        changesSummary: 'Added security compliance section and updated integration requirements',
        autoSaved: false,
      },
      {
        id: 'version-002',
        version: 2,
        content:
          'This technical specification outlines the cloud migration strategy for TechCorp Industries. The solution includes infrastructure assessment and migration planning...',
        savedAt: new Date('2024-12-19T12:15:00Z'),
        wordCount: 98,
        changesSummary: 'Expanded technical requirements and added performance benchmarks',
        autoSaved: true,
      },
      {
        id: 'version-001',
        version: 1,
        content:
          'Initial draft for TechCorp Industries cloud migration technical specifications...',
        savedAt: new Date('2024-12-19T10:00:00Z'),
        wordCount: 45,
        changesSummary: 'Initial draft created',
        autoSaved: false,
      },
    ];

    return NextResponse.json(versions);
  } catch (error) {
    console.error('SME Versions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
