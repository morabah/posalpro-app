/**
 * PosalPro MVP2 - SME Templates API Route
 * Returns contribution templates for SME interface
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

    // Mock templates data
    const templates = [
      {
        id: 'template-001',
        type: 'technical_specifications',
        title: 'Technical Specifications Template',
        description: 'Comprehensive template for technical requirements and specifications',
        estimatedTime: 45,
        difficulty: 'intermediate',
        sections: [
          {
            id: 'section-001',
            title: 'System Architecture',
            placeholder: 'Describe the overall system architecture...',
            required: true,
            guidance: 'Include high-level diagrams and component descriptions',
          },
          {
            id: 'section-002',
            title: 'Technical Requirements',
            placeholder: 'List specific technical requirements...',
            required: true,
            guidance: 'Be specific about performance, scalability, and compatibility requirements',
          },
          {
            id: 'section-003',
            title: 'Integration Points',
            placeholder: 'Detail integration requirements...',
            required: false,
            guidance: 'Include APIs, data flows, and third-party integrations',
          },
        ],
      },
      {
        id: 'template-002',
        type: 'security_assessment',
        title: 'Security Assessment Template',
        description: 'Template for security compliance and risk assessment',
        estimatedTime: 60,
        difficulty: 'advanced',
        sections: [
          {
            id: 'section-004',
            title: 'Security Framework',
            placeholder: 'Outline the security framework...',
            required: true,
            guidance: 'Reference industry standards like ISO 27001, NIST, etc.',
          },
          {
            id: 'section-005',
            title: 'Risk Assessment',
            placeholder: 'Identify and assess security risks...',
            required: true,
            guidance: 'Include risk matrix and mitigation strategies',
          },
        ],
      },
      {
        id: 'template-003',
        type: 'implementation_plan',
        title: 'Implementation Plan Template',
        description: 'Step-by-step implementation planning template',
        estimatedTime: 30,
        difficulty: 'beginner',
        sections: [
          {
            id: 'section-006',
            title: 'Implementation Phases',
            placeholder: 'Define implementation phases...',
            required: true,
            guidance: 'Break down into manageable phases with timelines',
          },
          {
            id: 'section-007',
            title: 'Resource Requirements',
            placeholder: 'List required resources...',
            required: true,
            guidance: 'Include personnel, tools, and infrastructure needs',
          },
        ],
      },
    ];

    return NextResponse.json(templates);
  } catch (error) {
    console.error('SME Templates API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
