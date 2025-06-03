/**
 * PosalPro MVP2 - Proposals API Routes
 * Handles proposal CRUD operations
 * Based on PROPOSAL_CREATION_SCREEN.md and proposal management requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Direct imports to avoid potential module resolution issues
import { generateProposalId, mockProposalsDB } from '../../../lib/db/mockProposals';
import { ProposalStatus } from '../../../types/enums';

// Define the schema inline to avoid import issues
const proposalMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  clientName: z
    .string()
    .min(1, 'Client name is required')
    .max(100, 'Client name must be less than 100 characters'),
  clientContact: z.object({
    name: z.string().min(1, 'Contact name is required'),
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
  }),
  projectType: z.enum([
    'consulting',
    'development',
    'design',
    'strategy',
    'implementation',
    'maintenance',
  ]),
  estimatedValue: z.number().min(0, 'Estimated value must be positive').optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter ISO code').default('USD'),
  deadline: z.date().refine(date => date > new Date(), 'Deadline must be in the future'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  tags: z.array(z.string()).max(20, 'Maximum 20 tags allowed'),
});

const createProposalSchema = z.object({
  metadata: proposalMetadataSchema,
});

/**
 * GET /api/proposals - List proposals with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    // Get all proposals
    let proposals = mockProposalsDB.getAll();

    // Apply filters
    if (search) {
      proposals = proposals.filter(
        p =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.clientName.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status) {
      proposals = proposals.filter(p => p.status === status);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProposals = proposals.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedProposals,
      message: 'Proposals retrieved successfully',
      pagination: {
        page,
        limit,
        total: proposals.length,
        totalPages: Math.ceil(proposals.length / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch proposals:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch proposals',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/proposals - Create new proposal
 */
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/proposals - Starting proposal creation');
    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));

    // Transform date strings to Date objects for validation
    if (body.metadata?.deadline && typeof body.metadata.deadline === 'string') {
      body.metadata.deadline = new Date(body.metadata.deadline);
    }

    console.log('Transformed body:', JSON.stringify(body, null, 2));

    // Validate the request body
    const validatedData = createProposalSchema.parse(body);
    console.log('Validation successful');

    // Generate proposal data
    const proposalId = generateProposalId();
    const now = new Date();

    const proposalData = {
      id: proposalId,
      ...validatedData.metadata,
      status: ProposalStatus.DRAFT,
      createdBy: 'current-user-id', // Would come from auth context
      assignedTo: [],
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    console.log('Proposal data prepared:', JSON.stringify(proposalData, null, 2));

    // Store in shared mock database
    mockProposalsDB.create(proposalId, proposalData);
    console.log('Proposal stored in database');

    return NextResponse.json({
      success: true,
      data: proposalData,
      message: 'Proposal created successfully',
    });
  } catch (error) {
    console.error('Failed to create proposal:', error);

    if (error instanceof z.ZodError) {
      console.error('Validation error details:', error.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create proposal',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
